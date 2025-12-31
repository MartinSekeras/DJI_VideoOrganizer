const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { promises: fsp } = fs;

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-source', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('select-dest', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled ? null : filePaths[0];
});

ipcMain.on('start-organize', async (event, { source, dest }) => {
  const reply = (channel, ...args) => event.sender.send(channel, ...args);

  reply('set-start-enabled', false);
  reply('clear-log');
  reply('update-status', 'Scanning files...');
  reply('update-progress', 0);

  try {
    const entries = await fsp.readdir(source, { withFileTypes: true });

    const validFiles = [];
    const skipped = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        skipped.push(`Not a file: ${entry.name}`);
        continue;
      }

      const name = entry.name;
      if (!name.startsWith('DJI_') || !name.toLowerCase().endsWith('.mp4')) {
        skipped.push(`Skipped (not DJI mp4): ${name}`);
        continue;
      }

      const dateStr = name.substring(4, 12);
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10);
      const day = parseInt(dateStr.substring(6, 8), 10);

      const date = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(date.getTime())) {
        skipped.push(`Invalid date: ${name}`);
        continue;
      }

      const fullPath = path.join(source, name);
      const size = (await fsp.stat(fullPath)).size;

      validFiles.push({ name, fullPath, size, date });
    }

    if (skipped.length > 0) {
      reply('append-log', `Skipped ${skipped.length} items:`);
      skipped.forEach(s => reply('append-log', `  ${s}`));
    }

    reply('append-log', `Found ${validFiles.length} valid videos to organize.`);

    if (validFiles.length === 0) {
      reply('update-status', 'Nothing to do.');
      reply('set-start-enabled', true);
      return;
    }

    const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    reply('append-log', `Total size: ${(totalSize / 1e9).toFixed(2)} GB`);

    let copiedBytes = 0;
    let successful = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const { name, fullPath, size, date } = validFiles[i];

      reply('append-log', `Processing ${i + 1}/${validFiles.length}: ${name}`);
      reply('update-status', `Copying ${name} (${i + 1}/${validFiles.length})`);

      const year = date.getUTCFullYear();
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const weekday = date.toLocaleString('en-US', { weekday: 'long' });
      const dayPad = String(date.getUTCDate()).padStart(2, '0');

      const targetDir = path.join(dest, String(year), monthName, `${dayPad} - ${weekday}`);
      const targetPath = path.join(targetDir, name);

      try {
        await fsp.mkdir(targetDir, { recursive: true });

        const rs = fs.createReadStream(fullPath);
        const ws = fs.createWriteStream(targetPath);

        await new Promise((resolve, reject) => {
          rs.on('error', reject);
          ws.on('error', reject);
          ws.on('close', resolve);

          let lastProg = -1;
          rs.on('data', (chunk) => {
            copiedBytes += chunk.length;
            const prog = Math.round((copiedBytes / totalSize) * 100);
            if (prog > lastProg) {
              reply('update-progress', prog);
              reply('update-status', `Copying ${name} - ${prog}% overall`);
              lastProg = prog;
            }
          });

          rs.pipe(ws);
        });

        successful++;
        reply('append-log', `Copied: ${name}`);

      } catch (err) {
        reply('append-log', `Failed ${name}: ${err.message}`);
      }
    }

    reply('update-status', 'All done');
    reply('update-progress', 100);
    reply('append-log', `Successfully organized ${successful} of ${validFiles.length} files.`);
    reply('set-start-enabled', true);

  } catch (err) {
    reply('append-log', `Error: ${err.message}`);
    reply('update-status', 'Failed');
    reply('set-start-enabled', true);
  }
});
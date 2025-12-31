const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectSource: () => ipcRenderer.invoke('select-source'),
  selectDest: () => ipcRenderer.invoke('select-dest'),
  startOrganize: (source, dest) => ipcRenderer.send('start-organize', { source, dest }),
  onClearLog: (cb) => ipcRenderer.on('clear-log', () => cb()),
  onAppendLog: (cb) => ipcRenderer.on('append-log', (_, msg) => cb(msg)),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (_, text) => cb(text)),
  onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (_, percent) => cb(percent)),
  onSetStartEnabled: (cb) => ipcRenderer.on('set-start-enabled', (_, enabled) => cb(enabled))
});
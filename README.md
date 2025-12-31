# DJI Video Organizer

A simple, modern desktop app that organizes video files from DJI Action cameras (like the DJI Osmo Action 5 Pro) by their recording date.

It reads filenames like `DJI_20251121134200_0001_D_A01.mp4`, pulls the date from the filename (`20251121` becomes 2025-11-21), figures out the month name and weekday, and copies the videos into a clean folder structure:

Destination Folder/
└── 2025/
└── November/
└── 21 - Thursday/
├── DJI_20251121134200_0001_D_A01.mp4
└── DJI_20251121140950_0002_D_A01.mp4

Videos land directly in the date folder, no extra subfolders.

The app has a dark, clean UI built with HTML/CSS:
- Folder pickers for source and destination
- Real-time progress bar that tracks actual bytes copied (great for huge files)
- Live status showing current file and overall percentage
- Scrolling log with full details: what was copied, skipped, or failed

Only files starting with `DJI_` and ending in `.mp4` (case-insensitive) are processed. Everything else gets skipped and noted in the log.

## Why JavaScript + Electron (instead of Python or pure Java)

You might wonder why this is built with Electron instead of something like Python with Tkinter or PyQt.

Simple: I don't know Python well, and maintaining a Python app long-term felt risky, especially with dependencies and packaging headaches across machines. Python GUIs also tend to look dated or require heavy frameworks.

I started with a pure Java Swing version (single-file, no extras), but the look was stuck in the 90s even with FlatLaf. I wanted something truly modern: custom dark theme, rounded buttons, smooth progress bar, nice fonts.

Electron gives full HTML/CSS/JS control over the UI, so we could make it look sharp and feel native. Plus, building a standalone double-clickable .exe is straightforward with electron-builder, no installer needed. It's overkill for tiny apps, but for a polished tool you'll use often, it's worth it.

(If someone really wants a Python version later, it's doable, but this one is easier to customize and distribute for me.)

## How to Use

### Easiest: Download the pre-built exe

1. Go to the [Releases page](https://github.com/MartinSekeras/DJI_VideoOrganizer/releases)
2. Grab the latest `DJI-Video-Organizer.exe`
3. Double-click to run, no setup required

It's portable and bundles everything inside.

### Or run from source (needs Node.js)

1. Install Node.js LTS from https://nodejs.org
2. Clone or download this repo
3. Open terminal in the folder and run: "npm install" -> "npm start". And it should fire up straight away.

## Build your own exe

Want the latest changes compiled without waiting for me to upload updated .exe?

1. Install Node.js if you haven't
2. In the project folder: "npm install" -> "npm run dist". (Just a note, you probably don't have to do "npm install" 
   again if you're runing from source and just want to build the executable version. package.json already has all dependicies
   included so npm install  should install everything include electron builder. Then simply run "npm run dist" to build the executable.)
3. Find `DJI-Video-Organizer.exe` in the new `dist` folder

First build takes a few minutes (downloads packaging tools). Run the command as Administrator if it complains about symlinks.

## Requirements

- Any OS should be fine if runing from source. For executable, only Windows is supported for now.
- Node.js 20+ if building or running from source

## Contributing

Open issues or PRs if you find bugs or want features (recursive scan, move instead of copy, light mode toggle, etc.).

Enjoy your organized footage!
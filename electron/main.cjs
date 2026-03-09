const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;

let mainWindow;
let nextProcess;

async function startRenderServer() {
  // Set CWD so all relative paths (data/, cache/, public/uploads/) resolve correctly
  const rootDir = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app');

  process.chdir(rootDir);

  // Set data paths — in production use userData for persistence across updates
  if (!isDev) {
    const userDataPath = app.getPath('userData');
    process.env.RENDOMAT_DATA_DIR = path.join(userDataPath, 'data');
    process.env.RENDOMAT_UPLOADS_DIR = path.join(userDataPath, 'uploads');
  }

  // Dynamic import of the ESM render server (Windows requires file:// URL)
  const serverPath = path.join(rootDir, 'server', 'render-server.mjs');
  const { startServer } = await import(pathToFileURL(serverPath).href);

  await startServer(4321);
  console.log('Render server started on http://localhost:4321');
}

function startNextDev() {
  return new Promise((resolve) => {
    const rootDir = path.join(__dirname, '..');
    nextProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(rootDir, 'app'),
      shell: true,
      stdio: 'pipe',
    });

    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[next] ${output}`);
      // Resolve once Next.js is ready
      if (output.includes('Ready') || output.includes('localhost:')) {
        resolve();
      }
    });

    nextProcess.stderr.on('data', (data) => {
      process.stderr.write(`[next] ${data}`);
    });

    // Fallback: resolve after 10 seconds even if no "Ready" message
    setTimeout(resolve, 10000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Rendomat',
    backgroundColor: '#1a1816',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Remove default menu bar in production
    autoHideMenuBar: !isDev,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3456');
    mainWindow.webContents.openDevTools();
  } else {
    // Load static Next.js export
    mainWindow.loadFile(path.join(process.resourcesPath, 'app', 'app', 'out', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for native dialogs
ipcMain.handle('save-file-dialog', async (_event, options) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showSaveDialog(mainWindow, {
    defaultPath: options?.defaultPath,
    filters: options?.filters || [{ name: 'Video', extensions: ['mp4'] }],
  });
});

ipcMain.handle('show-item-in-folder', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

app.whenReady().then(async () => {
  try {
    await startRenderServer();

    if (isDev) {
      await startNextDev();
    }

    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  app.quit();
});

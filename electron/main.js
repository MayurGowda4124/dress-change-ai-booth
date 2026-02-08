const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const SERVER_PORT = 2929;
let mainWindow = null;
let serverInstance = null;

function getAppDir() {
  if (app.isPackaged && __dirname.includes('app.asar')) {
    return path.dirname(__dirname).replace('app.asar', 'app.asar.unpacked');
  }
  return path.join(__dirname, '..');
}

function startBackend() {
  const appDir = getAppDir();
  const serverPath = path.join(appDir, 'server.js');
  if (!fs.existsSync(serverPath)) {
    console.error('Server not found at', serverPath);
    return null;
  }
  process.chdir(appDir);
  const { startServer } = require(serverPath);
  serverInstance = startServer(SERVER_PORT);
  return serverInstance;
}

function waitForServer(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '..', 'public', 'images', 'Ui_Ux_img', 'Theme.png'),
  });

  const url = `http://localhost:${SERVER_PORT}`;
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();
  await waitForServer(800);
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverInstance && typeof serverInstance.close === 'function') {
    serverInstance.close();
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { initDatabase } from './services/database/init';
import { registerCompanyHandlers } from './ipc/companyHandlers';
import { registerTeamHandlers } from './ipc/teamHandlers';
import { registerAgentHandlers } from './ipc/agentHandlers';
import { registerTaskHandlers } from './ipc/taskHandlers';
import { registerChatHandlers } from './ipc/chatHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'BuildCorp',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 40,
    },
  });

  if (isDev) {
    const port = process.env.VITE_PORT || '5173';
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const preloadPath = path.join(__dirname, 'preload.js');
  const fs = require('fs');
  console.log('[BuildCorp] Preload path:', preloadPath);
  console.log('[BuildCorp] Preload exists:', fs.existsSync(preloadPath));
  console.log('[BuildCorp] __dirname:', __dirname);

  // Initialize database
  const db = initDatabase();

  // Register IPC handlers
  registerCompanyHandlers(ipcMain, db);
  registerTeamHandlers(ipcMain, db);
  registerAgentHandlers(ipcMain, db);
  registerTaskHandlers(ipcMain, db);
  registerChatHandlers(ipcMain, db);
  registerSettingsHandlers(ipcMain, db);

  // 폴더 선택 다이얼로그
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

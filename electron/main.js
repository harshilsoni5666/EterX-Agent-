const path = require('path');
const fs = require('fs');

// Attempt to read Google API Key from Next.js local environment variables to unlock Chromium's Speech Engine
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/VITE_SEARCH_API_KEY_1=([^\n\r]+)/) || envFile.match(/GEMINI_API_KEY_1=([^\n\r]+)/) || envFile.match(/VITE_API_KEY=([^\n\r]+)/);
    if (match && match[1]) {
      process.env.GOOGLE_API_KEY = match[1].trim();
      process.env.GOOGLE_DEFAULT_CLIENT_ID = 'electron-dummy';
      process.env.GOOGLE_DEFAULT_CLIENT_SECRET = 'electron-dummy';
    }
  }
} catch (e) {
  console.warn('Could not inject Google API key for Web Speech:', e);
}

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
app.setName('EterX');
app.setAppUserModelId('EterX');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#171717', // Match the EterX root black
    title: 'EterX', // Defines standard Task Manager/Taskbar labeling
    icon: path.join(__dirname, '../public/logo.png'), // Explicit application taskbar Favicon mapping
    titleBarStyle: 'hidden', // Provides the modern frame-less aesthetic while preserving OS buttons
    titleBarOverlay: {
      color: '#171717',
      symbolColor: '#d1d1d1',
      height: 38
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Since we are running Next.js dynamically in 'desktop' mode, load port 3000.
  // In production builds, this would be updated to load local static bundles.
  mainWindow.loadURL('http://localhost:3000');

  // Handle Permissions (Microphone, Camera) automatically
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'audioCapture', 'videoCapture'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    const allowedPermissions = ['media', 'audioCapture', 'videoCapture'];
    return allowedPermissions.includes(permission);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC: Native folder dialog for Code view
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Folder'
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// IPC: Native files dialog
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files to Pin'
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths;
});

// IPC: List folder contents for browsing
ipcMain.handle('list-folder', async (event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => {
        const full = path.join(folderPath, e.name);
        let isProject = false;
        try {
          const files = fs.readdirSync(full);
          isProject = files.some(f => ['package.json', 'Cargo.toml', 'go.mod', '.git', 'tsconfig.json', 'pyproject.toml'].includes(f));
        } catch {}
        return { name: e.name, path: full, isProject };
      })
      .sort((a, b) => (a.isProject === b.isProject ? a.name.localeCompare(b.name) : a.isProject ? -1 : 1));
  } catch { return []; }
});

// IPC: Native System Notifications
ipcMain.handle('show-notification', (event, title, body) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
    }).show();
  }
});

// IPC: Open URL in system default browser
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

app.on('ready', () => {
  const { session } = require('electron');
  
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      return true;
    }
    return false;
  });

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

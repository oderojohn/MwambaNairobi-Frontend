const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// Disable hardware acceleration for better input handling
app.disableHardwareAcceleration();

// Additional flags for better input handling
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-compositing');

// Configure logging
log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB

// Log app start
log.info('MwambaPOS starting...');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Fixed window dimensions (fullscreen-like)
const WINDOW_WIDTH = 1500;
const WINDOW_HEIGHT = 800;

let mainWindow;

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_WIDTH,  // Cannot resize smaller than initial size
    minHeight: WINDOW_HEIGHT, // Cannot resize smaller than initial size
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    show: false,
    backgroundColor: '#ffffff',
    title: 'MwambaPOS',
    autoHideMenuBar: true,
    resizable: true
  });

  // Allow navigation to API server
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*']
      }
    });
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show');
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle focus
  mainWindow.on('focus', () => {
    log.info('Window focused');
  });

  // Load the app
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Development: load from localhost
    // Try different ports if 3001 doesn't work
    mainWindow.loadURL('http://localhost:3001').catch(err => {
      log.error('Failed to load localhost:3001, trying 3000:', err);
      return mainWindow.loadURL('http://localhost:3000');
    }).catch(err => {
      log.error('Failed to load localhost:3000, trying 8080:', err);
      return mainWindow.loadURL('http://localhost:8080');
    });
    log.info('Loading dev server...');
    
    // Open DevTools in development - press F12 to debug
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from build folder
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
    log.info('Loading production build');
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    log.info('Main window closed');
    mainWindow = null;
  });

  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    log.error('Renderer process crashed, killed:', killed);
  });
}

// App ready
app.whenReady().then(() => {
  log.info('App is ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// App quit
app.on('quit', () => {
  log.info('App quitting');
});

// IPC handlers for future use (e.g., printer, serial devices)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

log.info('Main process initialized');

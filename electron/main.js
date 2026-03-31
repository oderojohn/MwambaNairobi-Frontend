const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
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
let djangoProcess = null;
let isDev = !app.isPackaged;

// Check if running in development
const isElectronDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

function startDjangoServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, Django should already be running
      log.info('Development mode: expecting Django server on port 8001');
      resolve();
      return;
    }

    // In production, start Django server
    log.info('Starting Django server...');
    
    // Get the path to Django backend and Python (works in both dev and production)
    let djangoPath;
    let pythonExe;
    
    if (app.isPackaged) {
      // Production: use bundled resources
      const basePath = process.resourcesPath;
      
      // Try multiple possible locations for Python
      const possiblePythonPaths = [
        path.join(__dirname, 'python', 'python.exe'),
        path.join(__dirname, '..', 'python', 'python.exe'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'python', 'python.exe'),
        path.join(process.resourcesPath, 'python', 'python.exe')
      ];
      
      for (const p of possiblePythonPaths) {
        if (require('fs').existsSync(p)) {
          pythonExe = p;
          break;
        }
      }
      
      if (!pythonExe) {
        pythonExe = 'python';  // Fallback to system Python
      }
      
      // Django path
      djangoPath = path.join(process.resourcesPath, 'POS-BACKEND');
      
      // Check if Django exists in unpacked resources
      if (!require('fs').existsSync(djangoPath)) {
        djangoPath = path.join(__dirname, '..', 'POS-BACKEND');
      }
      
      log.info('Django path:', djangoPath);
      log.info('Python executable:', pythonExe);
      
      djangoProcess = spawn(pythonExe, ['manage.py', 'runserver', '0.0.0.0:8001', '--noreload'], {
        cwd: djangoPath,
        detached: false,
        stdio: 'pipe',
        shell: true
      });

    djangoProcess.stdout.on('data', (data) => {
      log.info(`Django: ${data}`);
      if (data.toString().includes('Starting development server') || data.toString().includes('Serving on')) {
        setTimeout(resolve, 2000); // Wait 2 seconds for server to be ready
      }
    });

    djangoProcess.stderr.on('data', (data) => {
      log.error(`Django error: ${data}`);
    });

    djangoProcess.on('error', (error) => {
      log.error('Failed to start Django:', error);
      reject(error);
    });

    // Kill Django process when app closes
    app.on('will-quit', () => {
      if (djangoProcess) {
        djangoProcess.kill();
        log.info('Django server stopped');
      }
    });
  });
}

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT,
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
  if (isDev) {
    // Development: load from localhost
    mainWindow.loadURL('http://localhost:3001').catch(err => {
      log.error('Failed to load localhost:3001, trying 3000:', err);
      return mainWindow.loadURL('http://localhost:3000');
    }).catch(err => {
      log.error('Failed to load localhost:3000:', err);
    });
    log.info('Loading dev server...');
    
    // Open DevTools in development - press F12 to debug
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from build folder
    let buildPath;
    
    // Try multiple possible locations for the build
    const possibleBuildPaths = [
      path.join(process.resourcesPath, 'build', 'index.html'),
      path.join(__dirname, '..', 'build', 'index.html'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'index.html')
    ];
    
    for (const p of possibleBuildPaths) {
      if (require('fs').existsSync(p)) {
        buildPath = p;
        break;
      }
    }
    
    if (!buildPath) {
      buildPath = possibleBuildPaths[0];  // Use first as default
    }
    
    log.info('Loading production build from:', buildPath);
    mainWindow.loadFile(buildPath);
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
app.whenReady().then(async () => {
  log.info('App is ready');
  
  try {
    await startDjangoServer();
    createWindow();
  } catch (error) {
    log.error('Failed to start application:', error);
    app.quit();
  }

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
  if (djangoProcess) {
    djangoProcess.kill();
  }
});

// IPC handlers for future use (e.g., printer, serial devices)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

log.info('Main process initialized');

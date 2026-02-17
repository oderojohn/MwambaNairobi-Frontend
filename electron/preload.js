const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Print functionality
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
  
  // Device communication (for future barcode scanners, etc.)
  onDeviceConnected: (callback) => ipcRenderer.on('device-connected', callback),
  onDeviceDisconnected: (callback) => ipcRenderer.on('device-disconnected', callback)
});

console.log('Preload script loaded');

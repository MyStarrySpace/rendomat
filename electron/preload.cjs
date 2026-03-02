const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
});

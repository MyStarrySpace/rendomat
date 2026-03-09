const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});

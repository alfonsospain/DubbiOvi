const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  openDetachedWindow: (url) => ipcRenderer.send('open-detached-video', url),
  closeDetachedWindow: () => ipcRenderer.send('close-detached-video'),
  onDetachedWindowStatus: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on('detached-window-status', subscription);
    return () => ipcRenderer.removeListener('detached-window-status', subscription);
  }
});


const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loading preload script...');

try {
  const api = {
    getConfig: () => ipcRenderer.invoke('get-config'),
    setDownloadsFolder: (folderPath) => ipcRenderer.invoke('set-downloads-folder', folderPath),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    startService: (forceNewSession = false) => ipcRenderer.invoke('start-service', forceNewSession),
    stopService: () => ipcRenderer.invoke('stop-service'),
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
    getLogPath: () => ipcRenderer.invoke('get-log-path'),
    getSupportedExtensions: () => ipcRenderer.invoke('get-supported-extensions'),
    checkUpdate: () => ipcRenderer.invoke('check-update'),

    onLog: (callback) => {
      ipcRenderer.on('log', (event, data) => callback(data));
    },

    onQR: (callback) => {
      ipcRenderer.on('qr', (event, qr) => callback(qr));
    },

    onStatus: (callback) => {
      ipcRenderer.on('status', (event, data) => callback(data));
    },

    onUpdateStatus: (callback) => {
      ipcRenderer.on('update-status', (event, data) => callback(data));
    },

    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  };

  contextBridge.exposeInMainWorld('api', api);
  console.log('[Preload] API exposed to renderer:', Object.keys(api));
} catch (err) {
  console.error('[Preload] Error:', err);
}

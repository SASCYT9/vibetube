const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    updateProgress: (percentage) => ipcRenderer.send('playback-progress-changed', percentage),
    toggleMiniPlayer: (isMini) => ipcRenderer.send('window-toggle-mini', isMini)
});

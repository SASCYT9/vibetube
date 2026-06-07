const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    updateProgress: (percentage) => ipcRenderer.send('playback-progress-changed', percentage),
    toggleMiniPlayer: (isMini) => ipcRenderer.send('window-toggle-mini', isMini),
    getSystemAccentColor: () => ipcRenderer.invoke('get-system-accent-color'),
    onGlobalShortcutMedia: (callback) => ipcRenderer.on('global-shortcut-media', (event, action) => callback(action)),
    updateTrackMetadata: (data) => ipcRenderer.send('track-changed', data)
});

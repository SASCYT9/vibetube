const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pyServer = null;

// IPC handlers for custom frameless window title bar controls
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// Toggle mini player size and properties
ipcMain.on('window-toggle-mini', (event, isMini) => {
    if (mainWindow) {
        if (isMini) {
            mainWindow.setMinimumSize(340, 400);
            mainWindow.setSize(340, 400);
            mainWindow.setAlwaysOnTop(true);
            mainWindow.setResizable(false);
        } else {
            mainWindow.setResizable(true);
            mainWindow.setMinimumSize(800, 600);
            mainWindow.setSize(1250, 850);
            mainWindow.setAlwaysOnTop(false);
            mainWindow.center();
        }
    }
});

// Update Windows Taskbar progress bar
ipcMain.on('playback-progress-changed', (event, percentage) => {
    if (mainWindow) {
        const val = parseFloat(percentage);
        if (!isNaN(val)) {
            if (val <= 0 || val >= 100) {
                mainWindow.setProgressBar(-1);
            } else {
                mainWindow.setProgressBar(val / 100);
            }
        }
    }
});

function startPythonServer() {
    console.log("Starting Python backend server...");
    pyServer = spawn('python3', [path.join(__dirname, 'youtube_player_server.py')]);
    
    pyServer.stdout.on('data', (data) => {
        console.log(`[Python Output]: ${data}`);
    });
    
    pyServer.stderr.on('data', (data) => {
        console.error(`[Python Error]: ${data}`);
    });
    
    pyServer.on('close', (code) => {
        console.log(`Python server exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1250,
        height: 850,
        title: "VibeTube — YouTube Плеєр з Еквалайзером",
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true, // Hides top menus for a clean native app look
        backgroundColor: '#08090f',
        show: false // Show only when ready to avoid flashing white screen
    });

    // Load page
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:8000');
    }, 1000);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Set App User Model ID for Windows notifications grouping
    app.setAppUserModelId('org.vibetube.player');
    
    startPythonServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    // Gracefully terminate Python proxy server on exit
    if (pyServer) {
        console.log("Terminating Python server...");
        pyServer.kill('SIGINT');
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pyServer) {
        pyServer.kill();
    }
});

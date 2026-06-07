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

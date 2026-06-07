const { app, BrowserWindow, ipcMain, systemPreferences, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pyServer = null;
let tray = null;
let isQuitting = false;

// IPC handlers for custom frameless window title bar controls
ipcMain.handle('get-system-accent-color', () => {
    try {
        if (process.platform === 'win32' || process.platform === 'darwin') {
            if (systemPreferences && typeof systemPreferences.getAccentColor === 'function') {
                return systemPreferences.getAccentColor();
            }
        }
    } catch (e) {
        console.error("Failed to get system accent color:", e);
    }
    return null;
});

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

// Discord Rich Presence (RPC) Implementation via Native Unix Socket / Win Named Pipe
let rpcSocket = null;
const DISCORD_CLIENT_ID = '1198547463560634458'; // VibeTube client ID

const getIpcPath = () => {
    const fs = require('fs');
    if (process.platform === 'win32') return '\\\\.\\pipe\\discord-ipc-0';
    const envs = ['XDG_RUNTIME_DIR', 'TMPDIR', 'TMP', 'TEMP'];
    for (const env of envs) {
        const pathVal = process.env[env];
        if (pathVal) {
            const fullPath = path.join(pathVal, 'discord-ipc-0');
            if (fs.existsSync(fullPath)) return fullPath;
        }
    }
    const uid = process.getuid ? process.getuid() : 1000;
    const linuxFallback = `/run/user/${uid}/discord-ipc-0`;
    if (fs.existsSync(linuxFallback)) return linuxFallback;
    const tmpFallback = '/tmp/discord-ipc-0';
    if (fs.existsSync(tmpFallback)) return tmpFallback;
    return null;
};

function pack(op, data) {
    const payload = JSON.stringify(data);
    const byteLength = Buffer.byteLength(payload);
    const buf = Buffer.alloc(8 + byteLength);
    buf.writeInt32LE(op, 0);
    buf.writeInt32LE(byteLength, 4);
    buf.write(payload, 8, byteLength, 'utf8');
    return buf;
}

function connectDiscordRPC() {
    const net = require('net');
    const ipcPath = getIpcPath();
    if (!ipcPath) {
        console.log("[Discord RPC] IPC socket not found. Make sure Discord is running.");
        return;
    }
    
    console.log("[Discord RPC] Connecting via:", ipcPath);
    rpcSocket = net.createConnection(ipcPath);
    
    rpcSocket.on('connect', () => {
        console.log("[Discord RPC] Connected successfully!");
        // Handshake
        rpcSocket.write(pack(0, { v: 1, client_id: DISCORD_CLIENT_ID }));
    });
    
    rpcSocket.on('data', (data) => {
        // Handshake response or activity set acknowledgment (safe to ignore)
    });
    
    rpcSocket.on('error', (err) => {
        console.log("[Discord RPC] Connection error:", err.message);
        rpcSocket = null;
    });
    
    rpcSocket.on('close', () => {
        console.log("[Discord RPC] Connection closed. Will retry in 20s...");
        rpcSocket = null;
        setTimeout(connectDiscordRPC, 20000); // retry
    });
}

function updateDiscordActivity(title, artist, isPlaying, duration, currentTime) {
    if (!rpcSocket) return;
    
    const activity = {
        details: title ? title.slice(0, 127) : 'Слухає музику',
        state: artist ? artist.slice(0, 127) : 'VibeTube Плеєр',
        assets: {
            large_image: 'vibetube_logo',
            large_text: 'VibeTube',
            small_image: isPlaying ? 'play_icon' : 'pause_icon',
            small_text: isPlaying ? 'Відтворення' : 'Пауза'
        }
    };
    
    if (isPlaying) {
        const start = Date.now();
        activity.timestamps = {
            start: start
        };
        
        if (duration && currentTime !== undefined) {
            const remaining = duration - currentTime;
            if (remaining > 0) {
                activity.timestamps.end = Math.round(start + remaining * 1000);
            }
        }
    }
    
    const packet = {
        cmd: 'SET_ACTIVITY',
        args: {
            pid: process.pid,
            activity: activity
        },
        nonce: Math.random().toString()
    };
    
    try {
        rpcSocket.write(pack(1, packet));
    } catch (e) {
        console.error("[Discord RPC] Failed to write activity payload:", e);
    }
}

ipcMain.on('track-changed', (event, data) => {
    updateDiscordActivity(data.title, data.artist, data.isPlaying, data.duration, data.currentTime);
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
        icon: path.join(__dirname, 'icon.png'),
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

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer Console] ${message} (at ${path.basename(sourceId)}:${line})`);
    });

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip('VibeTube');
    
    const trayMenu = Menu.buildFromTemplate([
        { label: 'VibeTube Плеєр', enabled: false },
        { type: 'separator' },
        { label: 'Відтворити / Пауза', click: () => {
            if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'play-pause');
        }},
        { label: 'Наступний трек', click: () => {
            if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'next');
        }},
        { label: 'Попередній трек', click: () => {
            if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'prev');
        }},
        { type: 'separator' },
        { label: 'Показати вікно', click: () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        }},
        { label: 'Вихід', click: () => {
            isQuitting = true;
            app.quit();
        }}
    ]);
    
    tray.setContextMenu(trayMenu);
    
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function setupAutostart() {
    if (process.platform === 'linux') {
        const fs = require('fs');
        const os = require('os');
        const autostartDir = path.join(os.homedir(), '.config', 'autostart');
        const desktopFilePath = path.join(autostartDir, 'vibetube.desktop');
        
        try {
            if (!fs.existsSync(autostartDir)) {
                fs.mkdirSync(autostartDir, { recursive: true });
            }
            
            const projectDir = __dirname;
            const desktopContent = `[Desktop Entry]
Type=Application
Version=1.0
Name=VibeTube
Comment=Spotify-Style YouTube & SoundCloud Player
Exec=/usr/bin/npm start --prefix ${projectDir}
Icon=${path.join(projectDir, 'icon.png')}
Terminal=false
StartupNotify=false
Categories=Audio;Music;Player;AudioVideo;
X-GNOME-Autostart-enabled=true
`;
            fs.writeFileSync(desktopFilePath, desktopContent, 'utf8');
            console.log("[Autostart] Linux .desktop file created/updated at:", desktopFilePath);
        } catch (e) {
            console.error("[Autostart] Failed to setup Linux autostart:", e);
        }
    } else {
        try {
            app.setLoginItemSettings({
                openAtLogin: true,
                path: process.execPath,
                args: [__dirname]
            });
            console.log("[Autostart] Windows/macOS login settings updated.");
        } catch (e) {
            console.error("[Autostart] Failed to setup Windows/macOS autostart:", e);
        }
    }
}

app.whenReady().then(() => {
    // Set App User Model ID for Windows notifications grouping
    app.setAppUserModelId('org.vibetube.player');
    
    setupAutostart();
    startPythonServer();
    createWindow();
    createTray();
    connectDiscordRPC();

    // Register global media shortcuts
    globalShortcut.register('MediaPlayPause', () => {
        if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'play-pause');
    });
    globalShortcut.register('MediaNextTrack', () => {
        if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'next');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
        if (mainWindow) mainWindow.webContents.send('global-shortcut-media', 'prev');
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('before-quit', () => {
    isQuitting = true;
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
    globalShortcut.unregisterAll();
    if (rpcSocket) {
        try {
            rpcSocket.destroy();
        } catch (e) {}
    }
    if (pyServer) {
        pyServer.kill();
    }
});

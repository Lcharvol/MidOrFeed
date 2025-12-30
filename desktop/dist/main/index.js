"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const connector_1 = require("./lcu/connector");
const websocket_1 = require("./lcu/websocket");
const tray_1 = require("./windows/tray");
const overlay_1 = require("./windows/overlay");
const settings_1 = require("./windows/settings");
const handlers_1 = require("./ipc/handlers");
let mainWindow = null;
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 600,
        minHeight: 500,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    // Load the main page
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Handle close to tray
    mainWindow.on('close', (event) => {
        const settings = (0, handlers_1.getSettings)();
        if (settings.minimizeToTray && !isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    return mainWindow;
}
// Track quitting state
let isQuitting = false;
async function initialize() {
    // Setup IPC handlers
    (0, handlers_1.setupIPCHandlers)();
    (0, handlers_1.setupLCUEventForwarding)();
    // Create windows
    createMainWindow();
    (0, tray_1.createTray)();
    (0, overlay_1.createOverlayWindow)();
    // Start LCU connection polling
    connector_1.lcuConnector.startPolling();
    // Update tray icon based on connection status
    connector_1.lcuConnector.onStatusChange((status) => {
        (0, tray_1.setTrayIcon)(status === 'connected');
        (0, handlers_1.sendToAllWindows)('lcu:status', status);
    });
    // Handle game flow for auto-showing overlay
    websocket_1.lcuWebSocket.onGameFlow((phase) => {
        const settings = (0, handlers_1.getSettings)();
        if (!settings.overlayEnabled)
            return;
        // Show overlay during champion select
        if (phase === 'ChampSelect') {
            (0, overlay_1.showOverlay)();
        }
        else if (phase === 'None' || phase === 'EndOfGame') {
            (0, overlay_1.hideOverlay)();
        }
        (0, handlers_1.sendToAllWindows)('lcu:gameflow', phase);
    });
}
// Single instance lock
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        // Focus main window if second instance is launched
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
    electron_1.app.whenReady().then(initialize);
}
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
// Before quit cleanup
electron_1.app.on('before-quit', () => {
    isQuitting = true;
    connector_1.lcuConnector.stopPolling();
    websocket_1.lcuWebSocket.disconnect();
    (0, overlay_1.destroyOverlay)();
    (0, settings_1.destroySettingsWindow)();
    (0, tray_1.destroyTray)();
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
//# sourceMappingURL=index.js.map
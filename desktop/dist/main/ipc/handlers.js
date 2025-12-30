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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPCHandlers = setupIPCHandlers;
exports.sendToAllWindows = sendToAllWindows;
exports.setupLCUEventForwarding = setupLCUEventForwarding;
exports.getSettings = getSettings;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const connector_1 = require("../lcu/connector");
const api_1 = require("../lcu/api");
const websocket_1 = require("../lcu/websocket");
const overlay_1 = require("../windows/overlay");
const store = new electron_store_1.default({
    defaults: {
        autoLaunch: false,
        minimizeToTray: true,
        overlayEnabled: true,
        overlayPosition: { x: 100, y: 100 },
        overlayOpacity: 0.9,
        language: 'fr',
    },
});
// Web API base URL
const WEB_API_URL = process.env.WEB_API_URL || 'https://midorfeed.gg';
function setupIPCHandlers() {
    // LCU handlers
    electron_1.ipcMain.handle('lcu:reconnect', async () => {
        connector_1.lcuConnector.startPolling();
    });
    // Overlay handlers
    electron_1.ipcMain.handle('overlay:toggle', async () => {
        (0, overlay_1.toggleOverlay)();
    });
    // Runes handlers
    electron_1.ipcMain.handle('runes:import', async (_event, runePage) => {
        return await api_1.lcuAPI.createRunePage(runePage);
    });
    // App handlers
    electron_1.ipcMain.handle('app:quit', async () => {
        const { app } = await Promise.resolve().then(() => __importStar(require('electron')));
        app.quit();
    });
    // Settings handlers
    electron_1.ipcMain.handle('settings:get', async () => {
        return store.store;
    });
    electron_1.ipcMain.handle('settings:update', async (_event, settings) => {
        Object.entries(settings).forEach(([key, value]) => {
            store.set(key, value);
        });
    });
    // Web API handlers
    electron_1.ipcMain.handle('api:champion', async (_event, championId) => {
        try {
            const response = await fetch(`${WEB_API_URL}/api/champions/${championId}/leadership`);
            if (!response.ok)
                throw new Error('API error');
            return await response.json();
        }
        catch (error) {
            console.error('Failed to fetch champion data:', error);
            return null;
        }
    });
    electron_1.ipcMain.handle('api:build', async (_event, championId, role) => {
        try {
            const response = await fetch(`${WEB_API_URL}/api/builds?championId=${championId}&role=${role}`);
            if (!response.ok)
                throw new Error('API error');
            return await response.json();
        }
        catch (error) {
            console.error('Failed to fetch build data:', error);
            return null;
        }
    });
}
function sendToAllWindows(channel, ...args) {
    electron_1.BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
            window.webContents.send(channel, ...args);
        }
    });
}
// Setup LCU event forwarding to renderer
function setupLCUEventForwarding() {
    // Forward connection status
    connector_1.lcuConnector.onStatusChange((status) => {
        sendToAllWindows('lcu:status', status);
        // Connect WebSocket when LCU is connected
        if (status === 'connected') {
            websocket_1.lcuWebSocket.connect();
        }
        else {
            websocket_1.lcuWebSocket.disconnect();
        }
    });
    // Forward game flow changes
    websocket_1.lcuWebSocket.onGameFlow((phase) => {
        sendToAllWindows('lcu:gameflow', phase);
    });
    // Forward champion select changes
    websocket_1.lcuWebSocket.onChampSelect((session) => {
        sendToAllWindows('lcu:champselect', session);
    });
    // Forward summoner changes
    websocket_1.lcuWebSocket.onSummoner((summoner) => {
        sendToAllWindows('lcu:summoner', summoner);
    });
}
function getSettings() {
    return store.store;
}
//# sourceMappingURL=handlers.js.map
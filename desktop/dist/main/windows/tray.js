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
exports.createTray = createTray;
exports.updateTrayMenu = updateTrayMenu;
exports.setTrayIcon = setTrayIcon;
exports.getTray = getTray;
exports.destroyTray = destroyTray;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const settings_1 = require("./settings");
const overlay_1 = require("./overlay");
const connector_1 = require("../lcu/connector");
let tray = null;
function createTray() {
    if (tray) {
        return tray;
    }
    // Create tray icon
    const iconPath = path.join(__dirname, '../../../assets/icons/tray-icon.png');
    let icon;
    try {
        icon = electron_1.nativeImage.createFromPath(iconPath);
        // Resize for tray (16x16 on most platforms)
        icon = icon.resize({ width: 16, height: 16 });
    }
    catch {
        // Fallback to empty icon if file doesn't exist
        icon = electron_1.nativeImage.createEmpty();
    }
    tray = new electron_1.Tray(icon);
    tray.setToolTip('MidOrFeed Overlay');
    updateTrayMenu();
    // Double-click to show/hide overlay
    tray.on('double-click', () => {
        (0, overlay_1.toggleOverlay)();
    });
    return tray;
}
function updateTrayMenu() {
    if (!tray)
        return;
    const isConnected = connector_1.lcuConnector.isConnected();
    const statusText = isConnected ? '🟢 Connecté' : '🔴 Déconnecté';
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'MidOrFeed Overlay',
            enabled: false,
        },
        {
            type: 'separator',
        },
        {
            label: `Status: ${statusText}`,
            enabled: false,
        },
        {
            type: 'separator',
        },
        {
            label: 'Afficher Overlay',
            click: () => (0, overlay_1.showOverlay)(),
        },
        {
            label: 'Masquer Overlay',
            click: () => (0, overlay_1.hideOverlay)(),
        },
        {
            type: 'separator',
        },
        {
            label: 'Paramètres',
            click: () => (0, settings_1.showSettingsWindow)(),
        },
        {
            type: 'separator',
        },
        {
            label: 'Quitter',
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
}
function setTrayIcon(connected) {
    if (!tray)
        return;
    const iconName = connected ? 'tray-icon-connected.png' : 'tray-icon.png';
    const iconPath = path.join(__dirname, '../../../assets/icons', iconName);
    try {
        let icon = electron_1.nativeImage.createFromPath(iconPath);
        icon = icon.resize({ width: 16, height: 16 });
        tray.setImage(icon);
    }
    catch {
        // Ignore if icon doesn't exist
    }
    updateTrayMenu();
}
function getTray() {
    return tray;
}
function destroyTray() {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}
//# sourceMappingURL=tray.js.map
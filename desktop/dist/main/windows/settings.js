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
exports.createSettingsWindow = createSettingsWindow;
exports.showSettingsWindow = showSettingsWindow;
exports.hideSettingsWindow = hideSettingsWindow;
exports.getSettingsWindow = getSettingsWindow;
exports.destroySettingsWindow = destroySettingsWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
let settingsWindow = null;
function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return settingsWindow;
    }
    settingsWindow = new electron_1.BrowserWindow({
        width: 500,
        height: 600,
        minWidth: 400,
        minHeight: 500,
        frame: true,
        show: false,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, '../../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    // Load the settings page
    if (process.env.NODE_ENV === 'development') {
        settingsWindow.loadURL('http://localhost:5173/settings.html');
    }
    else {
        settingsWindow.loadFile(path.join(__dirname, '../../renderer/settings.html'));
    }
    settingsWindow.once('ready-to-show', () => {
        settingsWindow?.show();
    });
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
    return settingsWindow;
}
function showSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.show();
        settingsWindow.focus();
    }
    else {
        createSettingsWindow();
    }
}
function hideSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.hide();
    }
}
function getSettingsWindow() {
    return settingsWindow;
}
function destroySettingsWindow() {
    if (settingsWindow) {
        settingsWindow.close();
        settingsWindow = null;
    }
}
//# sourceMappingURL=settings.js.map
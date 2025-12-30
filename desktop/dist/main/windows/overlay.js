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
exports.createOverlayWindow = createOverlayWindow;
exports.showOverlay = showOverlay;
exports.hideOverlay = hideOverlay;
exports.toggleOverlay = toggleOverlay;
exports.setOverlayInteractive = setOverlayInteractive;
exports.updateOverlayPosition = updateOverlayPosition;
exports.getOverlayWindow = getOverlayWindow;
exports.destroyOverlay = destroyOverlay;
const electron_1 = require("electron");
const path = __importStar(require("path"));
let overlayWindow = null;
function createOverlayWindow() {
    if (overlayWindow) {
        return overlayWindow;
    }
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    overlayWindow = new electron_1.BrowserWindow({
        width: 400,
        height: 600,
        x: width - 420, // Position on the right side
        y: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        focusable: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    // Allow clicks to pass through when not hovering over content
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    // Load the overlay page
    if (process.env.NODE_ENV === 'development') {
        overlayWindow.loadURL('http://localhost:5173/overlay.html');
    }
    else {
        overlayWindow.loadFile(path.join(__dirname, '../../renderer/overlay.html'));
    }
    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
    return overlayWindow;
}
function showOverlay() {
    if (overlayWindow) {
        overlayWindow.show();
    }
}
function hideOverlay() {
    if (overlayWindow) {
        overlayWindow.hide();
    }
}
function toggleOverlay() {
    if (overlayWindow) {
        if (overlayWindow.isVisible()) {
            hideOverlay();
        }
        else {
            showOverlay();
        }
    }
}
function setOverlayInteractive(interactive) {
    if (overlayWindow) {
        overlayWindow.setIgnoreMouseEvents(!interactive, { forward: true });
        overlayWindow.setFocusable(interactive);
    }
}
function updateOverlayPosition(x, y) {
    if (overlayWindow) {
        overlayWindow.setPosition(x, y);
    }
}
function getOverlayWindow() {
    return overlayWindow;
}
function destroyOverlay() {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
}
//# sourceMappingURL=overlay.js.map
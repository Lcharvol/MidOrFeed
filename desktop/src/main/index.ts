import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { lcuConnector } from './lcu/connector';
import { lcuWebSocket } from './lcu/websocket';
import { createTray, destroyTray, setTrayIcon } from './windows/tray';
import { createOverlayWindow, destroyOverlay, showOverlay, hideOverlay } from './windows/overlay';
import { destroySettingsWindow } from './windows/settings';
import { setupIPCHandlers, setupLCUEventForwarding, sendToAllWindows, getSettings } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    const settings = getSettings();
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

async function initialize(): Promise<void> {
  // Setup IPC handlers
  setupIPCHandlers();
  setupLCUEventForwarding();

  // Create windows
  createMainWindow();
  createTray();
  createOverlayWindow();

  // Start LCU connection polling
  lcuConnector.startPolling();

  // Update tray icon based on connection status
  lcuConnector.onStatusChange((status) => {
    setTrayIcon(status === 'connected');
    sendToAllWindows('lcu:status', status);
  });

  // Handle game flow for auto-showing overlay
  lcuWebSocket.onGameFlow((phase) => {
    const settings = getSettings();
    if (!settings.overlayEnabled) return;

    // Show overlay during champion select
    if (phase === 'ChampSelect') {
      showOverlay();
    } else if (phase === 'None' || phase === 'EndOfGame') {
      hideOverlay();
    }

    sendToAllWindows('lcu:gameflow', phase);
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus main window if second instance is launched
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(initialize);
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Before quit cleanup
app.on('before-quit', () => {
  isQuitting = true;
  lcuConnector.stopPolling();
  lcuWebSocket.disconnect();
  destroyOverlay();
  destroySettingsWindow();
  destroyTray();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

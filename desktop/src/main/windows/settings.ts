import { BrowserWindow } from 'electron';
import * as path from 'path';

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
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
  } else {
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

export function showSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
  } else {
    createSettingsWindow();
  }
}

export function hideSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.hide();
  }
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function destroySettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
  }
}

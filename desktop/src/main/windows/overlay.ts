import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

let overlayWindow: BrowserWindow | null = null;

export function createOverlayWindow(): BrowserWindow {
  if (overlayWindow) {
    return overlayWindow;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
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
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../../renderer/overlay.html'));
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function showOverlay(): void {
  if (overlayWindow) {
    overlayWindow.show();
  }
}

export function hideOverlay(): void {
  if (overlayWindow) {
    overlayWindow.hide();
  }
}

export function toggleOverlay(): void {
  if (overlayWindow) {
    if (overlayWindow.isVisible()) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }
}

export function setOverlayInteractive(interactive: boolean): void {
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(!interactive, { forward: true });
    overlayWindow.setFocusable(interactive);
  }
}

export function updateOverlayPosition(x: number, y: number): void {
  if (overlayWindow) {
    overlayWindow.setPosition(x, y);
  }
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

export function destroyOverlay(): void {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
}

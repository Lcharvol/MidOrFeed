import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { showSettingsWindow } from './settings';
import { toggleOverlay, showOverlay, hideOverlay } from './overlay';
import { lcuConnector } from '../lcu/connector';

let tray: Tray | null = null;

export function createTray(): Tray {
  if (tray) {
    return tray;
  }

  // Create tray icon
  const iconPath = path.join(__dirname, '../../../assets/icons/tray-icon.png');
  let icon: Electron.NativeImage;

  try {
    icon = nativeImage.createFromPath(iconPath);
    // Resize for tray (16x16 on most platforms)
    icon = icon.resize({ width: 16, height: 16 });
  } catch {
    // Fallback to empty icon if file doesn't exist
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('MidOrFeed Overlay');

  updateTrayMenu();

  // Double-click to show/hide overlay
  tray.on('double-click', () => {
    toggleOverlay();
  });

  return tray;
}

export function updateTrayMenu(): void {
  if (!tray) return;

  const isConnected = lcuConnector.isConnected();
  const statusText = isConnected ? '🟢 Connecté' : '🔴 Déconnecté';

  const contextMenu = Menu.buildFromTemplate([
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
      click: () => showOverlay(),
    },
    {
      label: 'Masquer Overlay',
      click: () => hideOverlay(),
    },
    {
      type: 'separator',
    },
    {
      label: 'Paramètres',
      click: () => showSettingsWindow(),
    },
    {
      type: 'separator',
    },
    {
      label: 'Quitter',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

export function setTrayIcon(connected: boolean): void {
  if (!tray) return;

  const iconName = connected ? 'tray-icon-connected.png' : 'tray-icon.png';
  const iconPath = path.join(__dirname, '../../../assets/icons', iconName);

  try {
    let icon = nativeImage.createFromPath(iconPath);
    icon = icon.resize({ width: 16, height: 16 });
    tray.setImage(icon);
  } catch {
    // Ignore if icon doesn't exist
  }

  updateTrayMenu();
}

export function getTray(): Tray | null {
  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

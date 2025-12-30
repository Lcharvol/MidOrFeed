import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import { lcuConnector } from '../lcu/connector';
import { lcuAPI } from '../lcu/api';
import { lcuWebSocket } from '../lcu/websocket';
import { toggleOverlay } from '../windows/overlay';
import type { AppSettings, DEFAULT_SETTINGS, RunePage } from '../../shared/types';

const store = new Store<AppSettings>({
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

export function setupIPCHandlers(): void {
  // LCU handlers
  ipcMain.handle('lcu:reconnect', async () => {
    lcuConnector.startPolling();
  });

  // Overlay handlers
  ipcMain.handle('overlay:toggle', async () => {
    toggleOverlay();
  });

  // Runes handlers
  ipcMain.handle('runes:import', async (_event, runePage: RunePage) => {
    return await lcuAPI.createRunePage(runePage);
  });

  // App handlers
  ipcMain.handle('app:quit', async () => {
    const { app } = await import('electron');
    app.quit();
  });

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    return store.store;
  });

  ipcMain.handle('settings:update', async (_event, settings: Partial<AppSettings>) => {
    Object.entries(settings).forEach(([key, value]) => {
      store.set(key as keyof AppSettings, value as AppSettings[keyof AppSettings]);
    });
  });

  // Web API handlers
  ipcMain.handle('api:champion', async (_event, championId: number) => {
    try {
      const response = await fetch(`${WEB_API_URL}/api/champions/${championId}/leadership`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch champion data:', error);
      return null;
    }
  });

  ipcMain.handle('api:build', async (_event, championId: number, role: string) => {
    try {
      const response = await fetch(`${WEB_API_URL}/api/builds?championId=${championId}&role=${role}`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch build data:', error);
      return null;
    }
  });
}

export function sendToAllWindows(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, ...args);
    }
  });
}

// Setup LCU event forwarding to renderer
export function setupLCUEventForwarding(): void {
  // Forward connection status
  lcuConnector.onStatusChange((status) => {
    sendToAllWindows('lcu:status', status);

    // Connect WebSocket when LCU is connected
    if (status === 'connected') {
      lcuWebSocket.connect();
    } else {
      lcuWebSocket.disconnect();
    }
  });

  // Forward game flow changes
  lcuWebSocket.onGameFlow((phase) => {
    sendToAllWindows('lcu:gameflow', phase);
  });

  // Forward champion select changes
  lcuWebSocket.onChampSelect((session) => {
    sendToAllWindows('lcu:champselect', session);
  });

  // Forward summoner changes
  lcuWebSocket.onSummoner((summoner) => {
    sendToAllWindows('lcu:summoner', summoner);
  });
}

export function getSettings(): AppSettings {
  return store.store;
}

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import { lcuConnector } from '../lcu/connector';
import { lcuAPI } from '../lcu/api';
import { lcuWebSocket } from '../lcu/websocket';
import { toggleOverlay, showOverlay, hideOverlay } from '../windows/overlay';
import type { AppSettings, DEFAULT_SETTINGS, RunePage, ChampSelectSession } from '../../shared/types';

// Demo mode state
let demoModeActive = false;
let demoInterval: NodeJS.Timeout | null = null;

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

  // Demo mode handlers
  ipcMain.handle('demo:start', async () => {
    startDemoMode();
  });

  ipcMain.handle('demo:stop', async () => {
    stopDemoMode();
  });

  ipcMain.handle('demo:isActive', async () => {
    return demoModeActive;
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

// Demo mode mock data
const DEMO_CHAMPIONS = [
  { id: 1, name: 'Annie' },
  { id: 64, name: 'Lee Sin' },
  { id: 157, name: 'Yasuo' },
  { id: 238, name: 'Zed' },
  { id: 412, name: "Thresh" },
  { id: 51, name: 'Caitlyn' },
  { id: 99, name: 'Lux' },
  { id: 86, name: 'Garen' },
  { id: 222, name: 'Jinx' },
  { id: 103, name: 'Ahri' },
];

function createMockChampSelectSession(phase: number): ChampSelectSession {
  const myTeam = DEMO_CHAMPIONS.slice(0, 5).map((champ, index) => ({
    cellId: index,
    championId: phase > index ? champ.id : 0,
    championPickIntent: phase <= index ? champ.id : 0,
    summonerId: 1000 + index,
    assignedPosition: ['top', 'jungle', 'middle', 'bottom', 'utility'][index],
    spell1Id: 4, // Flash
    spell2Id: index === 1 ? 11 : 14, // Smite for jungle, Ignite for others
    team: 1,
  }));

  const theirTeam = DEMO_CHAMPIONS.slice(5, 10).map((champ, index) => ({
    cellId: 5 + index,
    championId: phase > index + 1 ? champ.id : 0,
    championPickIntent: 0,
    summonerId: 2000 + index,
    assignedPosition: ['top', 'jungle', 'middle', 'bottom', 'utility'][index],
    spell1Id: 4,
    spell2Id: index === 1 ? 11 : 14,
    team: 2,
  }));

  const bans = phase > 0
    ? [
        { championId: 67, isAllyBan: true },
        { championId: 55, isAllyBan: true },
        { championId: 91, isAllyBan: false },
        { championId: 7, isAllyBan: false },
      ]
    : [];

  return {
    myTeam,
    theirTeam,
    bans,
    timer: {
      phase: phase < 5 ? 'BAN_PICK' : 'FINALIZATION',
      timeRemaining: 30000 - (phase % 5) * 5000,
      totalTimeInPhase: 30000,
    },
    localPlayerCellId: 2, // Mid laner
    isSpectating: false,
  };
}

function startDemoMode(): void {
  if (demoModeActive) return;

  demoModeActive = true;
  let phase = 0;

  // Send initial status
  sendToAllWindows('lcu:status', 'connected');
  sendToAllWindows('lcu:gameflow', 'ChampSelect');
  showOverlay();

  // Simulate champion select progression
  const sendUpdate = () => {
    const session = createMockChampSelectSession(phase);
    sendToAllWindows('lcu:champselect', session);
    phase = (phase + 1) % 6;
  };

  sendUpdate();
  demoInterval = setInterval(sendUpdate, 3000);

  console.log('Demo mode started');
}

function stopDemoMode(): void {
  if (!demoModeActive) return;

  demoModeActive = false;
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  hideOverlay();
  sendToAllWindows('lcu:gameflow', 'None');
  sendToAllWindows('lcu:status', 'disconnected');

  console.log('Demo mode stopped');
}

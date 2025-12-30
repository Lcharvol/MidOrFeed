import { contextBridge, ipcRenderer } from 'electron';
import type {
  LCUConnectionStatus,
  GameFlowPhase,
  ChampSelectSession,
  CurrentSummoner,
  RunePage,
} from '../shared/types';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // LCU Events
  onLCUStatus: (callback: (status: LCUConnectionStatus) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, status: LCUConnectionStatus) =>
      callback(status);
    ipcRenderer.on('lcu:status', subscription);
    return () => ipcRenderer.removeListener('lcu:status', subscription);
  },

  onGameFlow: (callback: (phase: GameFlowPhase) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, phase: GameFlowPhase) =>
      callback(phase);
    ipcRenderer.on('lcu:gameflow', subscription);
    return () => ipcRenderer.removeListener('lcu:gameflow', subscription);
  },

  onChampSelect: (callback: (session: ChampSelectSession | null) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, session: ChampSelectSession | null) =>
      callback(session);
    ipcRenderer.on('lcu:champselect', subscription);
    return () => ipcRenderer.removeListener('lcu:champselect', subscription);
  },

  onSummoner: (callback: (summoner: CurrentSummoner | null) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, summoner: CurrentSummoner | null) =>
      callback(summoner);
    ipcRenderer.on('lcu:summoner', subscription);
    return () => ipcRenderer.removeListener('lcu:summoner', subscription);
  },

  // Actions
  reconnectLCU: () => ipcRenderer.invoke('lcu:reconnect'),
  toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
  importRunes: (runePage: RunePage) => ipcRenderer.invoke('runes:import', runePage),
  quitApp: () => ipcRenderer.invoke('app:quit'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<Record<string, unknown>>) =>
    ipcRenderer.invoke('settings:update', settings),

  // API calls to web app
  fetchChampionData: (championId: number) =>
    ipcRenderer.invoke('api:champion', championId),
  fetchBuildData: (championId: number, role: string) =>
    ipcRenderer.invoke('api:build', championId, role),

  // Demo mode
  startDemo: () => ipcRenderer.invoke('demo:start'),
  stopDemo: () => ipcRenderer.invoke('demo:stop'),
  isDemoActive: () => ipcRenderer.invoke('demo:isActive'),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      onLCUStatus: (callback: (status: LCUConnectionStatus) => void) => () => void;
      onGameFlow: (callback: (phase: GameFlowPhase) => void) => () => void;
      onChampSelect: (callback: (session: ChampSelectSession | null) => void) => () => void;
      onSummoner: (callback: (summoner: CurrentSummoner | null) => void) => () => void;
      reconnectLCU: () => Promise<void>;
      toggleOverlay: () => Promise<void>;
      importRunes: (runePage: RunePage) => Promise<boolean>;
      quitApp: () => Promise<void>;
      getSettings: () => Promise<Record<string, unknown>>;
      updateSettings: (settings: Partial<Record<string, unknown>>) => Promise<void>;
      fetchChampionData: (championId: number) => Promise<unknown>;
      fetchBuildData: (championId: number, role: string) => Promise<unknown>;
      startDemo: () => Promise<void>;
      stopDemo: () => Promise<void>;
      isDemoActive: () => Promise<boolean>;
    };
  }
}

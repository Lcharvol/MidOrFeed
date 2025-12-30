"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // LCU Events
    onLCUStatus: (callback) => {
        const subscription = (_event, status) => callback(status);
        electron_1.ipcRenderer.on('lcu:status', subscription);
        return () => electron_1.ipcRenderer.removeListener('lcu:status', subscription);
    },
    onGameFlow: (callback) => {
        const subscription = (_event, phase) => callback(phase);
        electron_1.ipcRenderer.on('lcu:gameflow', subscription);
        return () => electron_1.ipcRenderer.removeListener('lcu:gameflow', subscription);
    },
    onChampSelect: (callback) => {
        const subscription = (_event, session) => callback(session);
        electron_1.ipcRenderer.on('lcu:champselect', subscription);
        return () => electron_1.ipcRenderer.removeListener('lcu:champselect', subscription);
    },
    onSummoner: (callback) => {
        const subscription = (_event, summoner) => callback(summoner);
        electron_1.ipcRenderer.on('lcu:summoner', subscription);
        return () => electron_1.ipcRenderer.removeListener('lcu:summoner', subscription);
    },
    // Actions
    reconnectLCU: () => electron_1.ipcRenderer.invoke('lcu:reconnect'),
    toggleOverlay: () => electron_1.ipcRenderer.invoke('overlay:toggle'),
    importRunes: (runePage) => electron_1.ipcRenderer.invoke('runes:import', runePage),
    quitApp: () => electron_1.ipcRenderer.invoke('app:quit'),
    // Settings
    getSettings: () => electron_1.ipcRenderer.invoke('settings:get'),
    updateSettings: (settings) => electron_1.ipcRenderer.invoke('settings:update', settings),
    // API calls to web app
    fetchChampionData: (championId) => electron_1.ipcRenderer.invoke('api:champion', championId),
    fetchBuildData: (championId, role) => electron_1.ipcRenderer.invoke('api:build', championId, role),
});
//# sourceMappingURL=index.js.map
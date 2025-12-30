import { useState, useEffect } from 'react';
import type { LCUConnectionStatus, GameFlowPhase, ChampSelectSession, CurrentSummoner } from '../shared/types';
import { ChampSelectPanel } from './components/ChampSelect/ChampSelectPanel';
import { StatusBar } from './components/StatusBar';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const [lcuStatus, setLcuStatus] = useState<LCUConnectionStatus>('disconnected');
  const [gamePhase, setGamePhase] = useState<GameFlowPhase>('None');
  const [champSelect, setChampSelect] = useState<ChampSelectSession | null>(null);
  const [summoner, setSummoner] = useState<CurrentSummoner | null>(null);

  useEffect(() => {
    // Subscribe to LCU events
    const unsubStatus = window.electronAPI.onLCUStatus(setLcuStatus);
    const unsubGameFlow = window.electronAPI.onGameFlow(setGamePhase);
    const unsubChampSelect = window.electronAPI.onChampSelect(setChampSelect);
    const unsubSummoner = window.electronAPI.onSummoner(setSummoner);

    return () => {
      unsubStatus();
      unsubGameFlow();
      unsubChampSelect();
      unsubSummoner();
    };
  }, []);

  const handleReconnect = () => {
    window.electronAPI.reconnectLCU();
  };

  return (
    <div className="h-screen flex flex-col bg-lol-blue">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-lol-gold-dark/30">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-lol-gold">MidOrFeed</h1>
          <span className="text-sm text-gray-400">Overlay</span>
        </div>
        <StatusBar
          status={lcuStatus}
          gamePhase={gamePhase}
          summoner={summoner}
          onReconnect={handleReconnect}
        />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        {lcuStatus !== 'connected' ? (
          <WelcomeScreen status={lcuStatus} onReconnect={handleReconnect} />
        ) : gamePhase === 'ChampSelect' && champSelect ? (
          <ChampSelectPanel session={champSelect} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-lol-gold mb-2">
              Connecté au client
            </h2>
            <p className="text-gray-400 max-w-md">
              L'overlay s'affichera automatiquement pendant la sélection des champions.
            </p>
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-300">
                <span className="font-medium">Phase actuelle:</span>{' '}
                <span className="text-lol-blue-light">{gamePhase || 'Aucune'}</span>
              </p>
              {summoner && (
                <p className="text-sm text-gray-300 mt-2">
                  <span className="font-medium">Invocateur:</span>{' '}
                  <span className="text-lol-gold">{summoner.gameName}#{summoner.tagLine}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-2 border-t border-lol-gold-dark/30 text-center">
        <p className="text-xs text-gray-500">
          MidOrFeed Overlay v1.0.0 - Powered by Riot API
        </p>
      </footer>
    </div>
  );
}

export default App;

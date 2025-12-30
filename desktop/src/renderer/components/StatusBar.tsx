import type { LCUConnectionStatus, GameFlowPhase, CurrentSummoner } from '../../shared/types';

interface StatusBarProps {
  status: LCUConnectionStatus;
  gamePhase: GameFlowPhase;
  summoner: CurrentSummoner | null;
  onReconnect: () => void;
}

export function StatusBar({ status, gamePhase, summoner, onReconnect }: StatusBarProps) {
  const statusText = {
    connected: 'Connecté',
    connecting: 'Connexion...',
    disconnected: 'Déconnecté',
    error: 'Erreur',
  };

  const statusClass = {
    connected: 'connected',
    connecting: 'connecting',
    disconnected: 'disconnected',
    error: 'disconnected',
  };

  return (
    <div className="flex items-center gap-4">
      {summoner && (
        <div className="flex items-center gap-2 text-sm">
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${summoner.profileIconId}.png`}
            alt="Profile"
            className="w-6 h-6 rounded-full border border-lol-gold-dark"
          />
          <span className="text-gray-300">{summoner.gameName}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={`status-dot ${statusClass[status]}`} />
        <span className="text-sm text-gray-400">{statusText[status]}</span>
      </div>

      {status !== 'connected' && status !== 'connecting' && (
        <button
          onClick={onReconnect}
          className="btn btn-secondary text-xs px-3 py-1"
        >
          Reconnecter
        </button>
      )}
    </div>
  );
}

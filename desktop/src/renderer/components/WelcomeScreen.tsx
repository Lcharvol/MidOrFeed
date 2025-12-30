import type { LCUConnectionStatus } from '../../shared/types';

interface WelcomeScreenProps {
  status: LCUConnectionStatus;
  onReconnect: () => void;
}

export function WelcomeScreen({ status, onReconnect }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-6xl mb-6">
        {status === 'connecting' ? '🔄' : status === 'error' ? '⚠️' : '🎮'}
      </div>

      <h2 className="text-2xl font-bold text-lol-gold mb-4">
        {status === 'connecting'
          ? 'Recherche du client...'
          : status === 'error'
          ? 'Erreur de connexion'
          : 'En attente du client League'}
      </h2>

      <p className="text-gray-400 max-w-md mb-8">
        {status === 'connecting'
          ? 'Connexion au client League of Legends en cours...'
          : status === 'error'
          ? "Une erreur s'est produite lors de la connexion au client."
          : 'Lancez League of Legends pour connecter l\'overlay automatiquement.'}
      </p>

      {status === 'disconnected' && (
        <div className="space-y-4">
          <div className="card max-w-md">
            <h3 className="text-lg font-semibold text-lol-gold mb-3">Comment ça marche ?</h3>
            <ol className="text-left text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-lol-gold font-bold">1.</span>
                <span>Lancez League of Legends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lol-gold font-bold">2.</span>
                <span>L'overlay se connecte automatiquement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lol-gold font-bold">3.</span>
                <span>Pendant le champ select, l'overlay affiche les stats</span>
              </li>
            </ol>
          </div>

          <button onClick={onReconnect} className="btn btn-secondary">
            Réessayer la connexion
          </button>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-lol-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Recherche en cours...</span>
        </div>
      )}

      {status === 'error' && (
        <button onClick={onReconnect} className="btn btn-primary">
          Réessayer
        </button>
      )}
    </div>
  );
}

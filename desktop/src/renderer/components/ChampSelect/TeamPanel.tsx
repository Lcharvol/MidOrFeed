import type { ChampSelectMember } from '../../../shared/types';

interface TeamPanelProps {
  title: string;
  members: ChampSelectMember[];
  localPlayerCellId: number;
  getChampionInfo: (id: number) => { name: string; imageUrl: string };
  isAllyTeam: boolean;
}

const POSITIONS: Record<string, string> = {
  top: 'Top',
  jungle: 'Jungle',
  middle: 'Mid',
  bottom: 'ADC',
  utility: 'Support',
  '': 'N/A',
};

export function TeamPanel({
  title,
  members,
  localPlayerCellId,
  getChampionInfo,
  isAllyTeam,
}: TeamPanelProps) {
  return (
    <div className="card">
      <h3 className={`text-sm font-medium mb-3 ${isAllyTeam ? 'text-lol-blue-light' : 'text-red-400'}`}>
        {title}
      </h3>
      <div className="space-y-2">
        {members.map((member) => {
          const champion = getChampionInfo(member.championId || member.championPickIntent);
          const isLocalPlayer = member.cellId === localPlayerCellId;

          return (
            <div
              key={member.cellId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isLocalPlayer
                  ? 'bg-lol-gold/20 border border-lol-gold/40'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Champion icon */}
              <div className="relative">
                {champion.imageUrl ? (
                  <img
                    src={champion.imageUrl}
                    alt={champion.name}
                    className={`champion-icon small ${
                      member.championId === 0 ? 'opacity-40' : ''
                    }`}
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs text-gray-500">
                    ?
                  </div>
                )}
                {member.championId === 0 && member.championPickIntent > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-lol-blue" />
                )}
              </div>

              {/* Champion name and position */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  member.championId > 0 ? 'text-white' : 'text-gray-400'
                }`}>
                  {member.championId > 0 ? champion.name : 'En attente...'}
                </p>
                <p className="text-xs text-gray-500">
                  {POSITIONS[member.assignedPosition.toLowerCase()] || member.assignedPosition}
                </p>
              </div>

              {/* Local player indicator */}
              {isLocalPlayer && (
                <span className="text-xs text-lol-gold font-medium">Vous</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

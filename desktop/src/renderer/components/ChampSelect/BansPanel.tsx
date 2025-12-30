interface Ban {
  championId: number;
  isAllyBan: boolean;
}

interface BansPanelProps {
  title: string;
  bans: Ban[];
  getChampionInfo: (id: number) => { name: string; imageUrl: string };
}

export function BansPanel({ title, bans, getChampionInfo }: BansPanelProps) {
  return (
    <div className="card">
      <h3 className="text-xs font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1">
        {bans.length === 0 ? (
          <span className="text-xs text-gray-500">Aucun ban</span>
        ) : (
          bans.map((ban, index) => {
            const champion = getChampionInfo(ban.championId);
            return (
              <div
                key={`${ban.championId}-${index}`}
                className="relative group"
                title={champion.name}
              >
                {champion.imageUrl ? (
                  <img
                    src={champion.imageUrl}
                    alt={champion.name}
                    className="w-8 h-8 rounded grayscale opacity-60"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs text-gray-500">
                    ?
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-red-500 text-lg font-bold">✕</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { ChampSelectSession } from '../../../shared/types';
import { TeamPanel } from './TeamPanel';
import { BansPanel } from './BansPanel';
import { Timer } from './Timer';

interface ChampSelectPanelProps {
  session: ChampSelectSession;
}

// Champion ID to name mapping (partial, would be loaded from API)
const CHAMPION_NAMES: Record<number, string> = {
  1: 'Annie',
  2: 'Olaf',
  3: 'Galio',
  // This would be dynamically loaded from Data Dragon
};

export function ChampSelectPanel({ session }: ChampSelectPanelProps) {
  const [championData, setChampionData] = useState<Record<number, { name: string; imageUrl: string }>>({});

  // Fetch champion data on mount
  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion.json')
      .then((res) => res.json())
      .then((data) => {
        const champions: Record<number, { name: string; imageUrl: string }> = {};
        Object.values(data.data as Record<string, { key: string; name: string; id: string }>).forEach((champ) => {
          champions[parseInt(champ.key)] = {
            name: champ.name,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.id}.png`,
          };
        });
        setChampionData(champions);
      })
      .catch(console.error);
  }, []);

  const getChampionInfo = (championId: number) => {
    if (championId === 0) return { name: 'Selecting...', imageUrl: '' };
    return championData[championId] || { name: `Champion ${championId}`, imageUrl: '' };
  };

  const localPlayer = session.myTeam.find(
    (member) => member.cellId === session.localPlayerCellId
  );

  const allyBans = session.bans.filter((ban) => ban.isAllyBan);
  const enemyBans = session.bans.filter((ban) => !ban.isAllyBan);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <Timer
        phase={session.timer.phase}
        timeRemaining={session.timer.timeRemaining}
        totalTime={session.timer.totalTimeInPhase}
      />

      {/* Bans */}
      <div className="grid grid-cols-2 gap-4">
        <BansPanel
          title="Nos bans"
          bans={allyBans}
          getChampionInfo={getChampionInfo}
        />
        <BansPanel
          title="Leurs bans"
          bans={enemyBans}
          getChampionInfo={getChampionInfo}
        />
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-4">
        <TeamPanel
          title="Notre équipe"
          members={session.myTeam}
          localPlayerCellId={session.localPlayerCellId}
          getChampionInfo={getChampionInfo}
          isAllyTeam={true}
        />
        <TeamPanel
          title="Équipe adverse"
          members={session.theirTeam}
          localPlayerCellId={-1}
          getChampionInfo={getChampionInfo}
          isAllyTeam={false}
        />
      </div>

      {/* Current player action */}
      {localPlayer && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Votre pick</h3>
          <div className="flex items-center gap-3">
            {localPlayer.championId > 0 ? (
              <>
                <img
                  src={getChampionInfo(localPlayer.championId).imageUrl}
                  alt=""
                  className="champion-icon"
                />
                <div>
                  <p className="font-semibold text-lol-gold">
                    {getChampionInfo(localPlayer.championId).name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {localPlayer.assignedPosition || 'Position non assignée'}
                  </p>
                </div>
              </>
            ) : localPlayer.championPickIntent > 0 ? (
              <>
                <img
                  src={getChampionInfo(localPlayer.championPickIntent).imageUrl}
                  alt=""
                  className="champion-icon opacity-50"
                />
                <div>
                  <p className="font-semibold text-gray-400">
                    Intention: {getChampionInfo(localPlayer.championPickIntent).name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {localPlayer.assignedPosition || 'Position non assignée'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-400">Sélectionnez un champion</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

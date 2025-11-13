import { prisma } from "@/lib/prisma";
import { resolveChampionRole, ROLE_PRIORITY } from "@/lib/compositions/roles";
import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";

const EXPORT_DIR = resolve(process.cwd(), "ml/data");
const EXPORT_FILE = resolve(EXPORT_DIR, "composition_samples.csv");

const HEADERS = [
  "matchId",
  "teamId",
  "queueId",
  "patch",
  "gameDuration",
  "role",
  "championId",
  "win",
  "ally1",
  "ally2",
  "ally3",
  "ally4",
  "enemy1",
  "enemy2",
  "enemy3",
  "enemy4",
  "enemy5",
];

const sanitize = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.includes(",")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return String(value);
};

const parsePatch = (version?: string | null): string | null => {
  if (!version) return null;
  const [major, minor] = version.split(".");
  if (!major) return null;
  return minor ? `${major}.${minor}` : major;
};

const sortByRolePriority = (
  entries: Array<{ role: string; championId: string }>
): string[] => {
  const normalized = entries.map(({ role, championId }) => ({
    role: role.toUpperCase(),
    championId,
  }));

  const ordered: string[] = [];
  for (const role of ROLE_PRIORITY) {
    const match = normalized.find((entry) => entry.role === role);
    if (match) {
      ordered.push(match.championId);
    }
  }

  normalized
    .filter(
      (entry) => !ROLE_PRIORITY.includes(entry.role as (typeof ROLE_PRIORITY)[number])
    )
    .forEach((entry) => {
      if (!ordered.includes(entry.championId)) {
        ordered.push(entry.championId);
      }
    });

  return ordered;
};

export const exportCompositionsToCsv = async (): Promise<{
  total: number;
  path: string;
}> => {
  await mkdir(EXPORT_DIR, { recursive: true });
  await writeFile(EXPORT_FILE, "");
  const stream = createWriteStream(EXPORT_FILE, { flags: "a" });

  stream.write(`${HEADERS.join(",")}\n`);

  const chunkSize = 250;
  let page = 0;
  let total = 0;

  while (true) {
    const matches = await prisma.match.findMany({
      select: {
        matchId: true,
        queueId: true,
        gameDuration: true,
        gameVersion: true,
        participants: {
          select: {
            championId: true,
            teamId: true,
            role: true,
            lane: true,
            win: true,
          },
        },
      },
      orderBy: { gameCreation: "desc" },
      skip: page * chunkSize,
      take: chunkSize,
    });

    if (matches.length === 0) {
      break;
    }

    for (const match of matches) {
      if (match.participants.length !== 10) {
        continue;
      }

      const patch = parsePatch(match.gameVersion);
      const byTeam = new Map<
        number,
        Array<{
          championId: string;
          roleRaw: string | null;
          laneRaw: string | null;
          win: boolean;
        }>
      >();

      match.participants.forEach((participant) => {
        const current = byTeam.get(participant.teamId) ?? [];
        current.push({
          championId: participant.championId,
          roleRaw: participant.role,
          laneRaw: participant.lane,
          win: participant.win ?? false,
        });
        byTeam.set(participant.teamId, current);
      });

      for (const [teamId, teamParticipants] of byTeam.entries()) {
        if (teamParticipants.length < 5) continue;

        const enemyTeamId = [...byTeam.keys()].find((id) => id !== teamId);
        if (enemyTeamId === undefined) continue;

        const enemyParticipants = byTeam.get(enemyTeamId);
        if (!enemyParticipants || enemyParticipants.length < 5) continue;

        const enemyChampions = enemyParticipants.map(
          (participant) => participant.championId
        );

        const teamEntries = teamParticipants.map((participant) => ({
          championId: participant.championId,
          role:
            resolveChampionRole(participant.roleRaw, participant.laneRaw) ??
            participant.roleRaw ??
            participant.laneRaw ??
            "UNKNOWN",
          win: participant.win,
        }));

        const orderedAllies = sortByRolePriority(
          teamEntries.map(({ role, championId }) => ({ role, championId }))
        );

        for (const entry of teamEntries) {
          const { championId, role, win } = entry;
          const allies = orderedAllies.filter(
            (ally) => ally !== championId
          );

          if (allies.length < 4) {
            continue;
          }

          const row = [
            match.matchId,
            teamId,
            match.queueId ?? "",
            patch ?? "",
            match.gameDuration ?? "",
            role,
            championId,
            win ? 1 : 0,
            ...allies.slice(0, 4),
            ...enemyChampions.slice(0, 5),
          ];

          stream.write(`${row.map(sanitize).join(",")}\n`);
          total += 1;
        }
      }
    }

    page += 1;
  }

  stream.close();
  return { total, path: EXPORT_FILE };
};

export const COMPOSITIONS_EXPORT_FILE = EXPORT_FILE;
export const COMPOSITIONS_EXPORT_DIR = EXPORT_DIR;



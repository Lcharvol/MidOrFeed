import { prisma } from "@/lib/prisma";
import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";

export const EXPORT_DIR = resolve(process.cwd(), "ml/data");
export const EXPORT_FILE = resolve(EXPORT_DIR, "match_participants.csv");

const HEADERS = [
  "matchId",
  "participantPUuid",
  "championId",
  "teamId",
  "role",
  "lane",
  "kills",
  "deaths",
  "assists",
  "goldEarned",
  "goldSpent",
  "totalDamageDealtToChampions",
  "totalDamageTaken",
  "visionScore",
  "win",
  "gameDuration",
  "queueId",
  "gameCreation",
];

const sanitize = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.includes(",")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return String(value);
};

export async function exportMatchesToCsv(): Promise<{
  total: number;
  path: string;
}> {
  await mkdir(EXPORT_DIR, { recursive: true });
  await writeFile(EXPORT_FILE, "");
  const stream = createWriteStream(EXPORT_FILE, { flags: "a" });

  stream.write(`${HEADERS.join(",")}\n`);

  const chunkSize = 1000;
  let page = 0;
  let total = 0;

  while (true) {
    const participants = await prisma.matchParticipant.findMany({
      include: {
        match: {
          select: {
            matchId: true,
            gameDuration: true,
            queueId: true,
            gameCreation: true,
          },
        },
      },
      skip: page * chunkSize,
      take: chunkSize,
      orderBy: { createdAt: "asc" },
    });

    if (!participants.length) break;

    for (const participant of participants) {
      const row = [
        participant.match.matchId,
        participant.participantPUuid,
        participant.championId,
        participant.teamId,
        participant.role,
        participant.lane,
        participant.kills,
        participant.deaths,
        participant.assists,
        participant.goldEarned,
        participant.goldSpent,
        participant.totalDamageDealtToChampions,
        participant.totalDamageTaken,
        participant.visionScore,
        participant.win ? 1 : 0,
        participant.match.gameDuration,
        participant.match.queueId,
        participant.match.gameCreation,
      ];

      stream.write(`${row.map(sanitize).join(",")}\n`);
      total += 1;
    }

    page += 1;
  }

  stream.close();
  return { total, path: EXPORT_FILE };
}

import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { exportMatchesToCsv } from "@/lib/server/ml/exportMatches";
import { prisma } from "@/lib/prisma";
import { broadcastNotification } from "@/lib/server/notification-hub";

export const runtime = "nodejs";

type CommandResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

const runCommand = (command: string, args: string[], env: NodeJS.ProcessEnv) =>
  new Promise<CommandResult>((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        exitCode: -1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
      });
    });

    child.on("close", (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });
  });

export async function POST() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: "DATABASE_URL indisponible" },
      { status: 500 }
    );
  }

  const running = await prisma.mlTrainingRun.findFirst({
    where: { status: "running" },
  });

  if (running) {
    return NextResponse.json(
      {
        success: false,
        error: "Un entraînement est déjà en cours.",
      },
      { status: 409 }
    );
  }

  try {
    const exportResult = await exportMatchesToCsv();

    const { exitCode, stdout, stderr } = await runCommand(
      "python3",
      [
        "ml/train_model.py",
        "--data-path",
        exportResult.path,
        "--database-url",
        databaseUrl,
      ],
      process.env
    );

    if (exitCode !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Le script ML a échoué",
          details: stderr || stdout,
        },
        { status: 500 }
      );
    }

    const runIdMatch = stdout.match(/ML_RUN_ID=([a-zA-Z0-9]+)/);
    const runId = runIdMatch ? runIdMatch[1] : null;

    const finalRun = runId
      ? await prisma.mlTrainingRun.findUnique({
          where: { id: runId },
          include: { predictions: { take: 5 } },
        })
      : null;

    broadcastNotification({
      id: crypto.randomUUID(),
      title: "Run ML terminé",
      message: runId
        ? `Run ${runId} terminé (${finalRun?.status ?? "?"}).`
        : "Run ML terminé.",
      variant: "info",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        runId,
        stdout,
        stderr,
        export: exportResult,
        run: finalRun,
      },
    });
  } catch (error) {
    console.error("ML train error", error);
    return NextResponse.json(
      { success: false, error: "Échec du lancement ML" },
      { status: 500 }
    );
  }
}

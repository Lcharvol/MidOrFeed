import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { exportCompositionsToCsv } from "@/lib/server/ml/exportCompositions";
import { prisma } from "@/lib/prisma";

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

const PYTHON_COMMANDS = ["python3", "python"];

export async function POST() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: "DATABASE_URL indisponible" },
      { status: 500 }
    );
  }

  try {
    const exportResult = await exportCompositionsToCsv();

    let lastResult: CommandResult | null = null;
    let usedCommand = PYTHON_COMMANDS[0];

    for (const command of PYTHON_COMMANDS) {
      const result = await runCommand(
        command,
        [
          "ml/train_composition_model.py",
          "--data-path",
          exportResult.path,
          "--database-url",
          databaseUrl,
        ],
        process.env
      );

      if (result.exitCode === 0) {
        lastResult = result;
        usedCommand = command;
        break;
      }

      const stderr = result.stderr ?? "";
      if (stderr.includes("ENOENT") || stderr.includes("not found")) {
        lastResult = result;
        continue;
      }

      lastResult = result;
      usedCommand = command;
      break;
    }

    if (!lastResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de lancer le pipeline compositions",
        },
        { status: 500 }
      );
    }

    const { exitCode, stdout, stderr } = lastResult;

    if (exitCode !== 0) {
      console.error("[ML_COMPOSITIONS] python command failed", {
        command: usedCommand,
        exitCode,
        stderr,
        stdout,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Le script de génération de compositions a échoué",
          details: stderr || stdout,
        },
        { status: 500 }
      );
    }

    const suggestionCount = await prisma.compositionSuggestion.count({
      where: { userId: null },
    });

    return NextResponse.json({
      success: true,
      data: {
        stdout,
        stderr,
        export: exportResult,
        totalSuggestions: suggestionCount,
      },
    });
  } catch (error) {
    console.error("ML compositions train error", error);
    return NextResponse.json(
      { success: false, error: "Échec du lancement du pipeline compositions" },
      { status: 500 }
    );
  }
}



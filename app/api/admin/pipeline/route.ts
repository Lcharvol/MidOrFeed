import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";

type PipelineState = {
  running: boolean;
  lastCycleAt?: string;
  cycles?: number;
  currentStep?: string | null;
  lastMessage?: string | null;
  recent?: string[];
};

type SeedResponse = {
  data?: {
    matchesAnalyzed?: number;
    uniquePUUIDs?: number;
    newPlayersAdded?: number;
  };
};

type ProcessResponse = {
  data?: {
    playersProcessed?: number;
    matchesCollected?: number;
  };
};

type SyncResponse = {
  data?: {
    totalPUUIDs?: number;
    accountsCreated?: number;
    accountsUpdated?: number;
  };
};

declare global {
  var __ADMIN_PIPELINE__: PipelineState | undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOneCycle(
  seedRegion: string,
  seedCount: number,
  maxRiotCallsPerCycle: number
) {
  const state = (global.__ADMIN_PIPELINE__ ||= { running: true, cycles: 0 });
  const pushLog = (msg: string) => {
    state.lastMessage = msg;
    state.recent = [
      `${new Date().toLocaleTimeString()} · ${msg}`,
      ...(state.recent || []),
    ].slice(0, 50);
  };

  // 1) Seed discovered players
  try {
    state.currentStep = "seed";
    pushLog(`Seed (${seedRegion}, ${seedCount})`);
    const { POST: SEED } = await import("@/app/api/crawl/seed/route");
    const req = new Request("http://internal/api/crawl/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: seedRegion, count: seedCount }),
    });
    const res = await SEED(req as unknown as Request);
    if (res?.ok) {
      let json: SeedResponse | null = null;
      try {
        json = (await res.json()) as SeedResponse;
      } catch {}
      const matches = json?.data?.matchesAnalyzed ?? "?";
      const unique = json?.data?.uniquePUUIDs ?? "?";
      const added = json?.data?.newPlayersAdded ?? "?";
      pushLog(
        `Seed terminé · matches=${matches}, uniques=${unique}, ajoutés=${added}`
      );
    } else {
      pushLog(`Seed terminé (réponse ${res?.status ?? "?"})`);
    }
  } catch (e) {
    console.error("[PIPELINE] Seed error", e);
    pushLog("Erreur seed");
  }

  // 2) Process pending players
  try {
    state.currentStep = "process";
    pushLog("Process en cours");
    const { POST: PROCESS } = await import("@/app/api/crawl/process/route");
    const res = await PROCESS();
    if (res?.ok) {
      let json: ProcessResponse | null = null;
      try {
        json = (await res.json()) as ProcessResponse;
      } catch {}
      const players = json?.data?.playersProcessed ?? "?";
      const matches = json?.data?.matchesCollected ?? "?";
      pushLog(`Process terminé · joueurs=${players}, matches=${matches}`);
    } else {
      pushLog(`Process terminé (réponse ${res?.status ?? "?"})`);
    }
  } catch (e) {
    console.error("[PIPELINE] Process error", e);
    pushLog("Erreur process");
  }

  // 3) Sync accounts from matches
  try {
    state.currentStep = "sync";
    pushLog(`Sync (quota ${maxRiotCallsPerCycle})`);
    const { POST: SYNC } = await import("@/app/api/admin/sync-accounts/route");
    const req = new Request("http://internal/api/admin/sync-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxRiotCallsPerCycle }),
    });
    const res = await SYNC(req as unknown as Request);
    if (res?.ok) {
      let json: SyncResponse | null = null;
      try {
        json = (await res.json()) as SyncResponse;
      } catch {}
      const total = json?.data?.totalPUUIDs ?? "?";
      const created = json?.data?.accountsCreated ?? "?";
      const updated = json?.data?.accountsUpdated ?? "?";
      pushLog(
        `Sync terminé · puuids=${total}, créés=${created}, maj=${updated}`
      );
    } else {
      pushLog(`Sync terminé (réponse ${res?.status ?? "?"})`);
    }
  } catch (e) {
    console.error("[PIPELINE] Sync error", e);
    pushLog("Erreur sync");
  }
}

export async function GET(request: NextRequest) {
  // Vérifier les permissions admin
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  const state: PipelineState = global.__ADMIN_PIPELINE__ || { running: false };
  return NextResponse.json({ success: true, state }, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Vérifier les permissions admin
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action as "start" | "stop" | undefined;
    const seedRegion =
      (body?.seedRegion as string | undefined)?.toLowerCase() || "euw1";
    const seedCount = Number(body?.seedCount ?? 50);
    const maxRiotCallsPerCycle = Number(body?.maxRiotCallsPerCycle ?? 50);

    if (action === "start") {
      if (!global.__ADMIN_PIPELINE__) {
        global.__ADMIN_PIPELINE__ = {
          running: false,
          cycles: 0,
          currentStep: null,
          lastMessage: null,
          recent: [],
        };
      }
      if (global.__ADMIN_PIPELINE__!.running) {
        return NextResponse.json(
          {
            success: true,
            state: global.__ADMIN_PIPELINE__,
            message: "Pipeline déjà en cours",
          },
          { status: 200 }
        );
      }

      global.__ADMIN_PIPELINE__!.running = true;
      global.__ADMIN_PIPELINE__!.currentStep = "initialisation";
      global.__ADMIN_PIPELINE__!.lastMessage = "Pipeline démarré";
      global.__ADMIN_PIPELINE__!.recent = [
        `${new Date().toLocaleTimeString()} · Pipeline démarré`,
        ...(global.__ADMIN_PIPELINE__!.recent || []),
      ].slice(0, 50);

      // Lancer la boucle asynchrone sans bloquer la réponse
      (async () => {
        while (
          global.__ADMIN_PIPELINE__ &&
          global.__ADMIN_PIPELINE__!.running
        ) {
          await runOneCycle(seedRegion, seedCount, maxRiotCallsPerCycle);
          if (!global.__ADMIN_PIPELINE__ || !global.__ADMIN_PIPELINE__!.running)
            break;
          global.__ADMIN_PIPELINE__!.cycles =
            (global.__ADMIN_PIPELINE__!.cycles || 0) + 1;
          global.__ADMIN_PIPELINE__!.lastCycleAt = new Date().toISOString();
          // Petite pause entre cycles
          await sleep(1000);
        }
      })();

      return NextResponse.json(
        { success: true, state: global.__ADMIN_PIPELINE__ },
        { status: 200 }
      );
    }

    if (action === "stop") {
      if (!global.__ADMIN_PIPELINE__) {
        global.__ADMIN_PIPELINE__ = { running: false };
      }
      global.__ADMIN_PIPELINE__!.running = false;
      return NextResponse.json(
        { success: true, state: global.__ADMIN_PIPELINE__ },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Action invalide (start|stop)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[PIPELINE] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la commande pipeline" },
      { status: 500 }
    );
  }
}

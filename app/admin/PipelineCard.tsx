"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, PlayIcon, SquareIcon } from "lucide-react";
import { toast } from "sonner";
import { RIOT_REGIONS } from "@/lib/riot-regions";

export function PipelineCard() {
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState<number>(0);
  const [lastCycleAt, setLastCycleAt] = useState<string | undefined>();
  const [polling, setPolling] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const [seedRegion, setSeedRegion] = useState("euw1");
  const [seedCount, setSeedCount] = useState("50");
  const [maxRiotCallsPerCycle, setMaxRiotCallsPerCycle] = useState("50");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/pipeline", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRunning(!!data?.state?.running);
      setCycles(data?.state?.cycles || 0);
      setLastCycleAt(data?.state?.lastCycleAt);
      if (data?.state?.currentStep) setCurrentStep(data.state.currentStep);
      if (data?.state?.lastMessage) setLastMessage(data.state.lastMessage);
      if (Array.isArray(data?.state?.recent)) {
        setLogs(data.state.recent);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to show latest logs (we prepend newest at the top ⇒ stick to top)
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [logs]);

  const start = async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          seedRegion,
          seedCount: parseInt(seedCount || "50", 10),
          maxRiotCallsPerCycle: parseInt(maxRiotCallsPerCycle || "50", 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erreur au démarrage du pipeline");
        return;
      }
      toast.success("Pipeline démarré");
      setRunning(true);
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau");
    } finally {
      setPolling(false);
    }
  };

  const stop = async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erreur à l'arrêt du pipeline");
        return;
      }
      toast.success("Pipeline arrêté");
      setRunning(false);
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau");
    } finally {
      setPolling(false);
    }
  };

  return (
    <Card variant="gradient" className="md:col-span-2">
      <CardHeader withGlow>
        <CardTitle>Pipeline continu</CardTitle>
        <CardDescription>
          Enchaîne découverte → traitement → synchronisation en boucle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={running ? "success" : "destructive"}>
            {running ? "Actif" : "Arrêté"}
          </Badge>
          <Badge variant="outline">Cycles: {cycles}</Badge>
          {lastCycleAt && (
            <span className="text-xs text-muted-foreground">
              Dernier: {new Date(lastCycleAt).toLocaleTimeString()}
            </span>
          )}
          {currentStep && (
            <span className="text-xs text-muted-foreground">
              Étape: {currentStep}
            </span>
          )}
          {lastMessage && (
            <span className="text-xs text-muted-foreground">
              • {lastMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Région seed</label>
            <Select
              value={seedRegion}
              onValueChange={setSeedRegion}
              disabled={running}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RIOT_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre seed/cycle</label>
            <Input
              type="number"
              min={1}
              value={seedCount}
              onChange={(e) => setSeedCount(e.target.value)}
              disabled={running}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Max appels Riot/cycle</label>
            <Input
              type="number"
              min={0}
              value={maxRiotCallsPerCycle}
              onChange={(e) => setMaxRiotCallsPerCycle(e.target.value)}
              disabled={running}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!running ? (
            <Button
              onClick={start}
              disabled={polling}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {polling ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />{" "}
                  Démarrage...
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 size-4" /> Démarrer
                </>
              )}
            </Button>
          ) : (
            <Button onClick={stop} disabled={polling} variant="destructive">
              {polling ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" /> Arrêt...
                </>
              ) : (
                <>
                  <SquareIcon className="mr-2 size-4" /> Arrêter
                </>
              )}
            </Button>
          )}
        </div>

        {/* Journal en direct */}
        <div
          ref={logRef}
          className="rounded-md border p-3 h-40 overflow-auto bg-muted/20"
        >
          {logs.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Aucun événement récent. Lancez le pipeline pour voir l'activité.
            </div>
          ) : (
            <ul className="space-y-1 text-xs leading-relaxed">
              {logs.map((line, i) => {
                const lower = line.toLowerCase();
                const color = lower.includes("erreur")
                  ? "text-red-500"
                  : lower.includes("seed")
                  ? "text-blue-500"
                  : lower.includes("process")
                  ? "text-amber-600 dark:text-amber-400"
                  : lower.includes("sync")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground";
                return (
                  <li key={i} className={color}>
                    {line}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

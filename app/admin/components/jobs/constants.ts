import {
  BarChart3Icon,
  LayersIcon,
  SearchIcon,
  UsersIcon,
  TrophyIcon,
  ImageIcon,
  BrainIcon,
  SwordsIcon,
  ShieldIcon,
  EraserIcon,
  UserCheckIcon,
  CalendarIcon,
  DatabaseIcon,
  SproutIcon,
} from "lucide-react";
import { createElement } from "react";
import { WORKER_DESCRIPTIONS } from "@/lib/workers/descriptions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobProgress {
  current: number;
  total: number;
  message?: string;
  percent?: number;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  total: number;
  deferred: number;
}

export interface RecentJob {
  id: string;
  queue: string;
  name: string;
  state: string;
  timestamp: number;
  startedOn?: number;
  completedOn?: number;
  duration?: number;
  retryCount?: number;
  output?: Record<string, unknown> | null;
}

export interface ScheduleInfo {
  cron: string;
  timezone: string;
}

export interface ActiveJobDetails {
  id: string;
  name: string;
  queue: string;
  progress: JobProgress;
  state: string;
  timestamp: number;
  processedOn?: number;
}

export interface JobsData {
  connected: boolean;
  queues: Record<string, QueueStatus>;
  recentJobs: RecentJob[];
  schedules?: Record<string, ScheduleInfo>;
  timestamp: number;
}

export interface QueueConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "analysis" | "sync" | "maintenance";
}

// ---------------------------------------------------------------------------
// Queue configuration -- all 12 queues, grouped by category
// ---------------------------------------------------------------------------

const iconClass = "size-4";

const QUEUE_ICONS: Record<string, React.ReactNode> = {
  "champion-stats": createElement(BarChart3Icon, { className: iconClass }),
  "composition-gen": createElement(LayersIcon, { className: iconClass }),
  "data-crawl": createElement(SearchIcon, { className: iconClass }),
  "account-sync": createElement(UsersIcon, { className: iconClass }),
  "leaderboard-sync": createElement(TrophyIcon, { className: iconClass }),
  "ddragon-sync": createElement(ImageIcon, { className: iconClass }),
  "meta-analysis": createElement(BrainIcon, { className: iconClass }),
  "synergy-analysis": createElement(SwordsIcon, { className: iconClass }),
  "item-builds": createElement(ShieldIcon, { className: iconClass }),
  "analyze-items": createElement(BarChart3Icon, { className: iconClass }),
  "data-cleanup": createElement(EraserIcon, { className: iconClass }),
  "account-refresh": createElement(UserCheckIcon, { className: iconClass }),
  "daily-reset": createElement(CalendarIcon, { className: iconClass }),
  "crawl-seed": createElement(SproutIcon, { className: iconClass }),
};

const QUEUE_CATEGORIES: Record<string, "analysis" | "sync" | "maintenance"> = {
  "champion-stats": "analysis",
  "composition-gen": "analysis",
  "data-crawl": "analysis",
  "meta-analysis": "analysis",
  "synergy-analysis": "analysis",
  "item-builds": "analysis",
  "analyze-items": "analysis",
  "account-sync": "sync",
  "leaderboard-sync": "sync",
  "ddragon-sync": "sync",
  "account-refresh": "sync",
  "data-cleanup": "maintenance",
  "daily-reset": "maintenance",
  "crawl-seed": "sync",
};

export const CATEGORY_LABELS: Record<string, string> = {
  analysis: "Analyse & Donn\u00e9es",
  sync: "Synchronisation",
  maintenance: "Maintenance",
};

function buildQueueConfig(): Record<string, QueueConfig> {
  const config: Record<string, QueueConfig> = {};
  for (const [key, desc] of Object.entries(WORKER_DESCRIPTIONS)) {
    config[key] = {
      label: desc.name,
      description: desc.description,
      icon:
        QUEUE_ICONS[key] ||
        createElement(DatabaseIcon, { className: iconClass }),
      category: QUEUE_CATEGORIES[key] || "maintenance",
    };
  }
  return config;
}

export const QUEUE_CONFIG = buildQueueConfig();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function normalizeProgress(
  progress: number | JobProgress | undefined
): JobProgress {
  if (!progress) return { current: 0, total: 100, percent: 0 };
  if (typeof progress === "number") {
    return { current: progress, total: 100, percent: progress };
  }
  const percent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
  return { ...progress, percent };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "\u00e0 l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString("fr-FR");
}

export function getElapsedTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  return formatDuration(elapsed);
}

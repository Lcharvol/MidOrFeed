interface TimerProps {
  phase: string;
  timeRemaining: number;
  totalTime: number;
}

const PHASE_NAMES: Record<string, string> = {
  PLANNING: 'Planification',
  BAN_PICK: 'Bans/Picks',
  FINALIZATION: 'Finalisation',
};

export function Timer({ phase, timeRemaining, totalTime }: TimerProps) {
  const progress = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;
  const seconds = Math.ceil(timeRemaining / 1000);
  const isLow = seconds <= 10;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-400">
          {PHASE_NAMES[phase] || phase}
        </span>
        <span
          className={`text-2xl font-bold tabular-nums ${
            isLow ? 'text-red-400 animate-pulse' : 'text-lol-gold'
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${
            isLow ? 'bg-red-500' : 'bg-lol-gold'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

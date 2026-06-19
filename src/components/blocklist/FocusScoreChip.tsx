import { Zap } from "lucide-react";
import type { FocusMetrics } from "@/types/blocklist";

interface FocusScoreChipProps {
  metrics: FocusMetrics;
}

function formatFocusTime(totalSeconds: number): string {
  const hours = totalSeconds / 3600;

  if (hours >= 1) {
    return `${hours.toFixed(1)} hours`;
  }

  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} minutes`;
}

export function FocusScoreChip({ metrics }: FocusScoreChipProps) {
  const formattedTime = formatFocusTime(metrics.totalFocusSeconds);
  const hasData = metrics.totalFocusSeconds > 0;

  return (
    <div className="flex items-center gap-4 px-4.5 py-4 bg-gradient-to-r from-primary/12 to-secondary/12 border border-primary/20 rounded-2xl shadow-lg shadow-black/15">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.45)] border border-white/10">
        <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2} fill="white" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-white font-bold tracking-tight">
          {hasData ? "Focus Score Improved" : "Start Focusing"}
        </p>
        <p className="text-xs text-on-surface-muted/90 mt-0.5 leading-relaxed">
          {hasData
            ? `Your blocklist saved you ${formattedTime} this week.`
            : "Complete a Pomodoro to track your progress."}
        </p>
      </div>
    </div>
  );
}

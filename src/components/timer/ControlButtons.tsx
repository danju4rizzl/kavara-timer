import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimerStatus } from "@/types/timer";

interface ControlButtonsProps {
  status: TimerStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function ControlButtons({ status, onPlay, onPause, onReset, onSkip }: ControlButtonsProps) {
  const isRunning = status === "running";

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Reset button */}
      <button
        onClick={onReset}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center",
          "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-on-surface hover:text-white transition-all duration-200",
          "hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
        )}
        aria-label="Reset timer"
      >
        <RotateCcw className="w-4.5 h-4.5 text-on-surface-muted hover:text-white transition-colors" strokeWidth={2} />
      </button>

      {/* Play/Pause button */}
      <button
        onClick={isRunning ? onPause : onPlay}
        className={cn(
          "w-15 h-15 rounded-full flex items-center justify-center",
          "gradient-primary shadow-[0_4px_20px_rgba(59,130,246,0.35)]",
          "hover:scale-105 hover:shadow-[0_4px_24px_rgba(59,130,246,0.55)] active:scale-95 transition-all duration-250 border border-white/10 cursor-pointer"
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        {isRunning ? (
          <Pause className="w-6 h-6 text-white" strokeWidth={2} fill="white" />
        ) : (
          <Play className="w-6 h-6 text-white ml-0.5" strokeWidth={2} fill="white" />
        )}
      </button>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center",
          "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-on-surface hover:text-white transition-all duration-200",
          "hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
        )}
        aria-label="Skip to next phase"
      >
        <SkipForward className="w-4.5 h-4.5 text-on-surface-muted hover:text-white transition-colors" strokeWidth={2} />
      </button>
    </div>
  );
}

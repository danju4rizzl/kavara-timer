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

const glassCircle =
  "liquid glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:text-white cursor-pointer" +
  "hover:-translate-y-0.5";

export function ControlButtons({ status, onPlay, onPause, onReset, onSkip }: ControlButtonsProps) {
  const isRunning = status === "running";

  return (
    <div className="flex items-center justify-center gap-7 py-3">
      <button onClick={onReset} className={glassCircle} aria-label="Reset timer">
        <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {/* Primary: tinted liquid glass "jewel" with a breathing halo while running */}
      <div className="relative">
        <span
          aria-hidden
          className={cn(
            "absolute -inset-3 rounded-full blur-xl transition-opacity duration-700",
            isRunning ? "opacity-70 motion-safe:animate-pulse" : "opacity-40"
          )}
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent-1) 60%, transparent), transparent 70%)" }}
        />
        <button
          onClick={isRunning ? onPause : onPlay}
          className={cn(
            "liquid gradient-primary relative flex h-[68px] w-[68px] items-center justify-center rounded-full cursor-pointer",
            "border border-white/25 hover:-translate-y-0.5 hover:scale-[1.04]"
          )}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {/* top sheen */}
          <span aria-hidden className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/35 to-transparent" />
          <span key={isRunning ? "pause" : "play"} className="relative animate-pop-in">
            {isRunning ? (
              <Pause className="h-7 w-7" strokeWidth={2} fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-7 w-7" strokeWidth={2} fill="currentColor" />
            )}
          </span>
        </button>
      </div>

      <button onClick={onSkip} className={glassCircle} aria-label="Skip to next phase">
        <SkipForward className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>
    </div>
  );
}

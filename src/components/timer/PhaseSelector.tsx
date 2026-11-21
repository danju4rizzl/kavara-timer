import { cn } from "@/lib/utils";
import type { TimerPhase } from "@/types/timer";
import { Flame, Coffee, Sparkles } from "lucide-react";

interface PhaseSelectorProps {
  activePhase: TimerPhase;
  onPhaseChange: (phase: TimerPhase) => void;
}

const PHASES: { id: TimerPhase; label: string; icon: React.ComponentType<{ className?: string }>; colors: string }[] = [
  { id: "pomodoro", label: "Focus", icon: Flame, colors: "var(--phase-focus-a), var(--phase-focus-b)" },
  { id: "shortBreak", label: "Short Break", icon: Coffee, colors: "var(--phase-short-a), var(--phase-short-b)" },
  { id: "longBreak", label: "Long Break", icon: Sparkles, colors: "var(--phase-long-a), var(--phase-long-b)" },
];

/**
 * iOS-style segmented control: a liquid thumb springs between the three
 * phases and cross-fades to each phase's color.
 */
export function PhaseSelector({ activePhase, onPhaseChange }: PhaseSelectorProps) {
  const activeIndex = Math.max(0, PHASES.findIndex((p) => p.id === activePhase));

  return (
    <div
      role="tablist"
      aria-label="Timer phase"
      className="glass-inset relative grid w-full max-w-[360px] grid-cols-3 rounded-full p-1"
    >
      {/* Thumb */}
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 overflow-hidden rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_6px_16px_-4px_rgb(0_0_0/0.5)]"
        style={{
          width: "calc((100% - 0.5rem) / 3)",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 560ms var(--ease-spring)",
        }}
      >
        {PHASES.map((phase, i) => (
          <span
            key={phase.id}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ background: `linear-gradient(135deg, ${phase.colors})`, opacity: i === activeIndex ? 1 : 0 }}
          />
        ))}
        {/* glass sheen */}
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      </span>

      {PHASES.map(({ id, label, icon: Icon }, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onPhaseChange(id)}
            className={cn(
              "relative z-10 flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full px-2",
              "text-[11px] font-semibold leading-none whitespace-nowrap cursor-pointer outline-none",
              isActive ? "text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]" : "text-white/55 hover:text-white"
            )}
          >
            <Icon className={cn("hidden h-3.5 w-3.5 shrink-0 min-[400px]:block", !isActive && "opacity-75")} />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

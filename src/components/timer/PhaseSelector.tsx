import { cn } from "@/lib/utils";
import type { TimerPhase } from "@/types/timer";

interface PhaseSelectorProps {
  activePhase: TimerPhase;
  onPhaseChange: (phase: TimerPhase) => void;
}

const PHASES: { id: TimerPhase; label: string }[] = [
  { id: "pomodoro", label: "Pomodoro" },
  { id: "shortBreak", label: "Short Break" },
  { id: "longBreak", label: "Long Break" },
];

export function PhaseSelector({ activePhase, onPhaseChange }: PhaseSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full glass-panel border-white/5 bg-[#0b1326]/40">
      {PHASES.map(({ id, label }) => {
        const isActive = activePhase === id;

        return (
          <button
            key={id}
            onClick={() => onPhaseChange(id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap active:scale-95 border",
              isActive
                ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 text-white shadow-[0_2px_10px_rgba(59,130,246,0.15)] text-glow"
                : "text-on-surface-muted/75 hover:text-white border-transparent hover:bg-white/5"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

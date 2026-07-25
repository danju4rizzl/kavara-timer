import { cn } from "@/lib/utils";
import type { TimerPhase } from "@/types/timer";
import { Flame, Coffee, Sparkles } from "lucide-react";

interface PhaseSelectorProps {
  activePhase: TimerPhase;
  onPhaseChange: (phase: TimerPhase) => void;
}

interface PhaseConfig {
  id: TimerPhase;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeGradient: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: "pomodoro",
    label: "Pomodoro",
    icon: Flame,
    activeGradient: "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_2px_14px_rgba(59,130,246,0.4)] border-white/25",
  },
  {
    id: "shortBreak",
    label: "Short Break",
    icon: Coffee,
    activeGradient: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-[0_2px_14px_rgba(16,185,129,0.4)] border-white/25",
  },
  {
    id: "longBreak",
    label: "Long Break",
    icon: Sparkles,
    activeGradient: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-[0_2px_14px_rgba(168,85,247,0.4)] border-white/25",
  },
];

export function PhaseSelector({ activePhase, onPhaseChange }: PhaseSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-2 rounded-full ">
      {PHASES.map(({ id, label, icon: Icon, activeGradient }) => {
        const isActive = activePhase === id;

        return (
          <button
            key={id}
            onClick={() => onPhaseChange(id)}
            className={cn(
              "grid items-center justify-center gap-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap border outline-none cursor-pointer select-none px-5",
              isActive
                ? cn(activeGradient, "scale-[1.02]")
                : "text-slate-300 hover:text-white border-transparent hover:bg-white/10 active:scale-95"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "opacity-75")} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}



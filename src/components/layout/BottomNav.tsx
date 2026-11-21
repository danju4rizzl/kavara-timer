import { Timer, Ban, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "timer" | "stats" | "blocklist" | "settings";

interface BottomNavProps {
  /** May be a view that isn't in the nav (e.g. "feedback"); then nothing is highlighted. */
  activeView: string;
  onViewChange: (view: ViewType) => void;
}

const NAV_ITEMS: { id: ViewType; label: string; icon: typeof Timer }[] = [
  { id: "timer", label: "Timer", icon: Timer },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "blocklist", label: "Blocklist", icon: Ban },
  { id: "settings", label: "Settings", icon: Settings },
];

/** Floating glass tab bar with a liquid indicator that slides between tabs. */
export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeView);

  return (
    <nav className="relative z-20 shrink-0 px-3 pb-3 pt-1">
      <div className="glass-bar relative grid grid-cols-4 rounded-[26px] p-1.5">
        {/* Sliding indicator */}
        <span
          aria-hidden
          className="absolute bottom-1.5 left-1.5 top-1.5 rounded-[20px] border border-white/15 bg-white/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_6px_18px_-6px_color-mix(in_oklab,var(--accent-1)_55%,transparent)]"
          style={{
            width: `calc((100% - 0.75rem) / ${NAV_ITEMS.length})`,
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
            opacity: activeIndex < 0 ? 0 : 1,
            transition: "transform 520ms var(--ease-spring), opacity 250ms ease",
          }}
        />

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-[20px] py-1.5 cursor-pointer"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-500 [transition-timing-function:var(--ease-spring)]",
                  isActive ? "scale-110 text-primary drop-shadow-[0_0_8px_color-mix(in_oklab,var(--accent-1)_60%,transparent)]" : "text-white/55"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide transition-colors duration-300",
                  isActive ? "text-white" : "text-white/50"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

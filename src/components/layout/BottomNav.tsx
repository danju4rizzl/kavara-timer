import { Timer, Ban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "timer" | "blocklist" | "settings";

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const NAV_ITEMS: { id: ViewType; label: string; icon: typeof Timer }[] = [
  { id: "timer", label: "Timer", icon: Timer },
  { id: "blocklist", label: "Blocklist", icon: Ban },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="flex items-center justify-around px-4 py-3 border-t border-white/5 bg-[#0b1326]/60 backdrop-blur-md">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeView === id;

        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={cn(
              "flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300 relative overflow-hidden",
              isActive
                ? "bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                : "border border-transparent hover:bg-white/5"
            )}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-all duration-300",
                isActive
                  ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-110"
                  : "text-on-surface-muted/65 hover:text-white"
              )}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              className={cn(
                "text-[10px] font-semibold tracking-wide transition-colors duration-300",
                isActive ? "text-white" : "text-on-surface-muted/65"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

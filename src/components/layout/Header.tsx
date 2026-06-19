import { ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSettingsClick: () => void;
  showBack: boolean;
  onBackClick: () => void;
}

export function Header({ onSettingsClick, showBack, onBackClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4.5 border-b border-white/5 bg-[#0b1326]/20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBackClick}
            className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 active:scale-95 transition-all duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h1
          className={cn(
            "text-headline-md font-bold tracking-tight",
            showBack
              ? "text-white text-lg font-semibold"
              : "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(59,130,246,0.2)]"
          )}
        >
          {showBack ? "Settings" : "FocusFlow"}
        </h1>
      </div>

      {!showBack && (
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-on-surface-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 active:scale-95 transition-all duration-200"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {showBack && (
        <div className="p-2 opacity-30">
          <Settings className="w-5 h-5 text-on-surface-muted" />
        </div>
      )}
    </header>
  );
}

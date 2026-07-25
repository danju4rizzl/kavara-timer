import { ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSettingsClick: () => void;
  showBack: boolean;
  onBackClick: () => void;
}

export function Header({ onSettingsClick, showBack, onBackClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0b1326]/60 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBackClick}
            className="p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h1
          className={cn(
            "text-headline-md font-bold tracking-tight select-none",
            showBack
              ? "text-white text-lg font-semibold"
              : "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]"
          )}
        >
          {showBack ? "Settings" : "FocusFlow"}
        </h1>
      </div>

      {!showBack && (
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {showBack && (
        <div className="p-2.5 opacity-30">
          <Settings className="w-5 h-5 text-slate-400" />
        </div>
      )}
    </header>
  );
}


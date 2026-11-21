import { ArrowLeft, MessageSquarePlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Title shown when on a sub-page (Settings, Feedback). Omit on main views. */
  subPageTitle?: string;
  onBackClick: () => void;
  onSettingsClick: () => void;
  onFeedbackClick: () => void;
}

const iconButton =
  "liquid flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80" +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:text-white cursor-pointer";

export function Header({ subPageTitle, onBackClick, onSettingsClick, onFeedbackClick }: HeaderProps) {
  const isSubPage = Boolean(subPageTitle);

  return (
    <header className="glass-bar relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-4">
      <div className="flex min-w-0 items-center gap-2">
        {isSubPage && (
          <button onClick={onBackClick} className={cn(iconButton, "-ml-1")} aria-label="Go back">
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
        )}
        <h1
          key={subPageTitle ?? "home"}
          className={cn(
            "truncate font-bold tracking-tight select-none animate-fade-in",
            isSubPage ? "text-[17px] text-white" : "gradient-text text-lg"
          )}
        >
          {subPageTitle ?? "FocusFlow"}
        </h1>
      </div>

      {!isSubPage && (
        <div className="flex items-center gap-2">
          <button onClick={onFeedbackClick} className={iconButton} aria-label="Send feedback" title="Send feedback">
            <MessageSquarePlus className="h-[18px] w-[18px]" />
          </button>
          <button onClick={onSettingsClick} className={iconButton} aria-label="Open settings" title="Settings">
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </header>
  );
}

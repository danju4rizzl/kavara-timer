import { ShieldAlert } from "lucide-react";

interface SiteAccessWarningProps {
  onFix: () => void;
  compact?: boolean;
}

/** Shown when the browser only lets FocusFlow run on some sites, which breaks blocking. */
export function SiteAccessWarning({ onFix, compact = false }: SiteAccessWarningProps) {
  const isEdge = navigator.userAgent.includes("Edg/");
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[11px] font-semibold leading-snug text-amber-100">Site blocking is off</p>
        {!compact && (
          <p className="text-[10.5px] leading-relaxed text-amber-100/80">
            FocusFlow isn't allowed to run on all websites, so it can't block distracting ones. In{" "}
            {isEdge ? "Edge" : "your browser"}'s extension settings, set FocusFlow's <b>site access</b> to{" "}
            <b>On all sites</b>, or use the button below.
          </p>
        )}
        <button
          type="button"
          onClick={onFix}
          className="rounded-lg border border-amber-300/30 bg-amber-300/15 px-2.5 py-1 text-[10.5px] font-semibold text-amber-50 transition-colors hover:bg-amber-300/25 cursor-pointer"
        >
          Allow on all sites
        </button>
      </div>
    </div>
  );
}

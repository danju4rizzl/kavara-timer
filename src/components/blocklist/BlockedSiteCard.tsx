import { Trash2, Globe, Monitor, MessageCircle, Gamepad2, ShoppingBag, Users } from "lucide-react";
import type { BlockedSite } from "@/types/blocklist";
import { cn } from "@/lib/utils";

interface BlockedSiteCardProps {
  site: BlockedSite;
  onToggle?: (siteId: string) => void;
  onRemove?: (siteId: string) => void;
  isReadOnly?: boolean;
}

const CATEGORY_ICONS: Record<string, typeof Globe> = {
  "Social Media": MessageCircle,
  Entertainment: Monitor,
  Gaming: Gamepad2,
  Shopping: ShoppingBag,
  Community: Users,
  News: Globe,
  Other: Globe,
};

export function BlockedSiteCard({ site, onToggle, onRemove, isReadOnly = false }: BlockedSiteCardProps) {
  const IconComponent = CATEGORY_ICONS[site.category] ?? Globe;
  const isActive = site.isActive !== false;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white/[0.05] border rounded-xl group transition-all duration-200",
        isActive
          ? "border-white/5 hover:bg-white/5 hover:border-white/10"
          : "border-dashed border-white/5 opacity-55 hover:bg-white/5"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center border transition-colors duration-200",
          isActive
            ? "bg-primary/10 border-primary/15"
            : "bg-white/[0.08] border-white/5"
        )}
      >
        <IconComponent
          className={cn(
            "w-4.5 h-4.5 transition-all duration-200",
            isActive ? "text-primary drop-shadow-[0_0_6px_color-mix(in_oklab,var(--accent-1)_30%,transparent)]" : "text-on-surface-muted/40"
          )}
          strokeWidth={1.8}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-semibold truncate tracking-tight transition-colors duration-200",
            isActive ? "text-white" : "text-on-surface-muted/50 line-through"
          )}
        >
          {site.domain}
        </p>
        <p className="text-[10px] text-on-surface-muted/80">{site.category}</p>
      </div>

      {!isReadOnly && (
        <div className="flex items-center gap-1.5">
          {/* Toggle Switch */}
          {onToggle && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggle(site.id || site.domain);
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isActive ? "bg-primary" : "bg-white/[0.1]"
              )}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  isActive ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          )}

          {/* Delete button */}
          {onRemove && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(site.id || site.domain);
              }}
              className="p-1.5 rounded-lg text-on-surface-muted/60 hover:text-error hover:bg-error/10 active:scale-90 transition-all duration-200 opacity-70 group-hover:opacity-100 cursor-pointer"
              aria-label={`Remove ${site.domain}`}
            >
              <Trash2 className="w-4 h-4 pointer-events-none" strokeWidth={1.8} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

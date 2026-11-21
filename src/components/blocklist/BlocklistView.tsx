import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import { BlocklistInput } from "./BlocklistInput";
import { BlockedSiteCard } from "./BlockedSiteCard";
import { FocusScoreChip } from "./FocusScoreChip";
import { Shield, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteAccessWarning } from "@/components/ui/SiteAccessWarning";

interface BlocklistViewProps {
  customSites: BlockedSite[];
  customActive: boolean;
  socialMediaSites: BlockedSite[];
  socialMediaActive: boolean;
  focusMetrics: FocusMetrics;
  onAddSites: (sites: BlockedSite[]) => void;
  onToggleSite: (siteId: string, listType: "custom" | "socialMedia") => void;
  onDeleteSite: (siteId: string, listType: "custom" | "socialMedia") => void;
  onToggleBlocklistActive: (listType: "custom" | "socialMedia", isActive: boolean) => void;
  autoDetectCategories: boolean;
  /** True when the browser has limited FocusFlow's site access, so nothing can be blocked. */
  siteAccessMissing: boolean;
  onFixSiteAccess: () => void;
}

export function BlocklistView({
  customSites = [],
  customActive = true,
  socialMediaSites = [],
  socialMediaActive = true,
  focusMetrics,
  onAddSites,
  onToggleSite,
  onDeleteSite,
  onToggleBlocklistActive,
  autoDetectCategories,
  siteAccessMissing,
  onFixSiteAccess,
}: BlocklistViewProps) {
  const activeSMCount = (socialMediaSites || []).filter((s) => s && s.isActive !== false).length;
  const activeCustomCount = (customSites || []).filter((s) => s && s.isActive !== false).length;

  const safeSMSites = socialMediaSites || [];
  const safeCustomSites = customSites || [];

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Header */}
      <div>
        <h2 className="text-headline-md font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_10px_color-mix(in_oklab,var(--accent-1)_15%,transparent)]">
          Productivity Blockers
        </h2>
        <p className="text-xs text-on-surface-muted/90 mt-1">
          Eliminate digital noise by restricting access to distracting websites during focus mode.
        </p>
      </div>

      {/* Focus metrics */}
      {siteAccessMissing && <SiteAccessWarning onFix={onFixSiteAccess} />}

      <FocusScoreChip metrics={focusMetrics} />

      {/* 1. Social Media Blocker Preset List */}
      <div className="glass-panel rounded-[22px] p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Sparkles className="w-4 h-4 text-secondary drop-shadow-[0_0_6px_color-mix(in_oklab,var(--accent-2)_40%,transparent)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">Social Media Blocker</h3>
              <p className="text-[10px] text-on-surface-muted/70">Built-in distraction filter</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all duration-200",
                socialMediaActive
                  ? "bg-secondary/10 border-secondary/20 text-secondary"
                  : "bg-white/[0.08] border-white/5 text-on-surface-muted/50"
              )}
            >
              {socialMediaActive ? `${activeSMCount} Active` : "Inactive"}
            </span>

            <button
              onClick={() => onToggleBlocklistActive("socialMedia", !socialMediaActive)}
              className={cn(
                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                socialMediaActive ? "bg-secondary" : "bg-white/[0.1]"
              )}
              role="switch"
              aria-checked={socialMediaActive}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  socialMediaActive ? "translate-x-4.5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {safeSMSites.length > 0 ? (
          <div
            className={cn(
              "space-y-2 max-h-[150px] overflow-y-auto pr-1 transition-opacity duration-200",
              !socialMediaActive && "opacity-40"
            )}
          >
            {safeSMSites.map((site) => (
              <BlockedSiteCard
                key={site.id}
                site={site}
                isReadOnly={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 px-3 bg-white/5 border border-dashed border-white/5 rounded-xl text-on-surface-muted/60">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px]">All social media websites removed from preset.</span>
          </div>
        )}
      </div>

      {/* 2. Custom Blocklist */}
      <div className="glass-panel rounded-[22px] p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <Shield className="w-4 h-4 text-primary drop-shadow-[0_0_6px_color-mix(in_oklab,var(--accent-1)_40%,transparent)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">Custom Blocker</h3>
              <p className="text-[10px] text-on-surface-muted/70">Personalize your restrictions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all duration-200",
                customActive
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-white/[0.08] border-white/5 text-on-surface-muted/50"
              )}
            >
              {customActive ? `${activeCustomCount} Active` : "Inactive"}
            </span>

            <button
              onClick={() => onToggleBlocklistActive("custom", !customActive)}
              className={cn(
                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                customActive ? "bg-primary" : "bg-white/[0.1]"
              )}
              role="switch"
              aria-checked={customActive}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  customActive ? "translate-x-4.5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Input for adding custom sites */}
        {customActive && (
          <BlocklistInput
            onAddSites={onAddSites}
            autoDetectCategories={autoDetectCategories}
            customSites={safeCustomSites}
          />
        )}

        {safeCustomSites.length > 0 && (
          <div
            className={cn(
              "space-y-2 max-h-[160px] overflow-y-auto pr-1 transition-opacity duration-200",
              !customActive && "opacity-40"
            )}
          >
            {safeCustomSites.map((site) => (
              <BlockedSiteCard
                key={site.id}
                site={site}
                onToggle={(id) => onToggleSite(id, "custom")}
                onRemove={(id) => onDeleteSite(id, "custom")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

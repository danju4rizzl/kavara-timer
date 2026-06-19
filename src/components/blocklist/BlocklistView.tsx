import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import { BlocklistInput } from "./BlocklistInput";
import { BlockedSiteCard } from "./BlockedSiteCard";
import { FocusScoreChip } from "./FocusScoreChip";

interface BlocklistViewProps {
  blockedSites: BlockedSite[];
  focusMetrics: FocusMetrics;
  onAddSites: (sites: BlockedSite[]) => void;
  onRemoveSite: (siteId: string) => void;
  autoDetectCategories: boolean;
}

export function BlocklistView({
  blockedSites,
  focusMetrics,
  onAddSites,
  onRemoveSite,
  autoDetectCategories,
}: BlocklistViewProps) {
  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Section header */}
      <div>
        <h2 className="text-headline-md font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.15)]">
          Boost Productivity
        </h2>
        <p className="text-xs text-on-surface-muted/90 mt-1">
          Eliminate digital noise by restricting access to distracting websites.
        </p>
      </div>

      {/* Input area */}
      <BlocklistInput onAddSites={onAddSites} autoDetectCategories={autoDetectCategories} />

      {/* Blocked sites list */}
      {blockedSites.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-semibold tracking-wider text-primary/95 uppercase">Currently Blocked</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
              {blockedSites.length} Active
            </span>
          </div>

          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {blockedSites.map((site) => (
              <BlockedSiteCard key={site.id} site={site} onRemove={onRemoveSite} />
            ))}
          </div>
        </div>
      )}

      {/* Focus score */}
      <FocusScoreChip metrics={focusMetrics} />
    </div>
  );
}

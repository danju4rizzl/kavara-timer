import { Trash2, Globe, Monitor, MessageCircle, Gamepad2, ShoppingBag, Users } from "lucide-react";
import type { BlockedSite } from "@/types/blocklist";

interface BlockedSiteCardProps {
  site: BlockedSite;
  onRemove: (siteId: string) => void;
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

export function BlockedSiteCard({ site, onRemove }: BlockedSiteCardProps) {
  const IconComponent = CATEGORY_ICONS[site.category] ?? Globe;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0b1326]/35 border border-white/5 rounded-xl group hover:bg-white/5 hover:border-white/10 transition-all duration-200">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/15">
        <IconComponent className="w-4.5 h-4.5 text-primary drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]" strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-white font-semibold truncate tracking-tight">{site.domain}</p>
        <p className="text-[10px] text-on-surface-muted/80">{site.category}</p>
      </div>

      <button
        onClick={() => onRemove(site.id)}
        className="p-2 rounded-lg text-on-surface-muted/60 hover:text-error hover:bg-error/10 active:scale-90 transition-all duration-200 opacity-70 group-hover:opacity-100 cursor-pointer"
        aria-label={`Remove ${site.domain}`}
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

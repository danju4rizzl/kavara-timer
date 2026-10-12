import { useState } from "react";
import type { BlockedSite } from "@/types/blocklist";
import { DEFAULT_SOCIAL_MEDIA_SITES } from "@/types/blocklist";
import { detectCategory } from "@/lib/categoryDetector";

interface BlocklistInputProps {
  onAddSites: (sites: BlockedSite[]) => void;
  autoDetectCategories: boolean;
  customSites: BlockedSite[];
}

export function BlocklistInput({
  onAddSites,
  autoDetectCategories,
  customSites,
}: BlocklistInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSave() {
    setFeedback(null);
    const lines = inputValue
      .split("\n")
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""));

    const uniqueDomains = [...new Set(lines)];

    if (uniqueDomains.length === 0) return;

    for (const domain of uniqueDomains) {
      const normalized = domain.replace(/^www\./, "");

      // 1. Check if matches any DEFAULT_SOCIAL_MEDIA_SITES (always active now)
      const defaultSM = DEFAULT_SOCIAL_MEDIA_SITES.find(
        (s) => s.domain.toLowerCase().replace(/^www\./, "") === normalized
      );

      if (defaultSM) {
        setFeedback(`"${defaultSM.domain}" has already been added to the Social Media Blocker list.`);
        return;
      } else {
        // 2. Check if matches custom blocker list
        const isCustomExist = customSites.some(
          (s) => s.domain.toLowerCase().replace(/^www\./, "") === normalized
        );
        if (isCustomExist) {
          setFeedback(`"${domain}" has already been added to the Custom Blocker list.`);
          return;
        }
      }
    }

    const newSites: BlockedSite[] = uniqueDomains.map((domain) => ({
      id: crypto.randomUUID(),
      domain,
      category: autoDetectCategories ? detectCategory(domain) : "Other",
      addedAt: Date.now(),
      isActive: true,
    }));

    onAddSites(newSites);
    setInputValue("");
  }

  return (
    <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl p-4.5 space-y-3 shadow-md">
      <h3 className="text-[10px] font-bold text-on-surface-muted/80 tracking-wider uppercase px-0.5">Add to Blocklist</h3>

      <textarea
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.target.value);
          if (feedback) setFeedback(null); // Clear feedback when user types
        }}
        placeholder={"Enter sites to block, one per line (e.g.,\nfacebook.com)"}
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-white/5 text-sm text-white placeholder:text-on-surface-muted/40 resize-none focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
      />

      {feedback && (
        <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl font-medium leading-relaxed">
          {feedback}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={inputValue.trim().length === 0}
        className="w-full py-2.5 rounded-xl gradient-primary text-white font-semibold text-xs hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-30 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
      >
        Save Blocklist
      </button>
    </div>
  );
}

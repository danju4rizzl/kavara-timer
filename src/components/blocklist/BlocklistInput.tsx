import { useState } from "react";
import type { BlockedSite } from "@/types/blocklist";
import { detectCategory } from "@/lib/categoryDetector";

interface BlocklistInputProps {
  onAddSites: (sites: BlockedSite[]) => void;
  autoDetectCategories: boolean;
}

export function BlocklistInput({ onAddSites, autoDetectCategories }: BlocklistInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleSave() {
    const lines = inputValue
      .split("\n")
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""));

    const uniqueDomains = [...new Set(lines)];

    if (uniqueDomains.length === 0) return;

    const newSites: BlockedSite[] = uniqueDomains.map((domain) => ({
      id: crypto.randomUUID(),
      domain,
      category: autoDetectCategories ? detectCategory(domain) : "Other",
      addedAt: Date.now(),
    }));

    onAddSites(newSites);
    setInputValue("");
  }

  return (
    <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl p-4.5 space-y-3 shadow-md">
      <h3 className="text-[10px] font-bold text-on-surface-muted/80 tracking-wider uppercase px-0.5">Add to Blocklist</h3>

      <textarea
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={"Enter sites to block, one per line (e.g.,\nfacebook.com)"}
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-white/5 text-sm text-white placeholder:text-on-surface-muted/40 resize-none focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
      />

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

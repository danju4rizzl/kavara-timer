import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeId } from "@/lib/themes";

interface ThemePickerProps {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

/**
 * Theme swatches. Picking one previews it instantly across the whole panel;
 * it's kept when settings are saved and reverted on Discard.
 */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="px-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Appearance</h3>
        <p className="mt-0.5 px-0.5 text-[10px] text-on-surface-muted/75">Pick a color theme. It previews instantly.</p>
      </div>

      <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-3 gap-2">
        {THEMES.map((theme) => {
          const selected = theme.id === value;
          const [a, b, c] = theme.swatch;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(theme.id)}
              title={theme.description}
              className={cn(
                "liquid glass-panel flex flex-col items-center gap-2 rounded-[20px] px-2 pb-2.5 pt-3 cursor-pointer",
                "hover:-translate-y-0.5",
                selected && "border-white/30 bg-white/[0.12]"
              )}
            >
              {/* Liquid-glass swatch "pebble" */}
              <span
                className={cn(
                  "relative h-10 w-10 rounded-full transition-transform duration-500 [transition-timing-function:var(--ease-spring)]",
                  selected && "scale-110"
                )}
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${c}, transparent 55%), linear-gradient(135deg, ${a}, ${b})`,
                  boxShadow: `inset 0 1px 1px rgb(255 255 255 / 0.55), inset 0 -2px 4px rgb(0 0 0 / 0.25), 0 6px 16px -4px ${a}99`,
                }}
              >
                <span className="absolute inset-x-1.5 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent" />
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center animate-pop-in">
                    <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={cn("max-w-full truncate text-[11px] font-semibold", selected ? "text-white" : "text-white/70")}>
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

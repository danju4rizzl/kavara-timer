import { Volume1, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
  label: string;
  /** Section heading above the card; omit for none. */
  heading?: string;
  /** Render without the card chrome (when nested inside another card). */
  bare?: boolean;
}

/** iOS-style slider: thick glass track, accent fill, large white knob that grows while dragged. */
export function VolumeControl({ volume, onChange, label, heading, bare = false }: VolumeControlProps) {
  return (
    <div className="space-y-1">
      {heading && <h3 className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{heading}</h3>}

      <div className={cn("space-y-3", !bare && "glass-panel rounded-[22px] px-5 py-3.5")}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white">{label}</p>
          <span className="text-xs font-bold tabular-nums text-primary">{volume}%</span>
        </div>

        <div className="flex items-center gap-3">
          <Volume1 className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.8} />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            aria-label={label}
            onChange={(event) => onChange(parseInt(event.target.value, 10))}
            className={cn(
              "h-1.5 flex-1 cursor-pointer appearance-none rounded-full",
              "shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]",
              "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
              "[&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgb(0_0_0/0.4),0_0_0_0.5px_rgb(0_0_0/0.1)]",
              "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-300",
              "[&::-webkit-slider-thumb]:[transition-timing-function:var(--ease-spring)]",
              "hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-125",
              "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
            )}
            style={{
              background: `linear-gradient(to right, var(--accent-1) 0%, var(--accent-2) ${volume}%, rgb(255 255 255 / 0.12) ${volume}%, rgb(255 255 255 / 0.12) 100%)`,
            }}
          />
          <Volume2 className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

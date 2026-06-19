import { Volume1, Volume2 } from "lucide-react";

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
}

export function VolumeControl({ volume, onChange }: VolumeControlProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Sound &amp; Alarms</h3>

      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl px-5 py-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white font-semibold">Alarm Volume</p>
          <span className="text-xs text-primary font-bold text-glow">{volume}%</span>
        </div>

        <div className="flex items-center gap-3">
          <Volume1 className="w-4 h-4 text-on-surface-muted/70 flex-shrink-0" strokeWidth={1.8} />

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(event) => onChange(parseInt(event.target.value, 10))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-slate-950/80 border border-white/5
              [&::-webkit-slider-runnable-track]:h-1
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-primary
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.6)]
              [&::-webkit-slider-thumb]:-mt-[5px]
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(59,130,246,0.8)]
              [&::-moz-range-track]:h-1
              [&::-moz-range-track]:rounded-full
              [&::-moz-range-thumb]:w-3.5
              [&::-moz-range-thumb]:h-3.5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-primary
              [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.6)]
              [&::-moz-range-thumb]:hover:scale-110
            "
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-secondary) ${volume}%, rgba(255,255,255,0.06) ${volume}%, rgba(255,255,255,0.06) 100%)`,
            }}
          />

          <Volume2 className="w-4 h-4 text-on-surface-muted/70 flex-shrink-0" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

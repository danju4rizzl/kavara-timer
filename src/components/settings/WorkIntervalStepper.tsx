import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkIntervalStepperProps {
  value: number;
  onChange: (value: number) => void;
}

export function WorkIntervalStepper({ value, onChange }: WorkIntervalStepperProps) {
  function decrement() {
    if (value > 1) onChange(value - 1);
  }

  function increment() {
    if (value < 12) onChange(value + 1);
  }

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Flow Schedule</h3>

      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">Work Intervals</p>
            <p className="text-[10px] text-on-surface-muted/80">Sessions before long break</p>
          </div>

          <div className="flex items-center gap-0">
            <button
              onClick={decrement}
              disabled={value <= 1}
              className={cn(
                "w-8 h-8 rounded-l-lg flex items-center justify-center border border-white/5 bg-slate-950/60 hover:bg-white/5 active:scale-95 transition-all duration-200",
                "disabled:opacity-15 disabled:pointer-events-none cursor-pointer"
              )}
              aria-label="Decrease intervals"
            >
              <Minus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </button>

            <div className="w-9 h-8 flex items-center justify-center border-y border-white/5 bg-slate-950/60 text-xs text-primary font-bold">
              {value}
            </div>

            <button
              onClick={increment}
              disabled={value >= 12}
              className={cn(
                "w-8 h-8 rounded-r-lg flex items-center justify-center border border-white/5 bg-slate-950/60 hover:bg-white/5 active:scale-95 transition-all duration-200",
                "disabled:opacity-15 disabled:pointer-events-none cursor-pointer"
              )}
              aria-label="Increase intervals"
            >
              <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

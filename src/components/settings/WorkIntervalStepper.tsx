import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkIntervalStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Section heading; pass null for none. */
  heading?: string | null;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
}

export function WorkIntervalStepper({
  value,
  onChange,
  heading = "Flow Schedule",
  label = "Focus Sessions",
  description = "Sessions before a long break",
  min = 1,
  max = 12,
}: WorkIntervalStepperProps) {
  function decrement() {
    if (value > min) onChange(value - 1);
  }

  function increment() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div className="space-y-1">
      {heading && <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">{heading}</h3>}

      <div className="glass-panel rounded-[22px] px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">{label}</p>
            <p className="text-[10px] text-on-surface-muted/80">{description}</p>
          </div>

          <div className="flex items-center gap-0">
            <button
              onClick={decrement}
              disabled={value <= min}
              className={cn(
                "w-8 h-8 rounded-l-lg flex items-center justify-center border border-white/5 glass-inset hover:bg-white/5 active:scale-95 transition-all duration-200",
                "disabled:opacity-15 disabled:pointer-events-none cursor-pointer"
              )}
              aria-label={`Decrease ${label.toLowerCase()}`}
            >
              <Minus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </button>

            <div className="w-9 h-8 flex items-center justify-center border-y border-white/5 glass-inset text-xs text-primary font-bold">
              {value}
            </div>

            <button
              onClick={increment}
              disabled={value >= max}
              className={cn(
                "w-8 h-8 rounded-r-lg flex items-center justify-center border border-white/5 glass-inset hover:bg-white/5 active:scale-95 transition-all duration-200",
                "disabled:opacity-15 disabled:pointer-events-none cursor-pointer"
              )}
              aria-label={`Increase ${label.toLowerCase()}`}
            >
              <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

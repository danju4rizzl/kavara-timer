import type { TimerSettings } from "@/types/settings";

interface DurationCardProps {
  settings: TimerSettings;
  onUpdate: (partial: Partial<TimerSettings>) => void;
}

const DURATION_FIELDS: {
  key: keyof Pick<TimerSettings, "pomodoroDuration" | "shortBreakDuration" | "longBreakDuration">;
  label: string;
  description: string;
}[] = [
  { key: "pomodoroDuration", label: "Pomodoro Duration", description: "Minutes per focus block" },
  { key: "shortBreakDuration", label: "Short Break", description: "Rest between focus sessions" },
  { key: "longBreakDuration", label: "Long Break", description: "Extended rest after intervals" },
];

export function DurationCard({ settings, onUpdate }: DurationCardProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Focus Sessions</h3>

      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl divide-y divide-white/5 shadow-sm">
        {DURATION_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-xs text-white font-semibold">{label}</p>
              <p className="text-[10px] text-on-surface-muted/80">{description}</p>
            </div>

            <input
              type="number"
              min={1}
              max={120}
              value={settings[key]}
              onChange={(event) => {
                const value = parseInt(event.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 120) {
                  onUpdate({ [key]: value });
                }
              }}
              className="w-14 h-8.5 rounded-xl bg-slate-950 border border-white/5 text-center text-xs text-primary font-bold focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

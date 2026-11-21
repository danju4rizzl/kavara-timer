import { useState, useEffect } from "react";
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
  { key: "pomodoroDuration", label: "Focus Duration", description: "Minutes per focus session" },
  { key: "shortBreakDuration", label: "Short Break", description: "Rest between focus sessions" },
  { key: "longBreakDuration", label: "Long Break", description: "Extended rest after intervals" },
];

type DurationFieldKey = "pomodoroDuration" | "shortBreakDuration" | "longBreakDuration";

export function DurationCard({ settings, onUpdate }: DurationCardProps) {
  const [localValues, setLocalValues] = useState<Record<DurationFieldKey, string>>({
    pomodoroDuration: String(settings.pomodoroDuration),
    shortBreakDuration: String(settings.shortBreakDuration),
    longBreakDuration: String(settings.longBreakDuration),
  });

  useEffect(() => {
    setLocalValues({
      pomodoroDuration: String(settings.pomodoroDuration),
      shortBreakDuration: String(settings.shortBreakDuration),
      longBreakDuration: String(settings.longBreakDuration),
    });
  }, [settings.pomodoroDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const handleChange = (key: DurationFieldKey, valueStr: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: valueStr }));
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 1 && val <= 120) {
      onUpdate({ [key]: val });
    }
  };

  const handleBlur = (key: DurationFieldKey) => {
    const val = parseInt(localValues[key], 10);
    if (isNaN(val) || val < 1) {
      setLocalValues((prev) => ({ ...prev, [key]: String(settings[key]) }));
    } else if (val > 120) {
      setLocalValues((prev) => ({ ...prev, [key]: "120" }));
      onUpdate({ [key]: 120 });
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Focus Sessions</h3>

      <div className="glass-panel rounded-[22px] divide-y divide-white/5">
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
              value={localValues[key]}
              onChange={(event) => handleChange(key, event.target.value)}
              onBlur={() => handleBlur(key)}
              className="w-14 h-8.5 rounded-xl glass-inset border border-white/5 text-center text-xs text-primary font-bold focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

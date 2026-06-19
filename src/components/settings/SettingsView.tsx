import type { TimerSettings } from "@/types/settings";
import type { MetricsClearInterval } from "@/types/settings";
import type { PopupMessage } from "@/types/messages";
import { DurationCard } from "./DurationCard";
import { WorkIntervalStepper } from "./WorkIntervalStepper";
import { VolumeControl } from "./VolumeControl";
import { SoundSelector } from "./SoundSelector";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  settings: TimerSettings;
  isDirty: boolean;
  onUpdate: (partial: Partial<TimerSettings>) => void;
  onSave: () => void;
  onDiscard: () => void;
  onClearMetrics: () => void;
  sendMessage: (message: PopupMessage) => void;
}

const METRICS_INTERVALS: { value: MetricsClearInterval; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "manual", label: "Manual" },
];

export function SettingsView({
  settings,
  isDirty,
  onUpdate,
  onSave,
  onDiscard,
  onClearMetrics,
  sendMessage,
}: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-5 py-3">
      <DurationCard settings={settings} onUpdate={onUpdate} />

      <WorkIntervalStepper
        value={settings.longBreakInterval}
        onChange={(value) => onUpdate({ longBreakInterval: value })}
      />

      <VolumeControl
        volume={settings.alarmVolume}
        onChange={(volume) => onUpdate({ alarmVolume: volume })}
      />

      <SoundSelector
        settings={settings}
        onUpdate={onUpdate}
        sendMessage={sendMessage}
      />

      {/* Auto-start toggle */}
      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">Auto-start Next Phase</p>
            <p className="text-[10px] text-on-surface-muted/80">Automatically begin the next interval</p>
          </div>
          <button
            onClick={() => onUpdate({ autoStartNextPhase: !settings.autoStartNextPhase })}
            className={cn(
              "w-10 h-5.5 rounded-full relative transition-all duration-300 border cursor-pointer",
              settings.autoStartNextPhase 
                ? "gradient-primary border-primary/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                : "bg-slate-900 border-white/5"
            )}
            role="switch"
            aria-checked={settings.autoStartNextPhase}
          >
            <div
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300",
                settings.autoStartNextPhase ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Auto-detect categories toggle */}
      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">Auto-detect Categories</p>
            <p className="text-[10px] text-on-surface-muted/80">Classify sites automatically</p>
          </div>
          <button
            onClick={() => onUpdate({ autoDetectCategories: !settings.autoDetectCategories })}
            className={cn(
              "w-10 h-5.5 rounded-full relative transition-all duration-300 border cursor-pointer",
              settings.autoDetectCategories 
                ? "gradient-primary border-primary/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                : "bg-slate-900 border-white/5"
            )}
            role="switch"
            aria-checked={settings.autoDetectCategories}
          >
            <div
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300",
                settings.autoDetectCategories ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Metrics clear interval */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Metrics</h3>

        <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl px-5 py-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white font-semibold">Clear Tracking</p>
            <select
              value={settings.metricsClearInterval}
              onChange={(event) =>
                onUpdate({ metricsClearInterval: event.target.value as MetricsClearInterval })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200 cursor-pointer"
            >
              {METRICS_INTERVALS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-slate-900 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClearMetrics}
            className="w-full py-2 rounded-xl text-xs font-semibold text-error/90 hover:text-white bg-error/5 hover:bg-error/85 border border-error/25 hover:border-error/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Clear All Metrics Now
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2.5 pb-4">
        <button
          onClick={onDiscard}
          disabled={!isDirty}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
            "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.98]",
            "disabled:opacity-30 disabled:scale-100 disabled:hover:bg-white/5 disabled:hover:text-white/80 disabled:hover:border-white/10 disabled:cursor-not-allowed"
          )}
        >
          Discard
        </button>

        <button
          onClick={onSave}
          disabled={!isDirty}
          className={cn(
            "flex-[1.4] py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 cursor-pointer",
            "gradient-primary hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:scale-[1.01] active:scale-[0.99]",
            "disabled:opacity-30 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
          )}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

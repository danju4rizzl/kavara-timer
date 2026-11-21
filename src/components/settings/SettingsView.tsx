import type { TimerSettings } from "@/types/settings";
import type { MetricsClearInterval } from "@/types/settings";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
import { DurationCard } from "./DurationCard";
import { WorkIntervalStepper } from "./WorkIntervalStepper";
import { SoundSelector } from "./SoundSelector";
import { ThemePicker } from "./ThemePicker";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { ChevronRight, MessageSquarePlus } from "lucide-react";

interface SettingsViewProps {
  settings: TimerSettings;
  isDirty: boolean;
  onUpdate: (partial: Partial<TimerSettings>) => void;
  onSave: () => void;
  onDiscard: () => void;
  onClearMetrics: () => void;
  sendMessage: (message: PopupMessage) => void;
  registerMessageHandler: (handler: (message: BackgroundMessage) => void) => () => void;
  onOpenFeedback: () => void;
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
  registerMessageHandler,
  onOpenFeedback,
}: SettingsViewProps) {
  const version = typeof chrome !== "undefined" ? chrome.runtime?.getManifest?.().version : undefined;

  return (
    <div className="flex flex-col gap-5 py-3">
      <ThemePicker value={settings.colorTheme} onChange={(colorTheme) => onUpdate({ colorTheme })} />

      <DurationCard settings={settings} onUpdate={onUpdate} />

      <WorkIntervalStepper
        value={settings.longBreakInterval}
        onChange={(value) => onUpdate({ longBreakInterval: value })}
      />

      <WorkIntervalStepper
        heading="Daily Goal"
        label="Focus Sessions per Day"
        description="Hit it for bonus XP and the Goal Getter badge"
        min={1}
        max={16}
        value={settings.dailyGoal}
        onChange={(dailyGoal) => onUpdate({ dailyGoal })}
      />


      <SoundSelector
        settings={settings}
        onUpdate={onUpdate}
        sendMessage={sendMessage}
        registerMessageHandler={registerMessageHandler}
      />

      {/* Auto-start toggle */}
      <div className="glass-panel rounded-[22px] px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">Auto-start Next Phase</p>
            <p className="text-[10px] text-on-surface-muted/80">Automatically begin the next interval</p>
          </div>
          <Switch
            checked={settings.autoStartNextPhase}
            onChange={(autoStartNextPhase) => onUpdate({ autoStartNextPhase })}
            label="Auto-start next phase"
          />
        </div>
      </div>

      {/* Auto-detect categories toggle */}
      <div className="glass-panel rounded-[22px] px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">Auto-detect Categories</p>
            <p className="text-[10px] text-on-surface-muted/80">Tag new blocklist sites by category</p>
          </div>
          <Switch
            checked={settings.autoDetectCategories}
            onChange={(autoDetectCategories) => onUpdate({ autoDetectCategories })}
            label="Auto-detect categories"
          />
        </div>
      </div>

      {/* Metrics clear interval */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Metrics</h3>

        <div className="glass-panel rounded-[22px] px-5 py-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white font-semibold">Reset Focus Stats</p>
              <p className="text-[10px] text-on-surface-muted/80">How often focus time is reset</p>
            </div>
            <select
              value={settings.metricsClearInterval}
              onChange={(event) =>
                onUpdate({ metricsClearInterval: event.target.value as MetricsClearInterval })
              }
              className="px-2.5 py-1.5 rounded-lg glass-inset border border-white/10 text-xs text-white focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200 cursor-pointer"
            >
              {METRICS_INTERVALS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-white/[0.08] text-white">
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

      {import.meta.env.DEV && (
        <div className="glass-panel border-rose-500/15 bg-rose-500/5 rounded-[22px] px-5 py-4 space-y-2">
          <p className="text-xs text-rose-400 font-bold">Developer Options</p>
          <button
            onClick={() => sendMessage({ type: "DEV_RESET_STORAGE" })}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Reset Dev Storage & State
          </button>
        </div>
      )}

      {/* Support */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Support</h3>
        <button
          type="button"
          onClick={onOpenFeedback}
          className="liquid glass-panel flex w-full items-center gap-3 rounded-[22px] px-5 py-3.5 text-left hover:bg-white/5 cursor-pointer"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white font-semibold">Send Feedback</p>
            <p className="text-[10px] text-on-surface-muted/80">Report a bug or suggest a feature</p>
          </div>
          <ChevronRight className="h-4 w-4 text-on-surface-muted/60" />
        </button>
      </div>

      {version && (
        <p className="-mt-2 text-center text-[10px] text-on-surface-muted/50">FocusFlow v{version} · Built on the Pomodoro technique · Kavara Digital</p>
      )}

      {/* Action buttons — sticky so Save is always reachable on long settings pages */}
      <div className="glass-bar-dense sticky -bottom-4 z-10 -mx-5 -mb-4 px-5 pt-3 pb-4">
        {isDirty && (
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            You have unsaved changes
          </p>
        )}
        <div className="flex items-center gap-3">
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
            "gradient-primary hover:shadow-[0_4px_16px_color-mix(in_oklab,var(--accent-1)_30%,transparent)] hover:scale-[1.01] active:scale-[0.99]",
            "disabled:opacity-30 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
          )}
        >
          Save Changes
        </button>
        </div>
      </div>

    </div>
  );
}

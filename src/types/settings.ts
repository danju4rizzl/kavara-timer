export type MetricsClearInterval = "daily" | "weekly" | "monthly" | "manual";

export interface TimerSettings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  alarmVolume: number;
  autoStartNextPhase: boolean;
  autoDetectCategories: boolean;
  metricsClearInterval: MetricsClearInterval;
  customSoundDataUrl: string | null;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  alarmVolume: 75,
  autoStartNextPhase: true,
  autoDetectCategories: false,
  metricsClearInterval: "weekly",
  customSoundDataUrl: null,
};

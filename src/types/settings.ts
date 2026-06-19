export type MetricsClearInterval = "daily" | "weekly" | "monthly" | "manual";
export type AlarmSoundType = "default" | "local" | "url" | "youtube";

export interface TimerSettings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  alarmVolume: number;
  autoStartNextPhase: boolean;
  autoDetectCategories: boolean;
  metricsClearInterval: MetricsClearInterval;
  alarmSoundType: AlarmSoundType;
  customSoundDataUrl: string | null;
  externalAudioUrl: string;
  youtubeVideoId: string;
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
  alarmSoundType: "default",
  customSoundDataUrl: null,
  externalAudioUrl: "",
  youtubeVideoId: "",
};

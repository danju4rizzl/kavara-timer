export type MetricsClearInterval = "daily" | "weekly" | "monthly" | "manual";

/** Sound that loops in the background while the timer is running. */
export type FocusSoundType = "none" | "local" | "url" | "youtube";

export type SoundThemeId = "classic" | "zen" | "digital" | "marimba" | "crystal";

export type ColorThemeId = "default" | "raspberries" | "eko-ile" | "aurora" | "ember" | "graphite";

export interface TimerSettings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  /** Focus sessions per day that count as hitting the daily goal. */
  dailyGoal: number;
  autoStartNextPhase: boolean;
  autoDetectCategories: boolean;
  metricsClearInterval: MetricsClearInterval;
  /** App color theme (see src/lib/themes.ts). */
  colorTheme: ColorThemeId;

  /* ---- Chimes: short theme sounds for start / pause / stop ---- */
  soundTheme: SoundThemeId;
  chimeVolume: number;
  /**
   * Play the start chime on play and the pause/stop chimes on pause/reset.
   * The stop chime always plays when a session finishes (it's the alarm).
   */
  controlChimes: boolean;

  /* ---- Focus sound: loops while the timer is running ---- */
  focusSound: FocusSoundType;
  focusVolume: number;
  /** Keep the focus sound playing during short and long breaks too. */
  focusSoundDuringBreaks: boolean;
  customSoundDataUrl: string | null;
  externalAudioUrl: string;
  youtubeVideoId: string;
  youtubeStartSeconds: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoal: 4,
  autoStartNextPhase: true,
  autoDetectCategories: false,
  metricsClearInterval: "weekly",
  colorTheme: "default",
  soundTheme: "classic",
  chimeVolume: 75,
  controlChimes: true,
  focusSound: "none",
  focusVolume: 50,
  focusSoundDuringBreaks: true,
  customSoundDataUrl: null,
  externalAudioUrl: "",
  youtubeVideoId: "",
  youtubeStartSeconds: 0,
};

/** Previews of a focus sound in Settings stop after this long. */
export const FOCUS_PREVIEW_SECONDS = 30;

/** True when the selected focus sound has something to play. */
export function hasFocusSource(settings: TimerSettings): boolean {
  switch (settings.focusSound) {
    case "local":
      return Boolean(settings.customSoundDataUrl);
    case "url":
      return Boolean(settings.externalAudioUrl);
    case "youtube":
      return Boolean(settings.youtubeVideoId);
    default:
      return false;
  }
}

/**
 * Upgrades settings saved by older builds, where the custom sound was a
 * session-end alarm ("alarmSoundType") and one volume ("alarmVolume") covered everything.
 */
export function migrateSettings(stored: Record<string, unknown>): Partial<TimerSettings> {
  const s = { ...stored };
  if ("alarmVolume" in s && !("chimeVolume" in s)) s.chimeVolume = s.alarmVolume;
  if ("startStopSounds" in s && !("controlChimes" in s)) s.controlChimes = s.startStopSounds;
  if ("alarmSoundType" in s && !("focusSound" in s)) {
    s.focusSound = s.alarmSoundType === "default" ? "none" : s.alarmSoundType;
  }
  delete s.alarmVolume;
  delete s.startStopSounds;
  delete s.alarmSoundType;
  return s as Partial<TimerSettings>;
}

import type { TimerState } from "./timer";
import type { TimerSettings, AlarmSoundType } from "./settings";
import type { BlockedSite, FocusMetrics } from "./blocklist";

/* Popup → Background requests */
export type PopupMessage =
  | { type: "GET_STATE" }
  | { type: "START_TIMER" }
  | { type: "PAUSE_TIMER" }
  | { type: "RESET_TIMER" }
  | { type: "SKIP_PHASE" }
  | { type: "SET_PHASE"; phase: TimerState["phase"] }
  | { type: "UPDATE_SETTINGS"; settings: TimerSettings }
  | { type: "ADD_BLOCKED_SITES"; sites: BlockedSite[] }
  | { type: "REMOVE_BLOCKED_SITE"; siteId: string }
  | { type: "GET_SETTINGS" }
  | { type: "GET_BLOCKED_SITES" }
  | { type: "GET_FOCUS_METRICS" }
  | { type: "CLEAR_FOCUS_METRICS" }
  | {
      type: "PREVIEW_ALARM";
      volume: number;
      alarmSoundType: AlarmSoundType;
      customSoundDataUrl: string | null;
      externalAudioUrl: string;
      youtubeVideoId: string;
    }
  | { type: "STOP_ALARM" };

/* Background → Popup broadcasts */
export type BackgroundMessage =
  | { type: "STATE_UPDATE"; state: TimerState }
  | { type: "SETTINGS_UPDATE"; settings: TimerSettings }
  | { type: "BLOCKED_SITES_UPDATE"; sites: BlockedSite[] }
  | { type: "FOCUS_METRICS_UPDATE"; metrics: FocusMetrics };

/* Background → Offscreen messages */
export type OffscreenMessage =
  | {
      type: "PLAY_ALARM";
      volume: number;
      alarmSoundType: AlarmSoundType;
      customSoundDataUrl: string | null;
      externalAudioUrl: string;
      youtubeVideoId: string;
    }
  | { type: "STOP_ALARM" };

export const POPUP_PORT_NAME = "popup-port";

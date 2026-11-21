import type { TimerState } from "./timer";
import type { TimerSettings, FocusSoundType, SoundThemeId } from "./settings";
import type { BlockedSite, FocusMetrics } from "./blocklist";
import type { BadgeId, FocusStats } from "./stats";

/* ---------- Sounds ---------- */

/** Theme chimes: start = play pressed, pause = paused, stop = reset or session finished. */
export type SoundCue = "start" | "pause" | "stop";

export interface CueRequest {
  /** Unique id so the UI can match status updates to the sound it started. */
  playbackId: string;
  cue: SoundCue;
  theme: SoundThemeId;
  volume: number;
  preview: boolean;
}

/** Where a focus sound comes from. */
export interface FocusSource {
  kind: Exclude<FocusSoundType, "none">;
  customSoundDataUrl: string | null;
  externalAudioUrl: string;
  youtubeVideoId: string;
  youtubeStartSeconds: number;
}

/** A short, non-looping preview of a focus sound (Settings → Preview). */
export interface SourcePreviewRequest {
  playbackId: string;
  source: FocusSource;
  volume: number;
}

export interface SoundStatus {
  /** "cue" = chimes and previews; "background" = the looping focus sound. */
  channel: "cue" | "background";
  playbackId: string;
  preview: boolean;
  state: "playing" | "ended" | "error";
  message?: string;
  /** Sent with "playing": how long it should last, so the UI can recover if it never hears "ended". */
  expectedSeconds?: number;
}

/* ---------- Popup → Background ---------- */
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
  | { type: "TOGGLE_BLOCKED_SITE"; siteId: string; listType: "custom" | "socialMedia" }
  | { type: "DELETE_BLOCKED_SITE"; siteId: string; listType: "custom" | "socialMedia" }
  | { type: "TOGGLE_BLOCKLIST_ACTIVE"; listType: "custom" | "socialMedia"; isActive: boolean }
  | { type: "GET_SETTINGS" }
  | { type: "GET_BLOCKED_SITES" }
  | { type: "GET_FOCUS_METRICS" }
  | { type: "CLEAR_FOCUS_METRICS" }
  | { type: "GET_FOCUS_STATS" }
  | { type: "PREVIEW_CUE"; request: CueRequest }
  | { type: "PREVIEW_SOURCE"; request: SourcePreviewRequest }
  | { type: "STOP_PREVIEW" }
  | { type: "DEV_RESET_STORAGE" };

/* ---------- Background → Popup ---------- */
export type BackgroundMessage =
  | { type: "STATE_UPDATE"; state: TimerState }
  | { type: "SETTINGS_UPDATE"; settings: TimerSettings }
  | {
      type: "BLOCKED_SITES_UPDATE";
      customSites: BlockedSite[];
      customActive: boolean;
      socialMediaSites: BlockedSite[];
      socialMediaActive: boolean;
    }
  | { type: "FOCUS_METRICS_UPDATE"; metrics: FocusMetrics }
  | { type: "SOUND_STATUS"; status: SoundStatus }
  | { type: "FOCUS_STATS_UPDATE"; stats: FocusStats; event?: StatsEvent };

/** Something worth celebrating in the side panel. */
export type StatsEvent =
  | {
      kind: "session";
      counted: boolean;
      xpGained: number;
      goalReached: boolean;
      newBadges: BadgeId[];
      levelBefore: number;
      levelAfter: number;
    }
  | { kind: "blocked"; newBadges: BadgeId[] };

/* ---------- Background → Offscreen (chrome.runtime.sendMessage) ---------- */
export type OffscreenMessage =
  | { target: "offscreen"; type: "PLAY_CUE"; request: CueRequest }
  | { target: "offscreen"; type: "PREVIEW_SOURCE"; request: SourcePreviewRequest }
  | { target: "offscreen"; type: "STOP_CUE" }
  | { target: "offscreen"; type: "START_FOCUS_SOUND"; source: FocusSource; volume: number; delayMs: number }
  | { target: "offscreen"; type: "STOP_FOCUS_SOUND" }
  /** Diagnostics: replies with what the player is doing (used by tests and for debugging). */
  | { target: "offscreen"; type: "GET_PLAYER_STATE" };

export interface PlayerState {
  cue: { playbackId: string; preview: boolean } | null;
  focus: { key: string; paused?: boolean; time?: number; loop?: boolean; volume?: number } | null;
}

/* ---------- Offscreen → side panel ---------- */
export type OffscreenReport = { target: "background"; type: "SOUND_STATUS"; status: SoundStatus };

export const POPUP_PORT_NAME = "popup-port";

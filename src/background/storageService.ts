import type { TimerState } from "@/types/timer";
import type { TimerSettings } from "@/types/settings";
import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import { createInitialTimerState } from "@/types/timer";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { DEFAULT_FOCUS_METRICS } from "@/types/blocklist";

const STORAGE_KEYS = {
  TIMER_STATE: "timerState",
  SETTINGS: "settings",
  BLOCKED_SITES: "blockedSites",
  FOCUS_METRICS: "focusMetrics",
} as const;

export async function getTimerState(): Promise<TimerState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TIMER_STATE);
  return (result[STORAGE_KEYS.TIMER_STATE] as TimerState) ?? createInitialTimerState();
}

export async function saveTimerState(state: TimerState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TIMER_STATE]: state });
}

export async function getSettings(): Promise<TimerSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] as Partial<TimerSettings>) };
}

export async function saveSettings(settings: TimerSettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

export async function getBlockedSites(): Promise<BlockedSite[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES);
  return (result[STORAGE_KEYS.BLOCKED_SITES] as BlockedSite[]) ?? [];
}

export async function saveBlockedSites(sites: BlockedSite[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.BLOCKED_SITES]: sites });
}

export async function getFocusMetrics(): Promise<FocusMetrics> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FOCUS_METRICS);
  return { ...DEFAULT_FOCUS_METRICS, ...(result[STORAGE_KEYS.FOCUS_METRICS] as Partial<FocusMetrics>) };
}

export async function saveFocusMetrics(metrics: FocusMetrics): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS_METRICS]: metrics });
}

export async function clearFocusMetrics(): Promise<FocusMetrics> {
  const freshMetrics: FocusMetrics = {
    totalFocusSeconds: 0,
    blockedAttempts: 0,
    lastClearedAt: Date.now(),
  };
  await saveFocusMetrics(freshMetrics);
  return freshMetrics;
}

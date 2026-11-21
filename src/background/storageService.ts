import type { TimerState } from "@/types/timer";
import type { TimerSettings, MetricsClearInterval } from "@/types/settings";
import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import { createEmptyStats, type FocusStats } from "@/types/stats";
import { applyBlockedAttempt, applyFocusSession, clearHistory } from "@/lib/gamification";
import { createInitialTimerState } from "@/types/timer";
import { DEFAULT_SETTINGS, migrateSettings } from "@/types/settings";
import { isSoundThemeId } from "@/lib/soundThemes";
import type { ColorThemeId } from "@/types/settings";

// Kept here (not imported from lib/themes) so the service worker bundle stays tiny.
const COLOR_THEME_IDS: ColorThemeId[] = ["default", "raspberries", "eko-ile", "aurora", "ember", "graphite"];
import { DEFAULT_FOCUS_METRICS, DEFAULT_SOCIAL_MEDIA_SITES } from "@/types/blocklist";

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
  const syncResult = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const localResult = await chrome.storage.local.get("customSoundDataUrl");
  const settings: TimerSettings = {
    ...DEFAULT_SETTINGS,
    ...migrateSettings((syncResult[STORAGE_KEYS.SETTINGS] as Record<string, unknown>) ?? {}),
    customSoundDataUrl: (localResult.customSoundDataUrl as string | null) ?? null,
  };
  if (!isSoundThemeId(settings.soundTheme)) settings.soundTheme = DEFAULT_SETTINGS.soundTheme;
  if (!COLOR_THEME_IDS.includes(settings.colorTheme)) settings.colorTheme = DEFAULT_SETTINGS.colorTheme;
  return settings;
}

export async function saveSettings(settings: TimerSettings): Promise<void> {
  const { customSoundDataUrl, ...syncSettings } = settings;
  await Promise.all([
    chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: syncSettings }),
    chrome.storage.local.set({ customSoundDataUrl: customSoundDataUrl ?? null }),
  ]);
}

export async function getBlockedSites(): Promise<BlockedSite[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES);
  const sites = (result[STORAGE_KEYS.BLOCKED_SITES] as BlockedSite[]) ?? [];
  return sites.map((site) => ({
    ...site,
    id: site.id || site.domain || crypto.randomUUID(),
    isActive: site.isActive !== false,
  }));
}

export async function saveBlockedSites(sites: BlockedSite[]): Promise<void> {
  const sanitizedSites = sites.map((site) => ({
    ...site,
    id: site.id || site.domain || crypto.randomUUID(),
    isActive: site.isActive !== false,
  }));
  await chrome.storage.sync.set({ [STORAGE_KEYS.BLOCKED_SITES]: sanitizedSites });
}

export async function getCustomBlockListActive(): Promise<boolean> {
  const result = await chrome.storage.sync.get("customBlockListActive");
  return result.customBlockListActive !== false; // defaults to true
}

export async function saveCustomBlockListActive(active: boolean): Promise<void> {
  await chrome.storage.sync.set({ customBlockListActive: active });
}

export async function getSocialMediaBlockerActive(): Promise<boolean> {
  const result = await chrome.storage.sync.get("socialMediaBlockerActive");
  return result.socialMediaBlockerActive !== false; // defaults to true
}

export async function saveSocialMediaBlockerActive(active: boolean): Promise<void> {
  await chrome.storage.sync.set({ socialMediaBlockerActive: active });
}

export async function initializeSocialMediaSites(): Promise<void> {
  await chrome.storage.sync.set({ socialMediaBlockerSites: DEFAULT_SOCIAL_MEDIA_SITES });
}

export async function getSocialMediaBlockerSites(): Promise<BlockedSite[]> {
  return DEFAULT_SOCIAL_MEDIA_SITES;
}


export async function getFocusMetrics(): Promise<FocusMetrics> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FOCUS_METRICS);
  const metrics: FocusMetrics = {
    ...DEFAULT_FOCUS_METRICS,
    ...(result[STORAGE_KEYS.FOCUS_METRICS] as Partial<FocusMetrics>),
  };

  // Apply the "Clear Tracking" schedule from settings lazily, whenever metrics are read.
  const { metricsClearInterval } = await getSettings();
  if (isMetricsPeriodOver(metrics.lastClearedAt, metricsClearInterval)) {
    return clearFocusMetrics();
  }
  return metrics;
}

/** True when the current tracking period (since lastClearedAt) has ended. */
function isMetricsPeriodOver(lastClearedAt: number, interval: MetricsClearInterval): boolean {
  if (!lastClearedAt || interval === "manual") return false;
  const last = new Date(lastClearedAt);
  const now = new Date();

  switch (interval) {
    case "daily":
      return last.toDateString() !== now.toDateString();
    case "weekly": {
      // Weeks start on Monday.
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
      return last < startOfWeek;
    }
    case "monthly":
      return last.getFullYear() !== now.getFullYear() || last.getMonth() !== now.getMonth();
    default:
      return false;
  }
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

/* =========================================================================
 * Focus stats & gamification (history for the chart, XP, badges)
 * ========================================================================= */

const FOCUS_STATS_KEY = "focusStats";

// Serializes read-modify-write updates so a session and a blocked attempt landing together can't overwrite each other.
let statsQueue: Promise<unknown> = Promise.resolve();
function withStatsLock<T>(task: () => Promise<T>): Promise<T> {
  const run = statsQueue.then(task, task);
  statsQueue = run.catch(() => undefined);
  return run;
}

export async function getFocusStats(): Promise<FocusStats> {
  const result = await chrome.storage.local.get(FOCUS_STATS_KEY);
  const stored = result[FOCUS_STATS_KEY] as Partial<FocusStats> | undefined;
  const empty = createEmptyStats();
  return {
    days: stored?.days ?? empty.days,
    lifetime: { ...empty.lifetime, ...stored?.lifetime },
    badges: stored?.badges ?? empty.badges,
  };
}

async function saveFocusStats(stats: FocusStats): Promise<void> {
  await chrome.storage.local.set({ [FOCUS_STATS_KEY]: stats });
}

export function recordFocusSession(focusedSeconds: number, plannedSeconds: number, dailyGoal: number) {
  return withStatsLock(async () => {
    const { stats, outcome } = applyFocusSession(await getFocusStats(), focusedSeconds, plannedSeconds, dailyGoal);
    await saveFocusStats(stats);
    return { stats, outcome };
  });
}

export function recordBlockedAttempt(dailyGoal: number) {
  return withStatsLock(async () => {
    const { stats, newBadges } = applyBlockedAttempt(await getFocusStats(), dailyGoal);
    await saveFocusStats(stats);
    return { stats, newBadges };
  });
}

/** "Clear All Metrics Now": clears the chart history but keeps XP, level and badges. */
export function clearFocusHistory() {
  return withStatsLock(async () => {
    const stats = clearHistory(await getFocusStats());
    await saveFocusStats(stats);
    return stats;
  });
}

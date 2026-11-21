/**
 * Per-day focus history plus lifetime progress (XP, badges). Stored in
 * chrome.storage.local under "focusStats".
 *
 * "Reset Focus Stats" / "Clear All Metrics Now" clear the history and period
 * totals, but never XP, level or earned badges — rewards aren't taken back.
 */
export interface DayStats {
  /** Seconds actually spent in focus sessions that day (including partially completed ones). */
  focusSeconds: number;
  /** Focus sessions that counted (finished, or at least half done when skipped). */
  sessions: number;
  /** Times a blocked site was shown during focus. */
  blocked: number;
  /** XP earned that day from blocked distractions (capped per day). */
  blockXp: number;
  /** Whether the daily-goal bonus was already awarded that day. */
  goalBonus: boolean;
}

export type BadgeId =
  | "first-focus"
  | "goal-getter"
  | "on-fire"
  | "unstoppable"
  | "deep-diver"
  | "ten-hours"
  | "century"
  | "shield"
  | "early-bird"
  | "night-owl";

export interface FocusStats {
  /** Keyed by local date, "YYYY-MM-DD". Older than HISTORY_DAYS is pruned. */
  days: Record<string, DayStats>;
  lifetime: {
    focusSeconds: number;
    sessions: number;
    blocked: number;
    xp: number;
    bestStreak: number;
  };
  /** Badge → time it was earned (ms). */
  badges: Partial<Record<BadgeId, number>>;
}

export const HISTORY_DAYS = 120;

export const EMPTY_DAY: DayStats = { focusSeconds: 0, sessions: 0, blocked: 0, blockXp: 0, goalBonus: false };

export function createEmptyStats(): FocusStats {
  return {
    days: {},
    lifetime: { focusSeconds: 0, sessions: 0, blocked: 0, xp: 0, bestStreak: 0 },
    badges: {},
  };
}

/** Local-date key, e.g. "2026-11-21". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

import { EMPTY_DAY, HISTORY_DAYS, dayKey, type BadgeId, type DayStats, type FocusStats } from "@/types/stats";

/* =========================================================================
 * XP rules
 * ========================================================================= */

export const XP = {
  /** Flat reward for every focus session that counts. */
  perSession: 10,
  /** Plus one XP per focused minute. */
  perMinute: 1,
  /** Once per day, when the daily goal is reached. */
  dailyGoal: 25,
  /** Each blocked distraction… */
  perBlock: 2,
  /** …up to this many XP per day, so it can't be farmed. */
  blockDailyCap: 20,
} as const;

/** A skipped session counts if at least this share of it was done. */
export const SESSION_COUNT_THRESHOLD = 0.5;

/* =========================================================================
 * Levels
 * ========================================================================= */

const LEVEL_NAMES = [
  "Spark",
  "Kindle",
  "Flicker",
  "Flame",
  "Blaze",
  "Bonfire",
  "Beacon",
  "Lighthouse",
  "Comet",
  "Star",
  "Nova",
  "Supernova",
];

/** Total XP needed to reach `level` (level 1 = 0 XP). Gaps grow by 100 each level: 100, 200, 300… */
export function xpForLevel(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

export interface LevelInfo {
  level: number;
  name: string;
  /** XP earned inside the current level. */
  intoLevel: number;
  /** XP the current level spans. */
  levelSpan: number;
  /** 0–1 progress toward the next level. */
  progress: number;
  xpToNext: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const start = xpForLevel(level);
  const span = xpForLevel(level + 1) - start;
  const into = xp - start;
  return {
    level,
    name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] + (level > LEVEL_NAMES.length ? ` ${level - LEVEL_NAMES.length + 1}` : ""),
    intoLevel: into,
    levelSpan: span,
    progress: span ? into / span : 0,
    xpToNext: span - into,
  };
}

/* =========================================================================
 * Streaks
 * ========================================================================= */

/** Consecutive days with at least one counted session, ending today (or yesterday, if today has none yet). */
export function currentStreak(stats: FocusStats, now = new Date()): number {
  const cursor = new Date(now);
  const sessionsOn = (date: Date) => stats.days[dayKey(date)]?.sessions ?? 0;
  if (sessionsOn(cursor) === 0) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (sessionsOn(cursor) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function today(stats: FocusStats, now = new Date()): DayStats {
  return stats.days[dayKey(now)] ?? EMPTY_DAY;
}

/* =========================================================================
 * Badges
 * ========================================================================= */

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  /** lucide icon name, resolved in the UI */
  icon: "Sparkles" | "Target" | "Flame" | "Zap" | "Waves" | "Clock" | "Trophy" | "Shield" | "Sunrise" | "Moon";
  /** Progress toward the badge, for locked badges (current / goal). */
  progress?: (ctx: BadgeContext) => [number, number];
}

export interface BadgeContext {
  stats: FocusStats;
  streak: number;
  dailyGoal: number;
  bestDaySessions: number;
}

export const BADGES: BadgeDef[] = [
  { id: "first-focus", name: "First Focus", description: "Complete your first focus session", icon: "Sparkles", progress: (c) => [c.stats.lifetime.sessions, 1] },
  { id: "goal-getter", name: "Goal Getter", description: "Reach your daily focus goal", icon: "Target", progress: (c) => [c.bestDaySessions, c.dailyGoal] },
  { id: "on-fire", name: "On Fire", description: "Focus 3 days in a row", icon: "Flame", progress: (c) => [Math.max(c.streak, c.stats.lifetime.bestStreak), 3] },
  { id: "unstoppable", name: "Unstoppable", description: "Focus 7 days in a row", icon: "Zap", progress: (c) => [Math.max(c.streak, c.stats.lifetime.bestStreak), 7] },
  { id: "deep-diver", name: "Deep Diver", description: "Complete 6 sessions in one day", icon: "Waves", progress: (c) => [c.bestDaySessions, 6] },
  { id: "ten-hours", name: "10-Hour Club", description: "Focus for 10 hours in total", icon: "Clock", progress: (c) => [Math.floor(c.stats.lifetime.focusSeconds / 3600), 10] },
  { id: "century", name: "Century", description: "Complete 100 focus sessions", icon: "Trophy", progress: (c) => [c.stats.lifetime.sessions, 100] },
  { id: "shield", name: "Distraction Shield", description: "Block 25 distractions", icon: "Shield", progress: (c) => [c.stats.lifetime.blocked, 25] },
  { id: "early-bird", name: "Early Bird", description: "Finish a focus session before 8 AM", icon: "Sunrise" },
  { id: "night-owl", name: "Night Owl", description: "Finish a focus session after 10 PM", icon: "Moon" },
];

export function badgeContext(stats: FocusStats, dailyGoal: number, now = new Date()): BadgeContext {
  const bestDaySessions = Object.values(stats.days).reduce((max, d) => Math.max(max, d.sessions), 0);
  return { stats, streak: currentStreak(stats, now), dailyGoal, bestDaySessions };
}

/** Badges whose conditions are met now (excluding time-of-day ones, which are awarded at the moment they happen). */
export function earnedBadges(ctx: BadgeContext): BadgeId[] {
  const out: BadgeId[] = [];
  for (const badge of BADGES) {
    if (!badge.progress) continue;
    const [have, need] = badge.progress(ctx);
    if (need > 0 && have >= need) out.push(badge.id);
  }
  return out;
}

/* =========================================================================
 * Recording (pure: returns the new stats + what happened)
 * ========================================================================= */

export interface SessionOutcome {
  counted: boolean;
  xpGained: number;
  goalReached: boolean;
  newBadges: BadgeId[];
  levelBefore: number;
  levelAfter: number;
}

function pruneOldDays(stats: FocusStats, now: Date): void {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
  const cutoffKey = dayKey(cutoff);
  for (const key of Object.keys(stats.days)) if (key < cutoffKey) delete stats.days[key];
}
function awardBadges(stats: FocusStats, ids: BadgeId[], at: number): BadgeId[] {
  const fresh = ids.filter((id) => !stats.badges[id]);
  for (const id of fresh) stats.badges[id] = at;
  return fresh;
}

export function applyFocusSession(
  previous: FocusStats,
  focusedSeconds: number,
  plannedSeconds: number,
  dailyGoal: number,
  now = new Date()
): { stats: FocusStats; outcome: SessionOutcome } {
  const stats: FocusStats = structuredClone(previous);
  const key = dayKey(now);
  const day: DayStats = { ...EMPTY_DAY, ...stats.days[key] };
  const levelBefore = levelFromXp(stats.lifetime.xp).level;

  const seconds = Math.max(0, Math.round(focusedSeconds));
  const counted = plannedSeconds > 0 && seconds >= plannedSeconds * SESSION_COUNT_THRESHOLD;

  day.focusSeconds += seconds;
  stats.lifetime.focusSeconds += seconds;

  let xp = Math.floor(seconds / 60) * XP.perMinute;
  let goalReached = false;
  if (counted) {
    day.sessions += 1;
    stats.lifetime.sessions += 1;
    xp += XP.perSession;
    if (!day.goalBonus && day.sessions >= dailyGoal) {
      day.goalBonus = true;
      goalReached = true;
      xp += XP.dailyGoal;
    }
  }
  stats.lifetime.xp += xp;
  stats.days[key] = day;

  const streak = currentStreak(stats, now);
  stats.lifetime.bestStreak = Math.max(stats.lifetime.bestStreak, streak);

  const ids = earnedBadges(badgeContext(stats, dailyGoal, now));
  if (counted && now.getHours() < 8) ids.push("early-bird");
  if (counted && now.getHours() >= 22) ids.push("night-owl");
  const newBadges = awardBadges(stats, ids, now.getTime());

  pruneOldDays(stats, now);
  return {
    stats,
    outcome: { counted, xpGained: xp, goalReached, newBadges, levelBefore, levelAfter: levelFromXp(stats.lifetime.xp).level },
  };
}

export function applyBlockedAttempt(previous: FocusStats, dailyGoal: number, now = new Date()): { stats: FocusStats; newBadges: BadgeId[] } {
  const stats: FocusStats = structuredClone(previous);
  const key = dayKey(now);
  const day: DayStats = { ...EMPTY_DAY, ...stats.days[key] };
  day.blocked += 1;
  stats.lifetime.blocked += 1;
  const xp = Math.min(XP.perBlock, Math.max(0, XP.blockDailyCap - day.blockXp));
  day.blockXp += xp;
  stats.lifetime.xp += xp;
  stats.days[key] = day;
  const newBadges = awardBadges(stats, earnedBadges(badgeContext(stats, dailyGoal, now)), now.getTime());
  return { stats, newBadges };
}

/** Clears history (the chart) but keeps XP, best streak and badges. */
export function clearHistory(previous: FocusStats): FocusStats {
  return { ...structuredClone(previous), days: {} };
}

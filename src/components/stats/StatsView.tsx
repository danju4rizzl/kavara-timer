import { useState } from "react";
import { Flame, Lock, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FocusStats } from "@/types/stats";
import { BADGES, badgeContext, currentStreak, levelFromXp, today, XP } from "@/lib/gamification";
import { FocusChart, formatMinutes } from "./FocusChart";
import { BadgeIcon } from "./BadgeIcon";

interface StatsViewProps {
  stats: FocusStats;
  dailyGoal: number;
  focusMinutes: number;
}

/** Progress ring: accent fill on a lighter track of the same color. */
function Ring({ value, size = 76, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklab, var(--chart-bar) 22%, transparent)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--chart-bar)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-spring)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function StatsView({ stats, dailyGoal, focusMinutes }: StatsViewProps) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const level = levelFromXp(stats.lifetime.xp);
  const day = today(stats);
  const streak = currentStreak(stats);
  const ctx = badgeContext(stats, dailyGoal);
  const goalProgress = dailyGoal ? day.sessions / dailyGoal : 0;
  const earnedCount = Object.keys(stats.badges).length;
  const selected = BADGES.find((b) => b.id === selectedBadge) ?? null;

  const goalMessage =
    day.sessions === 0
      ? "Start a focus session to begin today's streak."
      : day.sessions >= dailyGoal
        ? "Daily goal smashed. Everything now is a bonus!"
        : `${dailyGoal - day.sessions} more session${dailyGoal - day.sessions === 1 ? "" : "s"} to hit your goal (+${XP.dailyGoal} XP).`;

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* ---------- Level ---------- */}
      <div className="glass-panel overflow-hidden rounded-[24px] p-4">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl" style={{ background: "var(--accent-2)" }} />
        <div className="relative flex items-center gap-3.5">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] gradient-primary"
            aria-hidden
          >
            <span className="absolute inset-x-1.5 top-1 h-1/2 rounded-[14px] bg-gradient-to-b from-white/40 to-transparent" />
            <span className="relative text-xl font-extrabold">{level.level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Level {level.level}</p>
            <p className="truncate text-base font-bold text-white">{level.name}</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={level.levelSpan} aria-valuenow={level.intoLevel} aria-label="XP to next level">
              <div
                className="relative h-full overflow-hidden rounded-full"
                style={{
                  width: `${Math.max(4, level.progress * 100)}%`,
                  background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
                  transition: "width 900ms var(--ease-spring)",
                }}
              >
                <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" style={{ animation: "shine-sweep 2.8s ease-in-out infinite" }} />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-on-surface-muted/80">
              {stats.lifetime.xp.toLocaleString()} XP · {level.xpToNext.toLocaleString()} XP to level {level.level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Today ---------- */}
      <div className="glass-panel rounded-[22px] p-4">
        <div className="flex items-center gap-4">
          <Ring value={goalProgress}>
            <span className="text-lg font-bold leading-none text-white">
              {day.sessions}
              <span className="text-xs font-semibold text-white/50">/{dailyGoal}</span>
            </span>
            <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white/50">Goal</span>
          </Ring>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Today</p>
            <p className="text-[44px] font-bold leading-[1.05] tracking-tight text-white">{formatMinutes(Math.round(day.focusSeconds / 60))}</p>
            <p className="text-[10.5px] leading-snug text-on-surface-muted">{goalMessage}</p>
          </div>
        </div>
      </div>

      {/* ---------- Streak + blocked ---------- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-[22px] p-3.5">
          <div className="flex items-center gap-2">
            <Flame className={cn("h-5 w-5", streak > 0 ? "text-orange-400 motion-safe:animate-pulse" : "text-white/30")} fill={streak > 0 ? "currentColor" : "none"} />
            <span className="text-2xl font-bold text-white">{streak}</span>
            <span className="text-[10px] text-white/55">day{streak === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-1 text-[10.5px] font-semibold text-white/85">Focus streak</p>
          <p className="text-[9.5px] text-on-surface-muted/75">Best: {Math.max(stats.lifetime.bestStreak, streak)} days</p>
        </div>
        <div className="glass-panel rounded-[22px] p-3.5">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-white">{day.blocked}</span>
            <span className="text-[10px] text-white/55">today</span>
          </div>
          <p className="mt-1 text-[10.5px] font-semibold text-white/85">Distractions blocked</p>
          <p className="text-[9.5px] text-on-surface-muted/75">{stats.lifetime.blocked} all time</p>
        </div>
      </div>

      {/* ---------- Chart ---------- */}
      <FocusChart stats={stats} goalMinutes={dailyGoal * focusMinutes} />

      {/* ---------- Badges ---------- */}
      <div className="glass-panel rounded-[22px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white">Badges</h3>
            <p className="text-[10px] text-on-surface-muted/80">Tap a badge to see how to earn it</p>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/80">
            <Trophy className="h-3 w-3 text-amber-300" /> {earnedCount}/{BADGES.length}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {BADGES.map((badge) => {
            const earned = Boolean(stats.badges[badge.id]);
            const [have, need] = badge.progress?.(ctx) ?? [0, 1];
            const isSelected = selectedBadge === badge.id;
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(isSelected ? null : badge.id)}
                aria-pressed={isSelected}
                aria-label={`${badge.name}: ${earned ? "earned" : "locked"}`}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-[16px] border cursor-pointer",
                  earned
                    ? "border-white/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_14px_-6px_color-mix(in_oklab,var(--accent-1)_70%,transparent)]"
                    : "glass-inset",
                  isSelected && "ring-2 ring-white/50"
                )}
                style={earned ? { background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))" } : undefined}
              >
                {earned && <span className="absolute inset-x-1 top-0.5 h-1/2 rounded-[12px] bg-gradient-to-b from-white/35 to-transparent" />}
                <BadgeIcon icon={badge.icon} className={cn("relative h-5 w-5", earned ? "text-on-accent" : "text-white/25")} />
                {!earned && (
                  <>
                    <Lock className="absolute bottom-1 right-1 h-2.5 w-2.5 text-white/35" />
                    {badge.progress && need > 1 && (
                      <span className="absolute inset-x-1.5 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full bg-[var(--chart-bar)]" style={{ width: `${Math.min(100, (have / need) * 100)}%` }} />
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div key={selected.id} className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 animate-pop-in">
            <BadgeIcon icon={selected.icon} className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{selected.name}</p>
              <p className="text-[10.5px] text-on-surface-muted">
                {selected.description}
                {stats.badges[selected.id]
                  ? ` · Earned ${new Date(stats.badges[selected.id]!).toLocaleDateString()}`
                  : selected.progress
                    ? ` · ${Math.min(...selected.progress(ctx))}/${selected.progress(ctx)[1]}`
                    : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Lifetime ---------- */}
      <div className="grid grid-cols-3 gap-2 pb-2">
        {[
          { label: "Focus time", value: formatMinutes(Math.round(stats.lifetime.focusSeconds / 60)) },
          { label: "Sessions", value: stats.lifetime.sessions.toLocaleString() },
          { label: "Badges", value: `${earnedCount}` },
        ].map((tile) => (
          <div key={tile.label} className="glass-panel rounded-[18px] px-2 py-3 text-center">
            <p className="text-sm font-bold text-white">{tile.value}</p>
            <p className="text-[9.5px] text-on-surface-muted/75">{tile.label} · all time</p>
          </div>
        ))}
      </div>

      <p className="pb-2 text-center text-[9.5px] leading-relaxed text-on-surface-muted/60">
        +{XP.perSession} XP per focus session, +{XP.perMinute} per minute, +{XP.dailyGoal} for your daily goal, +{XP.perBlock} per blocked
        distraction (up to {XP.blockDailyCap}/day).
      </p>
    </div>
  );
}

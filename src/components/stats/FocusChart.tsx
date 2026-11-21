import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { dayKey, type FocusStats } from "@/types/stats";

type Range = "week" | "month";

interface FocusChartProps {
  stats: FocusStats;
  /** Daily goal expressed in minutes (goal sessions × focus duration). */
  goalMinutes: number;
}

interface Point {
  key: string;
  date: Date;
  minutes: number;
  sessions: number;
  isToday: boolean;
}

const HEIGHT = 150;
const PAD = { top: 20, right: 8, bottom: 22, left: 42 };
const MAX_BAR = 24;

export function formatMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function niceMax(value: number): number {
  if (value <= 30) return 30;
  if (value <= 60) return 60;
  const step = value <= 180 ? 30 : 60;
  return Math.ceil(value / step) * step;
}

/** Rounded 4px data-end at the top, square at the baseline. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/**
 * Focus minutes per day. One series, so one color (the theme accent) and no
 * legend; today is emphasized, other days are the same hue at lower weight.
 * Hover/tap/focus a day for details; "Table" shows the same data as a list.
 */
export function FocusChart({ stats, goalMinutes }: FocusChartProps) {
  const [range, setRange] = useState<Range>("week");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.max(240, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  const points: Point[] = useMemo(() => {
    const count = range === "week" ? 7 : 30;
    const todayKey = dayKey();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - (count - 1 - i));
      const key = dayKey(date);
      const day = stats.days[key];
      return {
        key,
        date,
        minutes: Math.round((day?.focusSeconds ?? 0) / 60),
        sessions: day?.sessions ?? 0,
        isToday: key === todayKey,
      };
    });
  }, [stats, range]);

  const total = points.reduce((sum, p) => sum + p.minutes, 0);
  const activeDays = points.filter((p) => p.minutes > 0).length;
  const best = points.reduce<Point | null>((b, p) => (p.minutes > (b?.minutes ?? 0) ? p : b), null);
  const yMax = niceMax(Math.max(goalMinutes, ...points.map((p) => p.minutes)) * 1.08);
  const ticks = [0, yMax / 2, yMax];

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const barW = Math.max(3, Math.min(MAX_BAR, slot - 2, range === "week" ? slot * 0.55 : slot - 2));
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
  const goalY = y(Math.min(goalMinutes, yMax));

  const weekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });
  const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const showXLabel = (i: number, p: Point) =>
    range === "week" || p.isToday || (i % 7 === 0 && points.length - 1 - i > 3);

  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="glass-panel rounded-[22px] p-4">
      {/* Header: title + controls in one row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-white">Focus time</h3>
          <p className="text-[10px] text-on-surface-muted/80">Minutes focused per day</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div role="tablist" aria-label="Range" className="glass-inset relative grid grid-cols-2 rounded-full p-0.5">
            <span
              aria-hidden
              className="absolute bottom-0.5 left-0.5 top-0.5 rounded-full bg-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
              style={{
                width: "calc(50% - 0.125rem)",
                transform: `translateX(${range === "week" ? 0 : 100}%)`,
                transition: "transform 450ms var(--ease-spring)",
              }}
            />
            {(["week", "month"] as Range[]).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => {
                  setRange(r);
                  setActive(null);
                }}
                className={cn(
                  "relative z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold cursor-pointer",
                  range === r ? "text-white" : "text-white/55 hover:text-white"
                )}
              >
                {r === "week" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setView(view === "chart" ? "table" : "chart")}
            className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-white cursor-pointer"
            aria-pressed={view === "table"}
          >
            {view === "chart" ? "Table" : "Chart"}
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(null)}>
          <svg width={width} height={HEIGHT} role="img" aria-label={`Focus minutes per day, last ${points.length} days`}>
            {/* Hairline grid + y ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.08)" strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-white/45 text-[9px] tabular-nums">
                  {t === 0 ? "0" : formatMinutes(t)}
                </text>
              </g>
            ))}

            {/* Bars */}
            {points.map((p, i) => {
              const h = (p.minutes / yMax) * innerH;
              const x = PAD.left + i * slot + (slot - barW) / 2;
              const emphasized = p.isToday || active === i;
              return (
                <g key={p.key}>
                  {p.minutes > 0 && (
                    <path
                      d={barPath(x, y(p.minutes), barW, Math.max(h, 2))}
                      style={{
                        fill: "var(--chart-bar)",
                        opacity: emphasized ? 1 : 0.5,
                        transformOrigin: `0 ${PAD.top + innerH}px`,
                        animation: `bar-grow 700ms var(--ease-spring) ${i * (range === "week" ? 45 : 12)}ms both`,
                        transition: "opacity 200ms ease",
                      }}
                    />
                  )}
                  {p.minutes === 0 && (
                    <rect x={x} y={PAD.top + innerH - 2} width={barW} height={2} rx={1} fill="rgb(255 255 255 / 0.12)" />
                  )}
                  {/* Selective direct label: today's value at its tip */}
                  {p.isToday && p.minutes > 0 && range === "week" && active === null && (
                    <text x={x + barW / 2} y={y(p.minutes) - 5} textAnchor="middle" className="fill-white text-[9.5px] font-semibold">
                      {formatMinutes(p.minutes)}
                    </text>
                  )}
                  {showXLabel(i, p) && (
                    <text
                      x={PAD.left + i * slot + slot / 2}
                      y={HEIGHT - 6}
                      textAnchor="middle"
                      className={cn("text-[9px]", p.isToday ? "fill-white font-semibold" : "fill-white/45")}
                    >
                      {p.isToday ? "Today" : range === "week" ? weekday(p.date) : p.date.getDate()}
                    </text>
                  )}
                  {/* Hit target: the whole column, bigger than the mark */}
                  <rect
                    x={PAD.left + i * slot}
                    y={PAD.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${longDate(p.date)}: ${formatMinutes(p.minutes)}, ${p.sessions} sessions`}
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="cursor-pointer outline-none"
                  />
                </g>
              );
            })}

            {/* Daily goal threshold */}
            {goalMinutes > 0 && (
              <g pointerEvents="none">
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={goalY}
                  y2={goalY}
                  stroke="rgb(255 255 255 / 0.45)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                {/* Label sits on its own pill at the left edge so it never collides with bars */}
                <rect
                  x={PAD.left + 2}
                  y={goalY - 15}
                  width={`Goal ${formatMinutes(goalMinutes)}`.length * 5.2 + 10}
                  height={13}
                  rx={6.5}
                  fill="rgb(10 12 24 / 0.75)"
                  stroke="rgb(255 255 255 / 0.15)"
                  strokeWidth={0.5}
                />
                <text x={PAD.left + 7} y={goalY - 5.5} className="fill-white/80 text-[9px] font-medium">
                  Goal {formatMinutes(goalMinutes)}
                </text>
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {activePoint && active !== null && (
            <div
              className="glass-popover pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl px-2.5 py-1.5 text-center animate-fade-in"
              style={{
                left: Math.min(Math.max(PAD.left + active * slot + slot / 2, 60), width - 60),
                top: Math.max(0, y(activePoint.minutes) - 50),
              }}
            >
              <p className="whitespace-nowrap text-[10px] text-white/70">{longDate(activePoint.date)}</p>
              <p className="whitespace-nowrap text-[11px] font-semibold text-white">
                {formatMinutes(activePoint.minutes)} · {activePoint.sessions} session{activePoint.sessions === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-[170px] overflow-y-auto rounded-xl">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1 font-medium">Day</th>
                <th className="py-1 text-right font-medium">Focus</th>
                <th className="py-1 text-right font-medium">Sessions</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...points].reverse().map((p) => (
                <tr key={p.key} className="border-t border-white/5 text-white/85">
                  <td className="py-1">{p.isToday ? "Today" : longDate(p.date)}</td>
                  <td className="py-1 text-right">{formatMinutes(p.minutes)}</td>
                  <td className="py-1 text-right">{p.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
        <div>
          <p className="text-[13px] font-semibold text-white">{formatMinutes(total)}</p>
          <p className="text-[9.5px] text-on-surface-muted/75">Total</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">{formatMinutes(activeDays ? Math.round(total / activeDays) : 0)}</p>
          <p className="text-[9.5px] text-on-surface-muted/75">Avg / active day</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">{best ? (best.isToday ? "Today" : weekday(best.date)) : "—"}</p>
          <p className="text-[9.5px] text-on-surface-muted/75">Best day</p>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import type { TimerState } from "@/types/timer";
import { PHASE_LABELS } from "@/types/timer";

interface TimerDialProps {
  timerState: TimerState;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerDial({ timerState }: TimerDialProps) {
  const { remainingSeconds, totalSeconds, phase, status } = timerState;

  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0;
    return 1 - remainingSeconds / totalSeconds;
  }, [remainingSeconds, totalSeconds]);

  const formattedTime = formatTime(remainingSeconds);
  const phaseLabel = PHASE_LABELS[phase];

  const radius = 110;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      {/* Background glow */}
      <div className="absolute w-[240px] h-[240px] rounded-full bg-gradient-to-tr from-primary/10 to-secondary/10 blur-3xl pointer-events-none -z-10 animate-pulse duration-[6000ms]" />

      <div className="relative flex items-center justify-center">
        {/* Liquid glass disc with a specular rim */}
        <div className="glass-panel absolute -z-10 h-[238px] w-[238px] rounded-full">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(120%_80%_at_50%_0%,rgb(255_255_255/0.16),transparent_55%)]" />
        </div>

        <svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          className="timer-glow relative z-10"
        >
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "var(--accent-1)" }} />
              <stop offset="55%" style={{ stopColor: "var(--accent-3)" }} />
              <stop offset="100%" style={{ stopColor: "var(--accent-2)" }} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="url(#progress-gradient)"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius} ${radius})`}
            className="transition-[stroke-dashoffset] duration-700 [transition-timing-function:var(--ease-fluid)]"
          />

          {/* Inner dark circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius - 14}
            fill="rgba(0, 0, 0, 0.2)"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth={1}
          />

          {/* Time text */}
          <text
            x={radius}
            y={radius - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white"
            style={{
              fontSize: "44px",
              fontWeight: 800,
              fontFamily: "Inter, sans-serif",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
              filter: "drop-shadow(0 2px 8px rgba(255,255,255,0.15))",
            }}
          >
            {formattedTime}
          </text>

          {/* Phase label */}
          <text
            x={radius}
            y={radius + 28}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-on-surface-muted"
            style={{
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            {phaseLabel}
          </text>
        </svg>

        {/* Pulse animation when running */}
        {status === "running" && (
          <div className="pointer-events-none absolute h-[252px] w-[252px] rounded-full border border-primary/30 opacity-70 motion-safe:animate-pulse" />
        )}
      </div>
    </div>
  );
}

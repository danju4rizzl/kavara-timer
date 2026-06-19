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
        {/* Soft glass plate replacing the square card box */}
        <div className="absolute w-[234px] h-[234px] rounded-full bg-[#0b1326]/30 backdrop-blur-sm border border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] -z-10" />

        <svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          className="timer-glow relative z-10"
        >
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
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
            className="transition-[stroke-dashoffset] duration-500 ease-linear"
          />

          {/* Inner dark circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius - 14}
            fill="rgba(6, 12, 24, 0.5)"
            stroke="rgba(255, 255, 255, 0.03)"
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
          <div className="absolute w-[220px] h-[220px] rounded-full border border-primary/20 animate-ping opacity-20 pointer-events-none duration-1000" />
        )}
      </div>
    </div>
  );
}

export type TimerPhase = "pomodoro" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  completedPomodoros: number;
}

export const PHASE_LABELS: Record<TimerPhase, string> = {
  pomodoro: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export const DEFAULT_DURATIONS: Record<TimerPhase, number> = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

export function createInitialTimerState(): TimerState {
  return {
    phase: "pomodoro",
    status: "idle",
    remainingSeconds: DEFAULT_DURATIONS.pomodoro * 60,
    totalSeconds: DEFAULT_DURATIONS.pomodoro * 60,
    completedPomodoros: 0,
  };
}

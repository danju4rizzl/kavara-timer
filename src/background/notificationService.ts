import type { TimerPhase } from "@/types/timer";
import { PHASE_LABELS } from "@/types/timer";

const NOTIFICATION_ID = "focusflow-phase-complete";

const PHASE_MESSAGES: Record<TimerPhase, { title: string; body: string }> = {
  pomodoro: {
    title: "Focus Session Complete! 🎉",
    body: "Great work! Time for a well-deserved break.",
  },
  shortBreak: {
    title: "Break's Over! 💪",
    body: "Ready to focus? Your next Pomodoro is starting.",
  },
  longBreak: {
    title: "Long Break Complete! 🚀",
    body: "Feeling refreshed? Let's get back to work!",
  },
};

export function showPhaseCompleteNotification(completedPhase: TimerPhase): void {
  const message = PHASE_MESSAGES[completedPhase];

  chrome.notifications.create(NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: message.title,
    message: `${PHASE_LABELS[completedPhase]} finished. ${message.body}`,
    priority: 2,
    silent: true,
  });
}

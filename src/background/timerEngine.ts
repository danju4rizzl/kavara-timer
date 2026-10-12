import type { TimerState, TimerPhase } from "@/types/timer";
import type { TimerSettings } from "@/types/settings";
import type { BackgroundMessage } from "@/types/messages";
import { createInitialTimerState } from "@/types/timer";
import { enableBlocking, disableBlocking } from "./blockingEngine";
import { showPhaseCompleteNotification } from "./notificationService";
import { playAlarm, stopAlarm } from "./offscreenManager";
import {
  getTimerState,
  saveTimerState,
  getSettings,
  getFocusMetrics,
  saveFocusMetrics,
  getBlockedSites,
  getCustomBlockListActive,
  getSocialMediaBlockerActive,
  getSocialMediaBlockerSites,
} from "./storageService";

const ALARM_NAME = "focusflow-tick";
const TICK_INTERVAL_SECONDS = 1;

let currentState: TimerState = createInitialTimerState();
let cachedSettings: TimerSettings | null = null;
let connectedPorts: chrome.runtime.Port[] = [];

export function registerPort(port: chrome.runtime.Port): void {
  connectedPorts.push(port);
  port.postMessage({ type: "STATE_UPDATE", state: currentState });

  port.onDisconnect.addListener(() => {
    connectedPorts = connectedPorts.filter((p) => p !== port);
  });
}

export function broadcastMessage(message: BackgroundMessage): void {
  for (const port of connectedPorts) {
    try {
      port.postMessage(message);
    } catch {
      // Port may be closed or disconnected
    }
  }
}

function broadcastState(): void {
  broadcastMessage({ type: "STATE_UPDATE", state: currentState });
}

async function loadSettings(): Promise<TimerSettings> {
  if (!cachedSettings) {
    cachedSettings = await getSettings();
  }
  return cachedSettings;
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
}

function getDurationForPhase(phase: TimerPhase, settings: TimerSettings): number {
  const durationMap: Record<TimerPhase, number> = {
    pomodoro: settings.pomodoroDuration,
    shortBreak: settings.shortBreakDuration,
    longBreak: settings.longBreakDuration,
  };
  return durationMap[phase] * 60;
}

function determineNextPhase(state: TimerState, settings: TimerSettings): TimerPhase {
  if (state.phase === "pomodoro") {
    return state.completedPomodoros % settings.longBreakInterval === 0 ? "longBreak" : "shortBreak";
  }
  return "pomodoro";
}

async function handlePhaseComplete(): Promise<void> {
  const settings = await loadSettings();
  const wasPomodoro = currentState.phase === "pomodoro";
  const wasLongBreak = currentState.phase === "longBreak";

  if (wasPomodoro) {
    currentState.completedPomodoros += 1;

    const metrics = await getFocusMetrics();
    metrics.totalFocusSeconds += currentState.totalSeconds;
    await saveFocusMetrics(metrics);
  }

  showPhaseCompleteNotification(currentState.phase);
  playAlarm(
    settings.alarmVolume,
    settings.alarmSoundType,
    settings.customSoundDataUrl,
    settings.externalAudioUrl,
    settings.youtubeVideoId
  );

  const nextPhase = determineNextPhase(currentState, settings);
  const totalSeconds = getDurationForPhase(nextPhase, settings);

  currentState.phase = nextPhase;
  currentState.totalSeconds = totalSeconds;
  currentState.remainingSeconds = totalSeconds;

  if (wasLongBreak) {
    // End of cycle - pause the timer and wait for user prompt
    currentState.status = "idle";
    await disableBlocking();
    await chrome.alarms.clear(ALARM_NAME);
  } else {
    // Within the cycle - auto start the next phase immediately
    currentState.status = "running";
    await enforceBlockingForPhase(nextPhase);
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
  }

  await saveTimerState(currentState);
  broadcastState();
}

export async function enforceBlockingForPhase(phase: TimerPhase): Promise<void> {
  if (phase === "pomodoro") {
    const domains: string[] = [];

    // Custom blocked list
    const customActive = await getCustomBlockListActive();
    if (customActive) {
      const customSites = await getBlockedSites();
      domains.push(...customSites.filter((s) => s.isActive !== false).map((s) => s.domain));
    }

    // Social media blocker list
    const smActive = await getSocialMediaBlockerActive();
    if (smActive) {
      const smSites = await getSocialMediaBlockerSites();
      domains.push(...smSites.filter((s) => s.isActive !== false).map((s) => s.domain));
    }

    await enableBlocking(domains);
  } else {
    await disableBlocking();
  }
}

let initializationPromise: Promise<void> | null = null;

export function initialize(force = false): Promise<void> {
  if (force) {
    initializationPromise = null;
  }
  if (!initializationPromise) {
    initializationPromise = (async () => {
      currentState = await getTimerState();

      if (currentState.status === "running") {
        await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
        await enforceBlockingForPhase(currentState.phase);
      }

      broadcastState();
    })();
  }
  return initializationPromise;
}

export async function startTimer(): Promise<void> {
  await initialize();
  if (currentState.status === "running") return;

  currentState.status = "running";
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
  await enforceBlockingForPhase(currentState.phase);
  await saveTimerState(currentState);
  broadcastState();
}

export async function pauseTimer(): Promise<void> {
  await initialize();
  if (currentState.status !== "running") return;

  currentState.status = "paused";
  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();
}

export async function resetTimer(): Promise<void> {
  await initialize();
  const settings = await loadSettings();
  const totalSeconds = getDurationForPhase(currentState.phase, settings);

  currentState.status = "idle";
  currentState.remainingSeconds = totalSeconds;
  currentState.totalSeconds = totalSeconds;

  await chrome.alarms.clear(ALARM_NAME);
  await stopAlarm();
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();
}

export async function skipPhase(): Promise<void> {
  await initialize();
  await chrome.alarms.clear(ALARM_NAME);
  await handlePhaseComplete();
}

export async function setPhase(phase: TimerPhase): Promise<void> {
  await initialize();
  if (currentState.status === "running") {
    await chrome.alarms.clear(ALARM_NAME);
    await disableBlocking();
  }

  const settings = await loadSettings();
  const totalSeconds = getDurationForPhase(phase, settings);

  currentState.phase = phase;
  currentState.status = "idle";
  currentState.remainingSeconds = totalSeconds;
  currentState.totalSeconds = totalSeconds;

  await saveTimerState(currentState);
  broadcastState();
}

export async function handleAlarmTick(): Promise<void> {
  await initialize();
  if (currentState.status !== "running") return;

  currentState.remainingSeconds = Math.max(0, currentState.remainingSeconds - TICK_INTERVAL_SECONDS);

  if (currentState.remainingSeconds <= 0) {
    await chrome.alarms.clear(ALARM_NAME);
    await handlePhaseComplete();
    return;
  }

  await saveTimerState(currentState);
  broadcastState();
}

export function getCurrentState(): TimerState {
  return { ...currentState };
}

export async function handleSettingsUpdate(settings: TimerSettings): Promise<void> {
  invalidateSettingsCache();
  if (currentState.status === "idle") {
    const totalSeconds = getDurationForPhase(currentState.phase, settings);
    currentState.totalSeconds = totalSeconds;
    currentState.remainingSeconds = totalSeconds;
    await saveTimerState(currentState);
    broadcastState();
  }
}

import type { TimerState, TimerPhase } from "@/types/timer";
import type { TimerSettings } from "@/types/settings";
import { createInitialTimerState } from "@/types/timer";
import { getTimerState, saveTimerState, getSettings, getFocusMetrics, saveFocusMetrics } from "./storageService";
import { enableBlocking, disableBlocking } from "./blockingEngine";
import { showPhaseCompleteNotification } from "./notificationService";
import { playAlarm } from "./offscreenManager";
import { getBlockedSites } from "./storageService";

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

function broadcastState(): void {
  const message = { type: "STATE_UPDATE", state: currentState };
  for (const port of connectedPorts) {
    port.postMessage(message);
  }
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
    const completedCount = state.completedPomodoros + 1;
    return completedCount % settings.longBreakInterval === 0 ? "longBreak" : "shortBreak";
  }
  return "pomodoro";
}

async function handlePhaseComplete(): Promise<void> {
  const settings = await loadSettings();
  const wasPomodoro = currentState.phase === "pomodoro";

  if (wasPomodoro) {
    currentState.completedPomodoros += 1;

    const metrics = await getFocusMetrics();
    metrics.totalFocusSeconds += currentState.totalSeconds;
    await saveFocusMetrics(metrics);
  }

  showPhaseCompleteNotification(currentState.phase);
  playAlarm(settings.alarmVolume, settings.customSoundDataUrl);

  const nextPhase = determineNextPhase(currentState, settings);
  const totalSeconds = getDurationForPhase(nextPhase, settings);

  currentState.phase = nextPhase;
  currentState.totalSeconds = totalSeconds;
  currentState.remainingSeconds = totalSeconds;

  if (settings.autoStartNextPhase) {
    currentState.status = "running";
    await enforceBlockingForPhase(nextPhase);
  } else {
    currentState.status = "idle";
    await disableBlocking();
    await chrome.alarms.clear(ALARM_NAME);
  }

  await saveTimerState(currentState);
  broadcastState();
}

async function enforceBlockingForPhase(phase: TimerPhase): Promise<void> {
  if (phase === "pomodoro") {
    const sites = await getBlockedSites();
    const domains = sites.map((site) => site.domain);
    await enableBlocking(domains);
  } else {
    await disableBlocking();
  }
}

export async function initialize(): Promise<void> {
  currentState = await getTimerState();

  if (currentState.status === "running") {
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
    await enforceBlockingForPhase(currentState.phase);
  }

  broadcastState();
}

export async function startTimer(): Promise<void> {
  if (currentState.status === "running") return;

  currentState.status = "running";
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
  await enforceBlockingForPhase(currentState.phase);
  await saveTimerState(currentState);
  broadcastState();
}

export async function pauseTimer(): Promise<void> {
  if (currentState.status !== "running") return;

  currentState.status = "paused";
  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();
}

export async function resetTimer(): Promise<void> {
  const settings = await loadSettings();
  const totalSeconds = getDurationForPhase(currentState.phase, settings);

  currentState.status = "idle";
  currentState.remainingSeconds = totalSeconds;
  currentState.totalSeconds = totalSeconds;

  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();
}

export async function skipPhase(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME);
  await handlePhaseComplete();
}

export async function setPhase(phase: TimerPhase): Promise<void> {
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

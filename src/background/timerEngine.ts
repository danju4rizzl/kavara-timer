import type { TimerState, TimerPhase } from "@/types/timer";
import type { TimerSettings } from "@/types/settings";
import type { BackgroundMessage } from "@/types/messages";
import { createInitialTimerState } from "@/types/timer";
import { enableBlocking, disableBlocking } from "./blockingEngine";
import { showPhaseCompleteNotification } from "./notificationService";
import {
  playCue,
  stopCue,
  startFocusSound,
  stopFocusSound,
  cueFromSettings,
  focusSourceFromSettings,
  focusSourceKey,
  hasOffscreenDocument,
} from "./offscreenManager";
import type { SoundCue } from "@/types/messages";
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
  recordFocusSession,
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

/** Plays a control chime (start / pause / stop) if the user has them switched on. */
async function playControlChime(cue: SoundCue): Promise<void> {
  const settings = await loadSettings();
  if (settings.controlChimes) void playCue(cueFromSettings(settings, cue));
}

/** Delay before the focus sound starts, so it doesn't talk over a chime. */
const FOCUS_AFTER_START_CHIME_MS = 600;
const FOCUS_AFTER_STOP_CHIME_MS = 2500;

/**
 * Makes the looping focus sound match the timer: playing while the timer runs
 * (and, if the user wants, during breaks), silent otherwise. Safe to call
 * repeatedly — the player keeps going if the source hasn't changed.
 */
/** Source that failed to play; not retried until the user presses play again or changes settings. */
let failedFocusKey: string | null = null;

export function markFocusSoundFailed(key: string): void {
  failedFocusKey = key;
}

async function wantedFocusSource() {
  const settings = await loadSettings();
  const source = focusSourceFromSettings(settings);
  const phaseAllowed = currentState.phase === "pomodoro" || settings.focusSoundDuringBreaks;
  const wanted = source && currentState.status === "running" && phaseAllowed && focusSourceKey(source) !== failedFocusKey;
  return { settings, source: wanted ? source : null };
}

async function syncFocusSound(delayMs = 0): Promise<void> {
  const { settings, source } = await wantedFocusSource();
  if (source) {
    await startFocusSound(source, settings.focusVolume, delayMs);
  } else {
    await stopFocusSound();
  }
}

/**
 * Self-heal: Chrome can close the offscreen document (e.g. after a stretch it
 * considers silent). Checked every few ticks while the timer runs.
 */
let ticksSinceFocusCheck = 0;
async function ensureFocusSoundAlive(): Promise<void> {
  if (++ticksSinceFocusCheck < 5) return;
  ticksSinceFocusCheck = 0;
  const { source } = await wantedFocusSource();
  if (source && !(await hasOffscreenDocument())) await syncFocusSound();
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

    // Count the time actually focused: a skipped session only gets what was done
    // (and only counts as a session — with its XP — if at least half was done).
    const focusedSeconds = Math.max(0, currentState.totalSeconds - currentState.remainingSeconds);
    const metrics = await getFocusMetrics();
    metrics.totalFocusSeconds += focusedSeconds;
    await saveFocusMetrics(metrics);
    broadcastMessage({ type: "FOCUS_METRICS_UPDATE", metrics });

    const { stats, outcome } = await recordFocusSession(focusedSeconds, currentState.totalSeconds, settings.dailyGoal);
    broadcastMessage({ type: "FOCUS_STATS_UPDATE", stats, event: { kind: "session", ...outcome } });
  }

  showPhaseCompleteNotification(currentState.phase);
  // The stop chime is the "session finished" alarm, so it plays even if control chimes are off.
  void playCue(cueFromSettings(settings, "stop"));

  const nextPhase = determineNextPhase(currentState, settings);
  const totalSeconds = getDurationForPhase(nextPhase, settings);

  currentState.phase = nextPhase;
  currentState.totalSeconds = totalSeconds;
  currentState.remainingSeconds = totalSeconds;

  if (wasLongBreak || !settings.autoStartNextPhase) {
    // End of cycle, or the user turned off auto-start: wait for them to press play.
    currentState.status = "idle";
    await disableBlocking();
    await chrome.alarms.clear(ALARM_NAME);
  } else {
    // Within the cycle and auto-start is on: begin the next phase immediately
    currentState.status = "running";
    await enforceBlockingForPhase(nextPhase);
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
  }

  await saveTimerState(currentState);
  broadcastState();
  // Keeps playing into the next phase if allowed; stops if the timer is now idle or it's a break without music.
  await syncFocusSound(FOCUS_AFTER_STOP_CHIME_MS);
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
        // The worker restarted mid-session: make sure the focus sound is still playing.
        await syncFocusSound();
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
  failedFocusKey = null; // pressing play retries a focus sound that failed earlier
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_INTERVAL_SECONDS / 60 });
  await enforceBlockingForPhase(currentState.phase);
  await saveTimerState(currentState);
  broadcastState();
  await playControlChime("start");
  await syncFocusSound(FOCUS_AFTER_START_CHIME_MS);
}

export async function pauseTimer(): Promise<void> {
  await initialize();
  if (currentState.status !== "running") return;

  currentState.status = "paused";
  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();
  await syncFocusSound();
  await playControlChime("pause");
}

export async function resetTimer(): Promise<void> {
  await initialize();
  const settings = await loadSettings();
  const totalSeconds = getDurationForPhase(currentState.phase, settings);
  const wasActive = currentState.status !== "idle";

  currentState.status = "idle";
  currentState.remainingSeconds = totalSeconds;
  currentState.totalSeconds = totalSeconds;

  await chrome.alarms.clear(ALARM_NAME);
  await disableBlocking();
  await saveTimerState(currentState);
  broadcastState();

  await syncFocusSound();
  // Stopping a running/paused session plays the stop chime (which also cuts off
  // a ringing "session finished" chime); resetting an idle timer just silences it.
  if (wasActive && settings.controlChimes) {
    await playControlChime("stop");
  } else {
    await stopCue();
  }
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
    await playControlChime("stop");
  }

  const settings = await loadSettings();
  const totalSeconds = getDurationForPhase(phase, settings);

  currentState.phase = phase;
  currentState.status = "idle";
  currentState.remainingSeconds = totalSeconds;
  currentState.totalSeconds = totalSeconds;

  await saveTimerState(currentState);
  broadcastState();
  await syncFocusSound();
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
  await ensureFocusSoundAlive();
}

export function getCurrentState(): TimerState {
  return { ...currentState };
}

export async function handleSettingsUpdate(settings: TimerSettings): Promise<void> {
  invalidateSettingsCache();
  failedFocusKey = null;
  // Apply a new focus sound / volume / breaks preference straight away.
  await syncFocusSound();
  if (currentState.status === "idle") {
    const totalSeconds = getDurationForPhase(currentState.phase, settings);
    currentState.totalSeconds = totalSeconds;
    currentState.remainingSeconds = totalSeconds;
    await saveTimerState(currentState);
    broadcastState();
  }
}

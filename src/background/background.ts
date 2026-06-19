import { POPUP_PORT_NAME } from "@/types/messages";
import type { PopupMessage } from "@/types/messages";
import {
  initialize,
  registerPort,
  startTimer,
  pauseTimer,
  resetTimer,
  skipPhase,
  setPhase,
  handleAlarmTick,
  getCurrentState,
  invalidateSettingsCache,
} from "./timerEngine";
import {
  getSettings,
  saveSettings,
  getBlockedSites,
  saveBlockedSites,
  getFocusMetrics,
  clearFocusMetrics,
} from "./storageService";

import { playAlarm, stopAlarm } from "./offscreenManager";

const ALARM_NAME = "focusflow-tick";

chrome.runtime.onInstalled.addListener(async () => {
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  await initialize();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await handleAlarmTick();
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== POPUP_PORT_NAME) return;

  registerPort(port);

  port.onMessage.addListener(async (message: PopupMessage) => {
    switch (message.type) {
      case "GET_STATE":
        port.postMessage({ type: "STATE_UPDATE", state: getCurrentState() });
        break;

      case "START_TIMER":
        await startTimer();
        break;

      case "PAUSE_TIMER":
        await pauseTimer();
        break;

      case "RESET_TIMER":
        await resetTimer();
        break;

      case "SKIP_PHASE":
        await skipPhase();
        break;

      case "SET_PHASE":
        await setPhase(message.phase);
        break;

      case "UPDATE_SETTINGS":
        await saveSettings(message.settings);
        invalidateSettingsCache();
        port.postMessage({ type: "SETTINGS_UPDATE", settings: message.settings });
        break;

      case "GET_SETTINGS": {
        const settings = await getSettings();
        port.postMessage({ type: "SETTINGS_UPDATE", settings });
        break;
      }

      case "PREVIEW_ALARM":
        await playAlarm(
          message.volume,
          message.alarmSoundType,
          message.customSoundDataUrl,
          message.externalAudioUrl,
          message.youtubeVideoId
        );
        break;

      case "STOP_ALARM":
        await stopAlarm();
        break;

      case "ADD_BLOCKED_SITES": {
        const existingSites = await getBlockedSites();
        const updatedSites = [...existingSites, ...message.sites];
        await saveBlockedSites(updatedSites);
        port.postMessage({ type: "BLOCKED_SITES_UPDATE", sites: updatedSites });
        break;
      }

      case "REMOVE_BLOCKED_SITE": {
        const sites = await getBlockedSites();
        const filteredSites = sites.filter((site) => site.id !== message.siteId);
        await saveBlockedSites(filteredSites);
        port.postMessage({ type: "BLOCKED_SITES_UPDATE", sites: filteredSites });
        break;
      }

      case "GET_BLOCKED_SITES": {
        const blockedSites = await getBlockedSites();
        port.postMessage({ type: "BLOCKED_SITES_UPDATE", sites: blockedSites });
        break;
      }

      case "GET_FOCUS_METRICS": {
        const metrics = await getFocusMetrics();
        port.postMessage({ type: "FOCUS_METRICS_UPDATE", metrics });
        break;
      }

      case "CLEAR_FOCUS_METRICS": {
        const freshMetrics = await clearFocusMetrics();
        port.postMessage({ type: "FOCUS_METRICS_UPDATE", metrics: freshMetrics });
        break;
      }
    }
  });
});

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
  enforceBlockingForPhase,
} from "./timerEngine";
import { DEFAULT_SOCIAL_MEDIA_SITES, BlockedSite } from "@/types/blocklist";
import {
  getSettings,
  saveSettings,
  getBlockedSites,
  saveBlockedSites,
  getFocusMetrics,
  clearFocusMetrics,
  getCustomBlockListActive,
  saveCustomBlockListActive,
  getSocialMediaBlockerActive,
  saveSocialMediaBlockerActive,
  getSocialMediaBlockerSites,
  initializeSocialMediaSites,
} from "./storageService";

import { playAlarm, stopAlarm } from "./offscreenManager";

const ALARM_NAME = "focusflow-tick";

chrome.runtime.onInstalled.addListener(async () => {
  await initializeSocialMediaSites();
  await initialize();

  // Configure side panel to open on action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error("Error setting panel behavior:", error));
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeSocialMediaSites();
  await initialize();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await handleAlarmTick();
  }
});

async function sendBlockedSitesUpdate(port: chrome.runtime.Port) {
  port.postMessage({
    type: "BLOCKED_SITES_UPDATE",
    customSites: await getBlockedSites(),
    customActive: await getCustomBlockListActive(),
    socialMediaSites: await getSocialMediaBlockerSites(),
    socialMediaActive: await getSocialMediaBlockerActive(),
  });
}

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
        const newCustomSites: BlockedSite[] = [];

        for (const site of message.sites) {
          const normalizedInput = site.domain.toLowerCase().replace(/^www\./, "");
          const defaultSM = DEFAULT_SOCIAL_MEDIA_SITES.find(
            (s) => s.domain.toLowerCase().replace(/^www\./, "") === normalizedInput
          );

          if (!defaultSM) {
            // It's a custom site. Add it if it doesn't already exist.
            if (!existingSites.some((s) => s.domain.toLowerCase().replace(/^www\./, "") === normalizedInput)) {
              newCustomSites.push(site);
            }
          }
        }

        if (newCustomSites.length > 0) {
          await saveBlockedSites([...existingSites, ...newCustomSites]);
        }

        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "REMOVE_BLOCKED_SITE": {
        const sites = await getBlockedSites();
        const filteredSites = sites.filter((site) => site.id !== message.siteId);
        await saveBlockedSites(filteredSites);
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "TOGGLE_BLOCKED_SITE": {
        if (message.listType === "custom") {
          const sites = await getBlockedSites();
          const updated = sites.map((s) => (s.id === message.siteId ? { ...s, isActive: !s.isActive } : s));
          await saveBlockedSites(updated);
        }
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "DELETE_BLOCKED_SITE": {
        if (message.listType === "custom") {
          const sites = await getBlockedSites();
          const updated = sites.filter((s) => s.id !== message.siteId);
          await saveBlockedSites(updated);
        }
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "TOGGLE_BLOCKLIST_ACTIVE": {
        if (message.listType === "custom") {
          await saveCustomBlockListActive(message.isActive);
        } else {
          await saveSocialMediaBlockerActive(message.isActive);
        }
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "GET_BLOCKED_SITES": {
        await sendBlockedSitesUpdate(port);
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

      case "DEV_RESET_STORAGE": {
        await Promise.all([
          chrome.storage.local.clear(),
          chrome.storage.sync.clear()
        ]);
        await initializeSocialMediaSites();
        await initialize();
        port.postMessage({ type: "STATE_UPDATE", state: getCurrentState() });
        port.postMessage({ type: "SETTINGS_UPDATE", settings: await getSettings() });
        await sendBlockedSitesUpdate(port);
        break;
      }
    }
  });
});

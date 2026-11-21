import { POPUP_PORT_NAME } from "@/types/messages";
import type { PopupMessage } from "@/types/messages";
import {
  initialize,
  registerPort,
  broadcastMessage,
  startTimer,
  pauseTimer,
  resetTimer,
  skipPhase,
  setPhase,
  handleAlarmTick,
  getCurrentState,
  handleSettingsUpdate,
  enforceBlockingForPhase,
  markFocusSoundFailed,
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
  getFocusStats,
  recordBlockedAttempt,
  saveFocusMetrics,
  clearFocusHistory,
} from "./storageService";

import { playCue, previewSource, stopCue, onSoundStatus } from "./offscreenManager";
import type { OffscreenReport } from "@/types/messages";

const ALARM_NAME = "focusflow-tick";

// Always start initialization when background script loads (waking up or starting up)
initialize().catch((error) => console.error("Error during initialization:", error));

/**
 * Chrome/Edge don't run content scripts in tabs that were already open when the
 * extension is installed, updated or reloaded, so the blocker would silently
 * not work on those tabs until they were refreshed. Inject it now. The script
 * guards against running twice (see content.ts).
 */
async function injectIntoOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  await Promise.all(
    tabs.map((tab) =>
      tab.id === undefined || tab.discarded
        ? undefined
        : chrome.scripting
            .executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
            .catch(() => {
              /* store pages and other protected tabs can't be scripted */
            })
    )
  );
}

chrome.runtime.onInstalled.addListener(async () => {
  await initializeSocialMediaSites();
  await initialize();
  await injectIntoOpenTabs();

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
    await initialize();
    await handleAlarmTick();
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === "focusflow-phase-complete" && buttonIndex === 0) {
    await initialize();
    await startTimer();
  }
});

async function sendBlockedSitesUpdate(port?: chrome.runtime.Port) {
  const update = {
    type: "BLOCKED_SITES_UPDATE" as const,
    customSites: await getBlockedSites(),
    customActive: await getCustomBlockListActive(),
    socialMediaSites: await getSocialMediaBlockerSites(),
    socialMediaActive: await getSocialMediaBlockerActive(),
  };

  if (port) {
    try {
      port.postMessage(update);
    } catch {
      // Port may have disconnected
    }
  }

  broadcastMessage(update);
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== POPUP_PORT_NAME) return;

  registerPort(port);

  port.onMessage.addListener(async (message: PopupMessage) => {
    await initialize();
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
        await handleSettingsUpdate(message.settings);
        port.postMessage({ type: "SETTINGS_UPDATE", settings: message.settings });
        break;

      case "GET_SETTINGS": {
        const settings = await getSettings();
        port.postMessage({ type: "SETTINGS_UPDATE", settings });
        break;
      }

      case "PREVIEW_CUE":
        await playCue({ ...message.request, preview: true });
        break;

      case "PREVIEW_SOURCE":
        await previewSource(message.request);
        break;

      case "STOP_PREVIEW":
        await stopCue();
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
        const filteredSites = sites.filter((site) => site.id !== message.siteId && site.domain !== message.siteId);
        await saveBlockedSites(filteredSites);
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "TOGGLE_BLOCKED_SITE": {
        if (message.listType === "custom") {
          const sites = await getBlockedSites();
          const updated = sites.map((s) => {
            if (s.id === message.siteId || s.domain === message.siteId) {
              const currentActive = s.isActive !== false;
              return { ...s, isActive: !currentActive };
            }
            return s;
          });
          await saveBlockedSites(updated);
        }
        await enforceBlockingForPhase(getCurrentState().phase);
        await sendBlockedSitesUpdate(port);
        break;
      }

      case "DELETE_BLOCKED_SITE": {
        if (message.listType === "custom") {
          const sites = await getBlockedSites();
          const updated = sites.filter((s) => s.id !== message.siteId && s.domain !== message.siteId);
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
        const stats = await clearFocusHistory();
        broadcastMessage({ type: "FOCUS_METRICS_UPDATE", metrics: freshMetrics });
        broadcastMessage({ type: "FOCUS_STATS_UPDATE", stats });
        break;
      }

      case "GET_FOCUS_STATS": {
        port.postMessage({ type: "FOCUS_STATS_UPDATE", stats: await getFocusStats() });
        break;
      }

      case "DEV_RESET_STORAGE": {
        await Promise.all([
          chrome.storage.local.clear(),
          chrome.storage.sync.clear()
        ]);
        await initializeSocialMediaSites();
        await initialize(true);
        port.postMessage({ type: "STATE_UPDATE", state: getCurrentState() });
        port.postMessage({ type: "SETTINGS_UPDATE", settings: await getSettings() });
        await sendBlockedSitesUpdate(port);
        break;
      }
    }
  });
});

// Errors raised before the offscreen document exists are reported straight to the side panel.
onSoundStatus(broadcastMessage);

// Listen to messages from content scripts and other parts of the extension
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  // Sound status from the offscreen player is shown by the side panel directly;
  // here we only remember a failed focus sound so the self-heal doesn't retry it every few seconds.
  const report = message as OffscreenReport | undefined;
  if (report?.target === "background") {
    if (report.status.channel === "background" && report.status.state === "error") {
      markFocusSoundFailed(report.status.playbackId);
    }
    return;
  }

  // Content script: a blocked site was shown during focus → count it (stats, XP, badges).
  if ((message as { type?: string } | undefined)?.type === "BLOCKED_ATTEMPT") {
    (async () => {
      const settings = await getSettings();
      const { stats, newBadges } = await recordBlockedAttempt(settings.dailyGoal);
      const metrics = await getFocusMetrics();
      metrics.blockedAttempts += 1;
      await saveFocusMetrics(metrics);
      broadcastMessage({ type: "FOCUS_METRICS_UPDATE", metrics });
      broadcastMessage({ type: "FOCUS_STATS_UPDATE", stats, event: { kind: "blocked", newBadges } });
    })().catch((error) => console.warn("Could not record blocked attempt:", error));
    return;
  }

  if (
    message &&
    typeof message === "object" &&
    "type" in message &&
    (message as { type: string }).type === "STOP_TIMER"
  ) {
    resetTimer()
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error("Failed to stop timer:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});


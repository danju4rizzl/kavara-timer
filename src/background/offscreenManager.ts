import type {
  CueRequest,
  FocusSource,
  OffscreenMessage,
  SoundCue,
  SoundStatus,
  SourcePreviewRequest,
  BackgroundMessage,
} from "@/types/messages";
import { hasFocusSource, type TimerSettings } from "@/types/settings";
export { focusSourceKey } from "@/lib/focusSourceKey";

/**
 * Owns the offscreen document that plays every FocusFlow sound
 * (service workers can't play audio).
 */

let creatingOffscreenDocument: Promise<void> | null = null;
let statusListener: ((message: BackgroundMessage) => void) | null = null;

/** Lets background.ts relay errors raised here (before the player exists) to the side panel. */
export function onSoundStatus(listener: (message: BackgroundMessage) => void): void {
  statusListener = listener;
}

function emitStatus(status: SoundStatus): void {
  statusListener?.({ type: "SOUND_STATUS", status });
}

export async function hasOffscreenDocument(): Promise<boolean> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  return contexts.length > 0;
}

async function ensureOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) return;

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: "Play timer chimes and the focus sound that loops while the timer runs",
      })
      .finally(() => {
        creatingOffscreenDocument = null;
      });
  }
  await creatingOffscreenDocument;
}

/* ---------- YouTube referrer fix ----------
 * Chrome sends no Referer header for iframes inside extension pages, and
 * YouTube rejects embeds without one ("Error 153"). This session rule sets
 * one, but only for YouTube embed frames requested by this extension.
 */
const YT_REFERER_RULE_ID = 1001;
const YT_EMBED_REFERER = "https://kavaradigital.com/";
let youTubeRuleReady: Promise<void> | null = null;

function ensureYouTubeRefererRule(): Promise<void> {
  if (!youTubeRuleReady) {
    youTubeRuleReady = chrome.declarativeNetRequest
      .updateSessionRules({
        removeRuleIds: [YT_REFERER_RULE_ID],
        addRules: [
          {
            id: YT_REFERER_RULE_ID,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders: [
                {
                  header: "referer",
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: YT_EMBED_REFERER,
                },
              ],
            },
            condition: {
              requestDomains: ["youtube-nocookie.com", "youtube.com"],
              initiatorDomains: [chrome.runtime.id],
              resourceTypes: [chrome.declarativeNetRequest.ResourceType.SUB_FRAME],
            },
          },
        ],
      })
      .catch((error) => {
        youTubeRuleReady = null;
        console.warn("Could not install YouTube referrer rule:", error);
      });
  }
  return youTubeRuleReady;
}

/** Sends to the offscreen player, creating it first. Retries once if Chrome just closed it. */
async function deliver(message: OffscreenMessage): Promise<void> {
  await ensureOffscreenDocument();
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // Chrome may have just closed the idle document (~30s after audio stops),
    // or it may still be loading its script.
    await new Promise((resolve) => setTimeout(resolve, 150));
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage(message);
  }
}

/** Sends only if the player exists — used for "stop" messages, which must never create it. */
async function deliverIfOpen(message: OffscreenMessage): Promise<void> {
  if (!(await hasOffscreenDocument())) return;
  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn("Offscreen player unreachable:", error);
  }
}

function failed(channel: SoundStatus["channel"], playbackId: string, preview: boolean, error: unknown) {
  console.warn("Sound player error:", error);
  emitStatus({ channel, playbackId, preview, state: "error", message: "The sound player couldn't start." });
}

/* ---------- Chimes & previews ---------- */

export async function playCue(request: CueRequest): Promise<void> {
  try {
    await deliver({ target: "offscreen", type: "PLAY_CUE", request });
  } catch (error) {
    failed("cue", request.playbackId, request.preview, error);
  }
}

export async function previewSource(request: SourcePreviewRequest): Promise<void> {
  try {
    if (request.source.kind === "youtube") await ensureYouTubeRefererRule();
    await deliver({ target: "offscreen", type: "PREVIEW_SOURCE", request });
  } catch (error) {
    failed("cue", request.playbackId, true, error);
  }
}

export async function stopCue(): Promise<void> {
  await deliverIfOpen({ target: "offscreen", type: "STOP_CUE" });
}

/* ---------- Focus sound (loops while the timer runs) ---------- */

export async function startFocusSound(source: FocusSource, volume: number, delayMs = 0): Promise<void> {
  try {
    if (source.kind === "youtube") await ensureYouTubeRefererRule();
    await deliver({ target: "offscreen", type: "START_FOCUS_SOUND", source, volume, delayMs });
  } catch (error) {
    failed("background", "focus", false, error);
  }
}

export async function stopFocusSound(): Promise<void> {
  await deliverIfOpen({ target: "offscreen", type: "STOP_FOCUS_SOUND" });
}

/* ---------- Builders from saved settings ---------- */

export function cueFromSettings(settings: TimerSettings, cue: SoundCue): CueRequest {
  return {
    playbackId: crypto.randomUUID(),
    cue,
    theme: settings.soundTheme,
    volume: settings.chimeVolume,
    preview: false,
  };
}

export function focusSourceFromSettings(settings: TimerSettings): FocusSource | null {
  if (settings.focusSound === "none" || !hasFocusSource(settings)) return null;
  return {
    kind: settings.focusSound,
    customSoundDataUrl: settings.customSoundDataUrl,
    externalAudioUrl: settings.externalAudioUrl,
    youtubeVideoId: settings.youtubeVideoId,
    youtubeStartSeconds: settings.youtubeStartSeconds,
  };
}

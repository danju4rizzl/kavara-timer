import type { OffscreenMessage } from "@/types/messages";
import type { TimerSettings } from "@/types/settings";

let isCreatingOffscreenDocument = false;

async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) return;

  if (isCreatingOffscreenDocument) return;

  isCreatingOffscreenDocument = true;

  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: "Play alarm sound when timer phase completes",
    });
  } finally {
    isCreatingOffscreenDocument = false;
  }
}

export async function playAlarm(
  volume: number,
  alarmSoundType: TimerSettings["alarmSoundType"],
  customSoundDataUrl: string | null,
  externalAudioUrl: string,
  youtubeVideoId: string
): Promise<void> {
  await ensureOffscreenDocument();

  const message: OffscreenMessage = {
    type: "PLAY_ALARM",
    volume,
    alarmSoundType,
    customSoundDataUrl,
    externalAudioUrl,
    youtubeVideoId,
  };

  await chrome.runtime.sendMessage(message);
}

export async function stopAlarm(): Promise<void> {
  const message: OffscreenMessage = { type: "STOP_ALARM" };
  await chrome.runtime.sendMessage(message);
}

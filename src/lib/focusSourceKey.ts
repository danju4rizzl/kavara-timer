import type { FocusSource } from "@/types/messages";

/** Stable id for a focus source. The offscreen player reports it in status updates. */
export function focusSourceKey(source: FocusSource): string {
  switch (source.kind) {
    case "local":
      return `local:${source.customSoundDataUrl?.length}:${source.customSoundDataUrl?.slice(-64)}`;
    case "url":
      return `url:${source.externalAudioUrl}`;
    case "youtube":
      return `yt:${source.youtubeVideoId}:${source.youtubeStartSeconds}`;
  }
}

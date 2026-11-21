import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BackgroundMessage,
  CueRequest,
  PopupMessage,
  SourcePreviewRequest,
} from "@/types/messages";
import { FOCUS_PREVIEW_SECONDS } from "@/types/settings";

export interface PreviewNotice {
  key: string;
  text: string;
}

type Active = { key: string; playbackId: string; deadlineMs: number };

/**
 * Tracks which preview button is playing. A button resets when the offscreen
 * player reports that *its* playback ended or failed, so it never stays stuck
 * on "Stop" after the sound finishes. A watchdog covers lost messages.
 */
export function useSoundPreview(
  sendMessage: (message: PopupMessage) => void,
  registerMessageHandler: (handler: (message: BackgroundMessage) => void) => () => void
) {
  const [active, setActive] = useState<Active | null>(null);
  const [notice, setNotice] = useState<PreviewNotice | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(
    () =>
      registerMessageHandler((message) => {
        if (message.type !== "SOUND_STATUS") return;
        const { status } = message;
        if (status.channel !== "cue" || !status.preview) return;
        const current = activeRef.current;
        if (!current || current.playbackId !== status.playbackId) return;

        if (status.state === "error" && status.message) setNotice({ key: current.key, text: status.message });
        if (status.state !== "playing") {
          setActive(null);
        } else {
          const seconds = status.expectedSeconds ?? FOCUS_PREVIEW_SECONDS;
          setActive({ ...current, deadlineMs: (seconds + 3) * 1000 });
        }
      }),
    [registerMessageHandler]
  );

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(null), active.deadlineMs);
    return () => clearTimeout(timer);
  }, [active]);

  // Leaving Settings stops a preview — but never the real focus sound or a timer chime.
  useEffect(
    () => () => {
      if (activeRef.current) sendMessage({ type: "STOP_PREVIEW" });
    },
    [sendMessage]
  );

  const stop = useCallback(() => {
    if (!activeRef.current) return;
    sendMessage({ type: "STOP_PREVIEW" });
    setActive(null);
  }, [sendMessage]);

  const begin = useCallback(
    (key: string, startupMs: number, send: (playbackId: string) => void) => {
      if (activeRef.current?.key === key) {
        stop();
        return;
      }
      const playbackId = crypto.randomUUID();
      setNotice(null);
      setActive({ key, playbackId, deadlineMs: startupMs });
      send(playbackId);
    },
    [stop]
  );

  const toggleCue = useCallback(
    (key: string, input: Omit<CueRequest, "playbackId" | "preview">) =>
      begin(key, 5000, (playbackId) =>
        sendMessage({ type: "PREVIEW_CUE", request: { ...input, playbackId, preview: true } })
      ),
    [begin, sendMessage]
  );

  const toggleSource = useCallback(
    (key: string, input: Omit<SourcePreviewRequest, "playbackId">) =>
      // YouTube can take a while to buffer; files and URLs start almost instantly.
      begin(key, input.source.kind === "youtube" ? 20000 : 8000, (playbackId) =>
        sendMessage({ type: "PREVIEW_SOURCE", request: { ...input, playbackId } })
      ),
    [begin, sendMessage]
  );

  return {
    activeKey: active?.key ?? null,
    notice,
    clearNotice: useCallback(() => setNotice(null), []),
    toggleCue,
    toggleSource,
    stop,
  };
}

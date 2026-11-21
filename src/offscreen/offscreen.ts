import type {
  CueRequest,
  FocusSource,
  OffscreenMessage,
  OffscreenReport,
  PlayerState,
  SoundStatus,
  SourcePreviewRequest,
} from "@/types/messages";
import { FOCUS_PREVIEW_SECONDS } from "@/types/settings";
import { playThemeCue } from "./synth";
import { focusSourceKey } from "@/lib/focusSourceKey";

/**
 * Offscreen audio player with two independent channels, so a chime can play
 * on top of the focus sound:
 *
 *  - cue channel:        theme chimes (start / pause / stop) and Settings previews.
 *                        One at a time; reports playing / ended / error.
 *  - background channel: the focus sound (file, URL or YouTube) that loops
 *                        while the timer runs. Reports errors only.
 */

/* =========================================================================
 * Shared players
 * ========================================================================= */

interface PlayerHandle {
  setVolume(volume: number): void;
  stop(): void;
  /** Diagnostics only. */
  info?(): { paused?: boolean; time?: number; loop?: boolean; volume?: number };
}

interface PlayerOptions {
  volume: number;
  loop: boolean;
  /** Fade in over this many ms (0 = start at full volume). */
  fadeInMs: number;
  onPlaying(expectedSeconds: number | null): void;
  onEnded(): void;
  onError(reason: string): void;
}

const clampVolume = (v: number) => Math.max(0, Math.min(100, v));

/** Ramps a 0–100 volume from 0 to `target` by calling `apply` every 50 ms. */
function fade(apply: (v: number) => void, target: () => number, ms: number): () => void {
  if (ms <= 0) {
    apply(target());
    return () => {};
  }
  const started = performance.now();
  apply(0);
  const id = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - started) / ms);
    apply(target() * t);
    if (t >= 1) clearInterval(id);
  }, 50);
  return () => clearInterval(id);
}

function createAudioPlayer(src: string, label: string, opts: PlayerOptions): PlayerHandle {
  const audio = new Audio();
  let volume = clampVolume(opts.volume);
  let stopFade = () => {};
  let done = false;

  audio.preload = "auto";
  audio.loop = opts.loop;
  audio.volume = 0;
  audio.addEventListener("ended", () => !done && opts.onEnded());
  audio.addEventListener("error", () => {
    if (done) return;
    const code = audio.error?.code;
    opts.onError(
      code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        ? `The ${label} isn't a playable audio file (or the link isn't a direct download).`
        : `The ${label} couldn't be loaded.`
    );
  });

  audio.src = src;
  audio
    .play()
    .then(() => {
      if (done) return;
      stopFade = fade((v) => (audio.volume = v / 100), () => volume, opts.fadeInMs);
      opts.onPlaying(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    })
    .catch((error: Error) => {
      if (!done && error.name !== "AbortError") opts.onError(`The ${label} couldn't be played.`);
    });

  return {
    setVolume(v) {
      volume = clampVolume(v);
      stopFade();
      audio.volume = volume / 100;
    },
    info: () => ({ paused: audio.paused, time: audio.currentTime, loop: audio.loop, volume: audio.volume }),
    stop() {
      done = true;
      stopFade();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const YT_STATE = { ENDED: 0, PLAYING: 1 } as const;
const YT_START_TIMEOUT_MS = 12000;

function youTubeErrorText(code: number): string {
  switch (code) {
    case 2:
      return "That YouTube link looks invalid.";
    case 100:
      return "That YouTube video was removed or is private.";
    case 101:
    case 150:
      return "The owner of that YouTube video doesn't allow it to be played in other apps.";
    case 153:
      return "YouTube refused to load the player.";
    default:
      return `YouTube couldn't play that video (error ${code}).`;
  }
}

function createYouTubePlayer(videoId: string, startSeconds: number, opts: PlayerOptions): PlayerHandle {
  const iframe = document.createElement("iframe");
  let volume = clampVolume(opts.volume);
  let started = false;
  let done = false;
  let stopFade = () => {};

  const post = (payload: object) => iframe.contentWindow?.postMessage(JSON.stringify(payload), YT_ORIGIN);
  const command = (func: string, args: unknown[] = []) => post({ event: "command", func, args });

  const startTimer = window.setTimeout(() => {
    if (!started && !done) opts.onError("YouTube didn't start playing (check the link and your connection).");
  }, YT_START_TIMEOUT_MS);

  const onMessage = (event: MessageEvent) => {
    if (done || event.source !== iframe.contentWindow) return;
    let data: { event?: string; info?: unknown };
    try {
      data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }

    if (data.event === "onReady") {
      command("setVolume", [started ? volume : 0]);
      command("unMute");
      command("playVideo");
    }

    const state =
      data.event === "onStateChange"
        ? (data.info as number)
        : data.event === "infoDelivery"
          ? (data.info as { playerState?: number } | undefined)?.playerState
          : undefined;

    if (state === YT_STATE.PLAYING && !started) {
      started = true;
      clearTimeout(startTimer);
      stopFade = fade((v) => command("setVolume", [Math.round(v)]), () => volume, opts.fadeInMs);
      opts.onPlaying(null);
    } else if (state === YT_STATE.ENDED && started) {
      if (opts.loop) {
        command("seekTo", [startSeconds, true]);
        command("playVideo");
      } else {
        opts.onEnded();
      }
    }

    if (data.event === "onError") opts.onError(youTubeErrorText(Number(data.info)));
  };

  const params = new URLSearchParams({
    autoplay: "1",
    enablejsapi: "1",
    controls: "0",
    playsinline: "1",
    origin: location.origin,
  });
  if (startSeconds > 0) params.set("start", String(Math.floor(startSeconds)));

  iframe.width = "320";
  iframe.height = "180";
  iframe.allow = "autoplay; encrypted-media";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.src = `${YT_ORIGIN}/embed/${encodeURIComponent(videoId)}?${params}`;

  window.addEventListener("message", onMessage);
  iframe.addEventListener("load", () => {
    // Ask the player to send state events, then start playback quietly (we fade in once it plays).
    post({ event: "listening", id: videoId, channel: "widget" });
    command("setVolume", [0]);
    command("playVideo");
  });
  document.body.appendChild(iframe);

  return {
    setVolume(v) {
      volume = clampVolume(v);
      stopFade();
      if (started) command("setVolume", [volume]);
    },
    stop() {
      done = true;
      stopFade();
      clearTimeout(startTimer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
    },
  };
}

function createSourcePlayer(source: FocusSource, opts: PlayerOptions): PlayerHandle | null {
  switch (source.kind) {
    case "local":
      return source.customSoundDataUrl ? createAudioPlayer(source.customSoundDataUrl, "uploaded file", opts) : null;
    case "url":
      return source.externalAudioUrl ? createAudioPlayer(source.externalAudioUrl, "audio URL", opts) : null;
    case "youtube":
      return source.youtubeVideoId ? createYouTubePlayer(source.youtubeVideoId, source.youtubeStartSeconds, opts) : null;
    default:
      return null;
  }
}

function report(status: SoundStatus): void {
  const message: OffscreenReport = { target: "background", type: "SOUND_STATUS", status };
  chrome.runtime.sendMessage(message).catch(() => {
    /* no listener open (side panel closed); status is best-effort */
  });
}

/* =========================================================================
 * Cue channel: chimes + previews
 * ========================================================================= */

interface CuePlayback {
  playbackId: string;
  preview: boolean;
  stop: () => void;
  finished: boolean;
}

let cue: CuePlayback | null = null;

function cueStatus(playback: CuePlayback, state: SoundStatus["state"], extra: Partial<SoundStatus> = {}) {
  report({ channel: "cue", playbackId: playback.playbackId, preview: playback.preview, state, ...extra });
}

function finishCue(playback: CuePlayback, state: "ended" | "error", extra: Partial<SoundStatus> = {}) {
  if (playback.finished) return;
  playback.finished = true;
  playback.stop();
  if (cue === playback) cue = null;
  cueStatus(playback, state, extra);
}

function stopCue(): void {
  if (cue) finishCue(cue, "ended");
}

function playChime(request: CueRequest): void {
  stopCue();
  const ctx = new AudioContext();
  let timer = 0;
  const playback: CuePlayback = {
    playbackId: request.playbackId,
    preview: request.preview,
    finished: false,
    stop: () => {
      clearTimeout(timer);
      ctx.close().catch(() => {});
    },
  };
  cue = playback;

  const seconds = playThemeCue(ctx, request.theme, request.cue, request.volume);
  cueStatus(playback, "playing", { expectedSeconds: seconds });
  timer = window.setTimeout(() => finishCue(playback, "ended"), seconds * 1000);
}

function previewSource(request: SourcePreviewRequest): void {
  stopCue();
  let capTimer = 0;
  const playback: CuePlayback = { playbackId: request.playbackId, preview: true, finished: false, stop: () => {} };
  cue = playback;

  const player = createSourcePlayer(request.source, {
    volume: request.volume,
    loop: false,
    fadeInMs: 0,
    onPlaying: (duration) => {
      const seconds = Math.min(duration ?? FOCUS_PREVIEW_SECONDS, FOCUS_PREVIEW_SECONDS);
      cueStatus(playback, "playing", { expectedSeconds: seconds });
      capTimer = window.setTimeout(() => finishCue(playback, "ended"), seconds * 1000);
    },
    onEnded: () => finishCue(playback, "ended"),
    onError: (reason) => finishCue(playback, "error", { message: reason }),
  });

  if (!player) {
    finishCue(playback, "error", { message: "Nothing to play yet. Add a file or link first." });
    return;
  }
  playback.stop = () => {
    clearTimeout(capTimer);
    player.stop();
  };
}

/* =========================================================================
 * Background channel: looping focus sound
 * ========================================================================= */

let focus: { key: string; player: PlayerHandle } | null = null;
let focusDelayTimer = 0;

function stopFocusSound(): void {
  clearTimeout(focusDelayTimer);
  focus?.player.stop();
  focus = null;
}

function startFocusSound(source: FocusSource, volume: number, delayMs: number): void {
  const key = focusSourceKey(source);

  // Already playing this source (e.g. focus → break transition, or settings re-sync): just adjust volume.
  if (focus?.key === key) {
    focus.player.setVolume(volume);
    return;
  }

  stopFocusSound();
  let latestVolume = volume;
  const begin = () => {
    const player = createSourcePlayer(source, {
      volume: latestVolume,
      loop: true,
      fadeInMs: 2000,
      onPlaying: () => report({ channel: "background", playbackId: key, preview: false, state: "playing" }),
      onEnded: () => {},
      onError: (reason) => {
        stopFocusSound();
        report({ channel: "background", playbackId: key, preview: false, state: "error", message: reason });
      },
    });
    if (player) focus = { key, player };
  };

  // Reserve the slot now so a quick second START doesn't double-play during the delay.
  focus = { key, player: { setVolume: (v) => (latestVolume = v), stop: () => {} } };
  if (delayMs > 0) {
    focusDelayTimer = window.setTimeout(() => {
      focus = null;
      begin();
    }, delayMs);
  } else {
    focus = null;
    begin();
  }
}

/* =========================================================================
 * Dispatcher
 * ========================================================================= */

chrome.runtime.onMessage.addListener((message: OffscreenMessage, _sender, sendResponse) => {
  if (message?.target !== "offscreen") return;
  switch (message.type) {
    case "GET_PLAYER_STATE": {
      const state: PlayerState = {
        cue: cue ? { playbackId: cue.playbackId, preview: cue.preview } : null,
        focus: focus ? { key: focus.key, ...focus.player.info?.() } : null,
      };
      sendResponse(state);
      return;
    }
    case "PLAY_CUE":
      playChime(message.request);
      break;
    case "PREVIEW_SOURCE":
      previewSource(message.request);
      break;
    case "STOP_CUE":
      stopCue();
      break;
    case "START_FOCUS_SOUND":
      startFocusSound(message.source, message.volume, message.delayMs);
      break;
    case "STOP_FOCUS_SOUND":
      stopFocusSound();
      break;
  }
});

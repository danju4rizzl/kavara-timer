import type { OffscreenMessage } from "@/types/messages";

let audioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;

function createAlarmTone(volume: number): void {
  stopCurrentAlarm();

  audioContext = new AudioContext();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume / 100;
  gainNode.connect(audioContext.destination);

  const noteSequence = [
    { frequency: 587.33, start: 0, duration: 0.15 },
    { frequency: 659.25, start: 0.2, duration: 0.15 },
    { frequency: 783.99, start: 0.4, duration: 0.15 },
    { frequency: 880.0, start: 0.6, duration: 0.3 },
    { frequency: 587.33, start: 1.2, duration: 0.15 },
    { frequency: 659.25, start: 1.4, duration: 0.15 },
    { frequency: 783.99, start: 1.6, duration: 0.15 },
    { frequency: 880.0, start: 1.8, duration: 0.3 },
  ];

  const now = audioContext.currentTime;

  for (const note of noteSequence) {
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;

    noteGain.gain.setValueAtTime(0, now + note.start);
    noteGain.gain.linearRampToValueAtTime(1, now + note.start + 0.02);
    noteGain.gain.linearRampToValueAtTime(0, now + note.start + note.duration);

    oscillator.connect(noteGain);
    noteGain.connect(gainNode);

    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + note.duration + 0.05);
  }
}

let youtubeIframe: HTMLIFrameElement | null = null;

function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]{22})/);
  return match && match[1] ? match[1] : null;
}

async function fetchSpotifyPreviewUrl(trackId: string): Promise<string | null> {
  try {
    const url = `https://open.spotify.com/embed/track/${trackId}`;
    const response = await fetch(url);
    const html = await response.text();
    const match = html.match(/"preview_url"\s*:\s*"(https:\/\/p\.scdn\.co\/mp3-preview\/[^"]+)"/);
    if (match && match[1]) {
      return match[1].replace(/\\/g, "");
    }
  } catch (err) {
    console.error("Failed to fetch Spotify preview:", err);
  }
  return null;
}

async function playCustomSound(dataUrl: string, volume: number): Promise<void> {
  stopCurrentAlarm();

  let targetUrl = dataUrl;

  const spotifyTrackId = extractSpotifyTrackId(dataUrl);
  if (spotifyTrackId) {
    const previewUrl = await fetchSpotifyPreviewUrl(spotifyTrackId);
    if (previewUrl) {
      targetUrl = previewUrl;
    } else {
      createAlarmTone(volume);
      return;
    }
  }

  audioContext = new AudioContext();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume / 100;
  gainNode.connect(audioContext.destination);

  try {
    const response = await fetch(targetUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    source.start();
  } catch {
    createAlarmTone(volume);
  }
}

function playYoutubeAlarm(videoId: string, volume: number): void {
  stopCurrentAlarm();

  youtubeIframe = document.createElement("iframe");
  youtubeIframe.id = "youtube-player";
  youtubeIframe.width = "200";
  youtubeIframe.height = "200";
  youtubeIframe.style.position = "absolute";
  youtubeIframe.style.width = "0px";
  youtubeIframe.style.height = "0px";
  youtubeIframe.style.border = "none";
  youtubeIframe.style.pointerEvents = "none";
  youtubeIframe.setAttribute("allow", "autoplay");
  youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0`;
  
  document.body.appendChild(youtubeIframe);

  youtubeIframe.addEventListener("load", () => {
    setTimeout(() => {
      if (youtubeIframe && youtubeIframe.contentWindow) {
        youtubeIframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
          "*"
        );
        youtubeIframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      }
    }, 1000);
  });
}

function stopCurrentAlarm(): void {
  if (youtubeIframe) {
    try {
      youtubeIframe.remove();
    } catch {
      /* Already removed */
    }
    youtubeIframe = null;
  }

  if (currentOscillator) {
    try {
      currentOscillator.stop();
    } catch {
      /* Already stopped */
    }
    currentOscillator = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

chrome.runtime.onMessage.addListener((message: OffscreenMessage) => {
  switch (message.type) {
    case "PLAY_ALARM":
      if (message.alarmSoundType === "default") {
        createAlarmTone(message.volume);
      } else if (message.alarmSoundType === "local" && message.customSoundDataUrl) {
        playCustomSound(message.customSoundDataUrl, message.volume);
      } else if (message.alarmSoundType === "url" && message.externalAudioUrl) {
        playCustomSound(message.externalAudioUrl, message.volume);
      } else if (message.alarmSoundType === "youtube" && message.youtubeVideoId) {
        playYoutubeAlarm(message.youtubeVideoId, message.volume);
      } else {
        createAlarmTone(message.volume);
      }
      break;

    case "STOP_ALARM":
      stopCurrentAlarm();
      break;
  }
});

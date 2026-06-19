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

async function playCustomSound(dataUrl: string, volume: number): Promise<void> {
  stopCurrentAlarm();

  audioContext = new AudioContext();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume / 100;
  gainNode.connect(audioContext.destination);

  try {
    const response = await fetch(dataUrl);
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

function stopCurrentAlarm(): void {
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
      if (message.customSoundDataUrl) {
        playCustomSound(message.customSoundDataUrl, message.volume);
      } else {
        createAlarmTone(message.volume);
      }
      break;

    case "STOP_ALARM":
      stopCurrentAlarm();
      break;
  }
});

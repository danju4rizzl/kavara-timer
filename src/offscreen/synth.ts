import type { SoundThemeId } from "@/types/settings";
import type { SoundCue } from "@/types/messages";

/**
 * Tiny WebAudio synth for the built-in sound themes. Every theme defines a
 * start, pause and stop chime (stop also marks a finished session), so nothing needs to be
 * downloaded and the extension stays fully offline.
 */

/** [frequency ratio, relative gain, decay multiplier] */
type Overtone = [number, number, number?];

interface Tone {
  /** Fundamental frequency in Hz. */
  f: number;
  /** Start offset in seconds. */
  t: number;
  /** Length in seconds (time to decay to silence). */
  d: number;
  wave?: OscillatorType;
  gain?: number;
  attack?: number;
  partials?: Overtone[];
  /** Pitch slide target (Hz) over the note's length. */
  glideTo?: number;
}

interface Voice {
  wave: OscillatorType;
  gain: number;
  attack: number;
  partials: Overtone[];
}

type Recipe = Record<SoundCue, Tone[]>;

const NOTE = {
  C4: 261.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  Cs6: 1108.73, C6: 1046.5, E6: 1318.51, A6: 1760.0, B6: 1975.53,
  C7: 2093.0,
};

const VOICES: Record<SoundThemeId, Voice> = {
  classic: { wave: "sine", gain: 0.9, attack: 0.015, partials: [[1, 1], [2, 0.12, 0.5]] },
  zen: {
    wave: "sine",
    gain: 0.75,
    attack: 0.04,
    // Inharmonic partials give the metallic "bowl" colour.
    partials: [[1, 1], [2.76, 0.45, 0.7], [5.4, 0.22, 0.45], [8.93, 0.1, 0.3]],
  },
  digital: { wave: "square", gain: 0.22, attack: 0.004, partials: [[1, 1]] },
  marimba: { wave: "sine", gain: 0.95, attack: 0.004, partials: [[1, 1], [3.93, 0.35, 0.22], [9.2, 0.1, 0.1]] },
  crystal: { wave: "triangle", gain: 0.8, attack: 0.008, partials: [[1, 1], [2, 0.3, 0.6], [3.01, 0.16, 0.4], [4.2, 0.08, 0.25]] },
};

const n = (f: number, t: number, d: number, extra: Partial<Tone> = {}): Tone => ({ f, t, d, ...extra });

/** Repeats a phrase `times` times, `gap` seconds apart. */
function repeat(phrase: Tone[], times: number, gap: number): Tone[] {
  const out: Tone[] = [];
  for (let i = 0; i < times; i++) out.push(...phrase.map((tone) => ({ ...tone, t: tone.t + i * gap })));
  return out;
}

const RECIPES: Record<SoundThemeId, Recipe> = {
  classic: {
    start: [n(NOTE.D5, 0, 0.25), n(NOTE.A5, 0.13, 0.45)],
    pause: [n(NOTE.A5, 0, 0.25), n(NOTE.D5, 0.13, 0.45)],
    stop: repeat([n(NOTE.D5, 0, 0.2), n(NOTE.E5, 0.2, 0.2), n(NOTE.G5, 0.4, 0.2), n(NOTE.A5, 0.6, 0.5)], 2, 1.2),
  },
  zen: {
    start: [n(NOTE.G4, 0, 2.4)],
    pause: [n(NOTE.C4, 0, 2.2, { gain: 0.6 })],
    stop: [n(293.66, 0, 3.2), n(220, 1.4, 4.2)],
  },
  digital: {
    start: [n(NOTE.E6, 0, 0.07), n(NOTE.A6, 0.1, 0.09)],
    pause: [n(NOTE.A6, 0, 0.07), n(NOTE.C6, 0.1, 0.12)],
    stop: repeat(repeat([n(NOTE.C7, 0, 0.08)], 4, 0.12), 3, 1.0),
  },
  marimba: {
    start: [n(NOTE.C5, 0, 0.5), n(NOTE.E5, 0.09, 0.5), n(NOTE.G5, 0.18, 0.6)],
    pause: [n(NOTE.G5, 0, 0.5), n(NOTE.E5, 0.09, 0.5), n(NOTE.C5, 0.18, 0.7)],
    stop: repeat(
      [n(NOTE.C5, 0, 0.5), n(NOTE.E5, 0.15, 0.5), n(NOTE.G5, 0.3, 0.5), n(NOTE.C6, 0.45, 0.6), n(NOTE.G5, 0.75, 0.5), n(NOTE.C6, 0.9, 1.0)],
      2,
      1.7
    ),
  },
  crystal: {
    start: [n(NOTE.E6, 0, 1.2), n(NOTE.B6, 0.12, 1.4)],
    pause: [n(NOTE.B6, 0, 1.0), n(NOTE.E6, 0.12, 1.3)],
    stop: repeat([n(NOTE.A5, 0, 2), n(NOTE.Cs6, 0.12, 2), n(NOTE.E6, 0.24, 2), n(NOTE.A6, 0.36, 2.2)], 2, 1.8),
  },
};

function scheduleTone(ctx: AudioContext, out: AudioNode, voice: Voice, tone: Tone, t0: number): void {
  const start = t0 + tone.t;
  const attack = tone.attack ?? voice.attack;
  const peak = (tone.gain ?? 1) * voice.gain;

  for (const [ratio, partialGain, decayMul = 1] of tone.partials ?? voice.partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const end = start + Math.max(attack + 0.02, tone.d * decayMul);

    osc.type = tone.wave ?? voice.wave;
    osc.frequency.setValueAtTime(tone.f * ratio, start);
    if (tone.glideTo) osc.frequency.exponentialRampToValueAtTime(tone.glideTo * ratio, end);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(peak * partialGain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(env).connect(out);
    osc.start(start);
    osc.stop(end + 0.05);
  }
}

/**
 * Plays a theme cue on `ctx`. Returns the total length in seconds so the
 * caller knows when playback has finished.
 */
export function playThemeCue(ctx: AudioContext, theme: SoundThemeId, cue: SoundCue, volume: number): number {
  const recipe = RECIPES[theme] ?? RECIPES.classic;
  const voice = VOICES[theme] ?? VOICES.classic;
  const tones = recipe[cue];

  // master volume → compressor (prevents clipping when partials stack)
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume / 100)) * 0.7;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 4;
  master.connect(compressor).connect(ctx.destination);

  const t0 = ctx.currentTime + 0.03;
  let duration = 0;
  for (const tone of tones) {
    scheduleTone(ctx, master, voice, tone, t0);
    duration = Math.max(duration, tone.t + tone.d);
  }
  return duration + 0.1;
}

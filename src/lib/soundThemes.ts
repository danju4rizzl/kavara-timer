import type { SoundThemeId } from "@/types/settings";

export interface SoundThemeInfo {
  id: SoundThemeId;
  name: string;
  description: string;
}

/** Display metadata. The actual synth recipes live in src/offscreen/synth.ts. */
export const SOUND_THEMES: SoundThemeInfo[] = [
  { id: "classic", name: "Classic Chime", description: "Bright, friendly sine-wave arpeggio" },
  { id: "zen", name: "Zen Bowl", description: "Warm singing bowl with a long, calm ring" },
  { id: "digital", name: "Digital Alarm", description: "Crisp beeps, like a desk alarm clock" },
  { id: "marimba", name: "Marimba", description: "Wooden mallet notes, playful and short" },
  { id: "crystal", name: "Crystal Bells", description: "Shimmering glassy bells" },
];

export function getSoundThemeName(id: SoundThemeId): string {
  return SOUND_THEMES.find((t) => t.id === id)?.name ?? "Classic Chime";
}

export function isSoundThemeId(value: unknown): value is SoundThemeId {
  return SOUND_THEMES.some((t) => t.id === value);
}

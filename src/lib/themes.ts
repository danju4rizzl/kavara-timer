/**
 * Color themes. The actual colors live in src/index.css under
 * :root[data-theme="…"]; this file is the list shown in Settings.
 * (The block-screen overlay keeps its own small copy of the accent colors in
 * src/content/content.ts, because content scripts can't share bundle chunks.)
 */
import type { ColorThemeId } from "@/types/settings";

export type ThemeId = ColorThemeId;

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  /** Three colors for the swatch preview. */
  swatch: [string, string, string];
}

export const THEMES: ThemeInfo[] = [
  { id: "default", name: "Default", description: "Midnight blue & violet", swatch: ["#3b82f6", "#8b5cf6", "#22d3ee"] },
  { id: "raspberries", name: "Raspberries", description: "Ripe berry pinks", swatch: ["#f43f7f", "#c026d3", "#fb7185"] },
  { id: "eko-ile", name: "Eko-Ile", description: "Danfo yellow & lagoon teal", swatch: ["#fbbf24", "#f97316", "#14b8a6"] },
  { id: "aurora", name: "Aurora", description: "Northern-lights greens", swatch: ["#34d399", "#22d3ee", "#a78bfa"] },
  { id: "ember", name: "Ember", description: "Warm sunset coral", swatch: ["#fb7149", "#ef4444", "#fbbf24"] },
  { id: "graphite", name: "Graphite", description: "Quiet monochrome silver", swatch: ["#e4e4e7", "#a1a1aa", "#71717a"] },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

const STORAGE_KEY = "focusflow-theme";

/** Applies a theme to the page (instant; used for live preview while editing settings). */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
}

/** Remembers the saved theme locally so the next open paints in it immediately, without a flash. */
export function rememberTheme(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable: harmless */
  }
}

export function rememberedTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

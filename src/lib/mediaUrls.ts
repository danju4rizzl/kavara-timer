/**
 * Helpers for turning what users paste into something playable.
 */

export interface YouTubeRef {
  videoId: string;
  startSeconds: number;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Parses "1h2m3s", "90s", "90" into seconds. */
function parseTimestamp(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h ?? "0", 10) * 3600) + (parseInt(m ?? "0", 10) * 60) + parseInt(s ?? "0", 10);
}

/**
 * Accepts youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/,
 * music.youtube.com links, or a bare 11-character video ID.
 * Returns null if no video ID can be found.
 */
export function parseYouTubeUrl(input: string): YouTubeRef | null {
  const raw = input.trim();
  if (!raw) return null;
  if (YT_ID.test(raw)) return { videoId: raw, startSeconds: 0 };

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
      videoId = match?.[1] ?? null;
    }
  }

  if (!videoId || !YT_ID.test(videoId)) return null;
  const startSeconds = parseTimestamp(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return { videoId, startSeconds };
}

export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Converts common share links into direct-download links so they can play:
 * Dropbox (?dl=0 → ?raw=1) and Google Drive (/file/d/ID/view → uc?export=download).
 */
export function normalizeAudioUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (url.hostname.endsWith("dropbox.com")) {
    url.searchParams.delete("dl");
    url.searchParams.set("raw", "1");
    return url.toString();
  }

  if (url.hostname === "drive.google.com") {
    const match = url.pathname.match(/\/file\/d\/([^/]+)/);
    const id = match?.[1] ?? url.searchParams.get("id");
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  return url.toString();
}

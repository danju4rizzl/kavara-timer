const CATEGORY_MAP: Record<string, string[]> = {
  "Social Media": [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "snapchat.com",
    "linkedin.com",
    "pinterest.com",
    "threads.net",
    "mastodon.social",
    "tumblr.com",
  ],
  Entertainment: [
    "youtube.com",
    "netflix.com",
    "twitch.tv",
    "hulu.com",
    "disneyplus.com",
    "hbomax.com",
    "primevideo.com",
    "crunchyroll.com",
    "spotify.com",
    "soundcloud.com",
    "dailymotion.com",
    "vimeo.com",
  ],
  News: [
    "reddit.com",
    "news.ycombinator.com",
    "buzzfeed.com",
    "cnn.com",
    "bbc.com",
    "foxnews.com",
    "theguardian.com",
  ],
  Gaming: [
    "store.steampowered.com",
    "epicgames.com",
    "roblox.com",
    "miniclip.com",
    "poki.com",
    "itch.io",
  ],
  Shopping: [
    "amazon.com",
    "ebay.com",
    "aliexpress.com",
    "etsy.com",
    "wish.com",
    "shein.com",
  ],
  Community: [
    "reddit.com",
    "quora.com",
    "stackoverflow.com",
    "discord.com",
    "slack.com",
    "telegram.org",
  ],
};

export function detectCategory(domain: string): string {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

  for (const [category, domains] of Object.entries(CATEGORY_MAP)) {
    if (domains.some((knownDomain) => normalizedDomain.includes(knownDomain))) {
      return category;
    }
  }

  return "Other";
}

export function getAllCategories(): string[] {
  return [...Object.keys(CATEGORY_MAP), "Other"];
}

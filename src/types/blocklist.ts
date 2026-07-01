export interface BlockedSite {
  id: string;
  domain: string;
  category: string;
  addedAt: number;
  isActive?: boolean;
}

export interface FocusMetrics {
  totalFocusSeconds: number;
  blockedAttempts: number;
  lastClearedAt: number;
}

export const DEFAULT_FOCUS_METRICS: FocusMetrics = {
  totalFocusSeconds: 0,
  blockedAttempts: 0,
  lastClearedAt: Date.now(),
};

export const DEFAULT_SOCIAL_MEDIA_SITES: BlockedSite[] = [
  { id: "sm-fb", domain: "facebook.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-ig", domain: "instagram.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-tw", domain: "twitter.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-x", domain: "x.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-yt", domain: "youtube.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-tt", domain: "tiktok.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  { id: "sm-rd", domain: "reddit.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
];

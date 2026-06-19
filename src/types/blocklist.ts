export interface BlockedSite {
  id: string;
  domain: string;
  category: string;
  addedAt: number;
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

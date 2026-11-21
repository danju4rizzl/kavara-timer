import { useCallback, useEffect, useRef, useState } from "react";
import type { BackgroundMessage, PopupMessage } from "@/types/messages";
import { createEmptyStats, type BadgeId, type FocusStats } from "@/types/stats";
import { BADGES, levelFromXp } from "@/lib/gamification";

/** A moment worth celebrating with the full-screen overlay. */
export type Celebration =
  | { kind: "badge"; badge: BadgeId }
  | { kind: "level"; level: number; name: string }
  | { kind: "goal" };

/**
 * Focus stats from the service worker, plus the reward moments they produce:
 * small XP toasts for every session, and a celebration queue for daily goals,
 * level-ups and new badges.
 */
export function useFocusStats(
  sendMessage: (message: PopupMessage) => void,
  registerMessageHandler: (handler: (message: BackgroundMessage) => void) => () => void,
  onToast: (message: string) => void
) {
  const [stats, setStats] = useState<FocusStats>(createEmptyStats);
  const [loaded, setLoaded] = useState(false);
  const [queue, setQueue] = useState<Celebration[]>([]);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  useEffect(() => {
    const unsubscribe = registerMessageHandler((message) => {
      if (message.type !== "FOCUS_STATS_UPDATE") return;
      setStats(message.stats);
      setLoaded(true);

      const event = message.event;
      if (!event) return;
      const next: Celebration[] = [];
      if (event.kind === "session") {
        if (event.counted) onToastRef.current(`Focus session complete  +${event.xpGained} XP`);
        else if (event.xpGained > 0) onToastRef.current(`+${event.xpGained} XP for the time you focused`);
        if (event.goalReached) next.push({ kind: "goal" });
        if (event.levelAfter > event.levelBefore) {
          next.push({ kind: "level", level: event.levelAfter, name: levelFromXp(message.stats.lifetime.xp).name });
        }
      }
      for (const badge of event.newBadges) next.push({ kind: "badge", badge });
      if (next.length) setQueue((q) => [...q, ...next]);
    });
    sendMessage({ type: "GET_FOCUS_STATS" });
    return unsubscribe;
  }, [registerMessageHandler, sendMessage]);

  const dismissCelebration = useCallback(() => setQueue((q) => q.slice(1)), []);

  return { stats, loaded, celebration: queue[0] ?? null, dismissCelebration };
}

export function badgeDef(id: BadgeId) {
  return BADGES.find((b) => b.id === id)!;
}

import { useState, useEffect, useCallback, useRef } from "react";
import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
import { DEFAULT_FOCUS_METRICS } from "@/types/blocklist";

interface BlocklistHook {
  blockedSites: BlockedSite[];
  focusMetrics: FocusMetrics;
  addSites: (sites: BlockedSite[]) => void;
  removeSite: (siteId: string) => void;
  clearMetrics: () => void;
}

export function useBlocklist(
  sendMessage: (message: PopupMessage) => void,
  onPortMessage?: (handler: (message: BackgroundMessage) => void) => void
): BlocklistHook {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [focusMetrics, setFocusMetrics] = useState<FocusMetrics>(DEFAULT_FOCUS_METRICS);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    sendMessage({ type: "GET_BLOCKED_SITES" });
    sendMessage({ type: "GET_FOCUS_METRICS" });
  }, [sendMessage]);

  useEffect(() => {
    if (!onPortMessage) return;

    onPortMessage((message: BackgroundMessage) => {
      if (message.type === "BLOCKED_SITES_UPDATE") {
        setBlockedSites(message.sites);
      }
      if (message.type === "FOCUS_METRICS_UPDATE") {
        setFocusMetrics(message.metrics);
      }
    });
  }, [onPortMessage]);

  const addSites = useCallback(
    (sites: BlockedSite[]) => {
      sendMessage({ type: "ADD_BLOCKED_SITES", sites });
    },
    [sendMessage]
  );

  const removeSite = useCallback(
    (siteId: string) => {
      sendMessage({ type: "REMOVE_BLOCKED_SITE", siteId });
    },
    [sendMessage]
  );

  const clearMetrics = useCallback(() => {
    sendMessage({ type: "CLEAR_FOCUS_METRICS" });
  }, [sendMessage]);

  return { blockedSites, focusMetrics, addSites, removeSite, clearMetrics };
}

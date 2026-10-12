import { useState, useEffect, useCallback, useRef } from "react";
import type { BlockedSite, FocusMetrics } from "@/types/blocklist";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
import { DEFAULT_FOCUS_METRICS } from "@/types/blocklist";

interface BlocklistHook {
  customSites: BlockedSite[];
  customActive: boolean;
  socialMediaSites: BlockedSite[];
  socialMediaActive: boolean;
  focusMetrics: FocusMetrics;
  addSites: (sites: BlockedSite[]) => void;
  toggleSite: (siteId: string, listType: "custom" | "socialMedia") => void;
  deleteSite: (siteId: string, listType: "custom" | "socialMedia") => void;
  toggleBlocklistActive: (listType: "custom" | "socialMedia", isActive: boolean) => void;
  clearMetrics: () => void;
}

export function useBlocklist(
  sendMessage: (message: PopupMessage) => void,
  onPortMessage?: (handler: (message: BackgroundMessage) => void) => void
): BlocklistHook {
  const [customSites, setCustomSites] = useState<BlockedSite[]>([]);
  const [customActive, setCustomActive] = useState<boolean>(true);
  const [socialMediaSites, setSocialMediaSites] = useState<BlockedSite[]>([]);
  const [socialMediaActive, setSocialMediaActive] = useState<boolean>(true);
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

    const cleanup = onPortMessage((message: BackgroundMessage) => {
      if (message.type === "BLOCKED_SITES_UPDATE") {
        // Safe destructuring supporting old and new formats
        const custom = message.customSites ?? (message as any).sites ?? [];
        const activeCustom = message.customActive !== false;
        const smSites = message.socialMediaSites ?? [];
        const activeSM = message.socialMediaActive !== false;

        setCustomSites(custom);
        setCustomActive(activeCustom);
        setSocialMediaSites(smSites);
        setSocialMediaActive(activeSM);
      }
      if (message.type === "FOCUS_METRICS_UPDATE") {
        setFocusMetrics(message.metrics);
      }
    });

    return cleanup;
  }, [onPortMessage]);

  const addSites = useCallback(
    (sites: BlockedSite[]) => {
      setCustomSites((prev) => [...prev, ...sites]);
      sendMessage({ type: "ADD_BLOCKED_SITES", sites });
    },
    [sendMessage]
  );

  const toggleSite = useCallback(
    (siteId: string, listType: "custom" | "socialMedia") => {
      if (listType === "custom") {
        setCustomSites((prev) =>
          prev.map((site) => {
            if (site.id === siteId || site.domain === siteId) {
              const currentActive = site.isActive !== false;
              return { ...site, isActive: !currentActive };
            }
            return site;
          })
        );
      }
      sendMessage({ type: "TOGGLE_BLOCKED_SITE", siteId, listType });
    },
    [sendMessage]
  );

  const deleteSite = useCallback(
    (siteId: string, listType: "custom" | "socialMedia") => {
      if (listType === "custom") {
        setCustomSites((prev) => prev.filter((site) => site.id !== siteId && site.domain !== siteId));
      }
      sendMessage({ type: "DELETE_BLOCKED_SITE", siteId, listType });
    },
    [sendMessage]
  );

  const toggleBlocklistActive = useCallback(
    (listType: "custom" | "socialMedia", isActive: boolean) => {
      if (listType === "custom") {
        setCustomActive(isActive);
      } else {
        setSocialMediaActive(isActive);
      }
      sendMessage({ type: "TOGGLE_BLOCKLIST_ACTIVE", listType, isActive });
    },
    [sendMessage]
  );

  const clearMetrics = useCallback(() => {
    sendMessage({ type: "CLEAR_FOCUS_METRICS" });
  }, [sendMessage]);

  return {
    customSites,
    customActive,
    socialMediaSites,
    socialMediaActive,
    focusMetrics,
    addSites,
    toggleSite,
    deleteSite,
    toggleBlocklistActive,
    clearMetrics,
  };
}

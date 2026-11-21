import { useCallback, useEffect, useState } from "react";

const ALL_SITES: chrome.permissions.Permissions = { origins: ["<all_urls>"] };

/**
 * Whether FocusFlow may run on every website. Edge (and Chrome) let users limit
 * an extension to "on click" or "specific sites"; then the blocker can't work.
 * Returns null while checking.
 */
export function useSiteAccess() {
  const [granted, setGranted] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    chrome.permissions
      .contains(ALL_SITES)
      .then(setGranted)
      .catch(() => setGranted(true)); // don't nag if the check itself isn't available
  }, []);

  useEffect(() => {
    refresh();
    chrome.permissions.onAdded.addListener(refresh);
    chrome.permissions.onRemoved.addListener(refresh);
    // Site-access changes made in the browser's extension settings don't always fire events.
    window.addEventListener("focus", refresh);
    return () => {
      chrome.permissions.onAdded.removeListener(refresh);
      chrome.permissions.onRemoved.removeListener(refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  /** Must be called from a click. Shows the browser's permission prompt. */
  const request = useCallback(async () => {
    try {
      setGranted(await chrome.permissions.request(ALL_SITES));
    } catch {
      refresh();
    }
  }, [refresh]);

  return { granted, request };
}

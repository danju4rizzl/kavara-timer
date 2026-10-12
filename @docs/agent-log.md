# Agent Log

## [2026-09-15 07:54:00] Fix Custom Sites Toggle and Delete Buttons in Blocklist

- **Problem:** When clicking the toggle switch or delete button on custom blocked sites, the actions failed to take effect. This occurred because newly added sites lacked an explicit `isActive` boolean (defaulting to `undefined`), causing boolean inversion `!s.isActive` in the background service worker to evaluate to `true` on initial deactivation, keeping the site active. Additionally, site ID matching did not account for domain-level identifiers or missing IDs, UI handlers lacked optimistic updates causing perceived unresponsiveness, and the extension port connection dropped messages without automatic reconnection if disconnected.
- **Solution:** 
  1. Updated [`BlocklistInput.tsx`](file:///C:/Users/pc/dev/others/kavara-timer/src/components/blocklist/BlocklistInput.tsx) to explicitly initialize `isActive: true` on created custom sites.
  2. Updated [`storageService.ts`](file:///C:/Users/pc/dev/others/kavara-timer/src/background/storageService.ts) to sanitize retrieved and stored blocked sites, ensuring consistent IDs and explicit `isActive` booleans.
  3. Fixed [`background.ts`](file:///C:/Users/pc/dev/others/kavara-timer/src/background/background.ts) `TOGGLE_BLOCKED_SITE`, `DELETE_BLOCKED_SITE`, and `REMOVE_BLOCKED_SITE` to properly match by either `siteId` or `domain`, correctly invert active status via `!(s.isActive !== false)`, and broadcast blocked site updates across all connected ports via [`broadcastMessage`](file:///C:/Users/pc/dev/others/kavara-timer/src/background/timerEngine.ts). Made `onConnect` synchronous to avoid race conditions.
  4. Added optimistic UI updates in [`useBlocklist.ts`](file:///C:/Users/pc/dev/others/kavara-timer/src/popup/hooks/useBlocklist.ts) for immediate UI feedback on toggle, delete, and add actions.
  5. Updated [`BlockedSiteCard.tsx`](file:///C:/Users/pc/dev/others/kavara-timer/src/components/blocklist/BlockedSiteCard.tsx) to ensure explicit `type="button"`, stop event propagation, and safely pass `site.id || site.domain`.
  6. Added resilient connection and auto-reconnect fallback in [`useTimerConnection.ts`](file:///C:/Users/pc/dev/others/kavara-timer/src/popup/hooks/useTimerConnection.ts) to prevent dropped messages when the service worker disconnects.

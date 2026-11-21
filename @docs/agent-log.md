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

## [2026-11-21] Store-readiness pass: layout, settings audit, feedback

- **Layout:** an unlayered `* { margin: 0; padding: 0 }` reset in `src/index.css` overrode every Tailwind spacing
  utility (Tailwind v4 utilities live in `@layer utilities`). Moved base styles into `@layer base`. Rebuilt the
  phase switch as a segmented control and tidied the header and bottom nav. The Inter font is now bundled
  (`@fontsource-variable/inter`) instead of loaded from Google Fonts.
- **Settings audit:** wired up `autoStartNextPhase` and `metricsClearInterval` (they did nothing before).
  Removed Spotify scraping. Fixed `resetTimer()` aborting when no offscreen document existed, and a listener
  leak in `useSettings`.
- **Feedback:** new `FeedbackView` + `src/lib/feedback.ts` (FormSubmit → support@kavaradigital.com, mailto fallback).
- **Store prep:** removed unused files (`blocked.html`, `blocked.js`, `rules.json`), added `PRIVACY.md` and
  `scripts/package.mjs`.

## [2026-11-21] Sound system, YouTube alarms, unsaved-settings prompt

- **Sound themes:** 5 synthesized themes (`src/offscreen/synth.ts`), each with start / stop / end cues.
  New settings: `soundTheme`, `startStopSounds`, `youtubeStartSeconds`. The start cue plays on play, the stop
  cue on pause / reset / switching phase while running, and the end cue when a session completes.
- **Preview button stuck on "Stop":** previously the UI never learned when a sound ended. The offscreen player
  now reports `playing` (with `expectedSeconds`) / `ended` / `error` per `playbackId`. The side panel listens
  with `chrome.runtime.onMessage` directly; relaying through the service worker lost messages once Chrome had
  stopped the idle worker. `useSoundPreview` adds a watchdog for when Chrome closes the offscreen document
  mid-sound.
- **Audio URL preview played the default chime:** replaced fetch + `decodeAudioData` with an `HTMLAudioElement`.
  The URL now updates on every keystroke (not on blur), share links are converted to direct links, and
  failures show the reason in Settings.
- **YouTube:** IFrame player on youtube-nocookie.com inside the offscreen document, with a DNR session rule
  that sets the Referer header (Chrome sends none from extension pages → YouTube error 153). Uses
  `declarativeNetRequestWithHostAccess` (no extra install warning). Falls back to the theme chime on player
  errors or if playback hasn't started after 12 s.
- **Unsaved settings:** `UnsavedChangesDialog` (Save / Discard / Keep editing) when leaving Settings with changes,
  a "Settings saved" toast, and an unsaved-changes hint above the Save button.
- **Verified** by loading the unpacked build in Chromium with Playwright: 30 automated checks (all theme cues,
  URL playback and fallback, stop mid-playback, previews after the worker went idle, YouTube rule + fallback,
  dialog, toast, persistence). Real YouTube playback was not testable offline.

## [2026-11-21] Focus sound (loops while running) + start/pause/stop chimes

- **Change of meaning:** the custom sound (file / URL / YouTube) was a session-end alarm. It is now a **focus sound**
  that loops in the background while the timer runs. The theme chimes are now **start / pause / stop**.
  Stop plays on reset and always when a session finishes.
- **Settings model** (`src/types/settings.ts`): `alarmSoundType` → `focusSound` (`none|local|url|youtube`),
  `alarmVolume` → `chimeVolume`, `startStopSounds` → `controlChimes`, plus new `focusVolume` and
  `focusSoundDuringBreaks`. `migrateSettings()` upgrades stored settings from older builds.
- **Offscreen player** rewritten with two channels: cue (chimes + previews, reports status) and background
  (looping focus sound, fade-in, idempotent by source key, reports errors). YouTube loops via `seekTo` on ENDED.
  The `GET_PLAYER_STATE` message returns what's playing (diagnostics/tests).
- **Timer engine:** `syncFocusSound()` runs on start / pause / reset / phase change / settings save / worker
  restart. There's a self-heal check every 5 ticks, and a failed source isn't retried until play or settings change.
- **UI:** Settings → Chimes (themes with Start/Pause/Stop previews, chime volume, toggle) and Focus Sound
  (Off / file / URL / YouTube, volume, during-breaks toggle, 30 s preview). The Timer screen shows a
  "Focus sound: …" chip, or the error if it couldn't play.
- **Verified** in real Chromium with the unpacked build: 47 checks (migration; loop past end of file; pause/resume;
  continues into breaks; during-breaks toggle mid-break; reset; self-heal after the player is force-closed;
  all 15 chime previews; URL preview + bad URL; YouTube rule + offline error on the Timer screen; unsaved dialog).

## [2026-11-21] Blocker not working on an open YouTube tab

- **Cause:** Chrome/Edge don't run manifest content scripts in tabs that were already open when an extension is
  installed, updated or reloaded, and copies already in those tabs lose their extension connection. After
  reloading the new build, the open YouTube tab had no working blocker until it was refreshed.
- **Fix:** `injectIntoOpenTabs()` in `background.ts` (on `onInstalled`) injects `content.js` into all open http(s)
  tabs (new `scripting` permission, no extra install warning). `content.ts` is now wrapped in an IIFE with a
  `window.__focusflowBlocker.isAlive()` guard, so double injection is a no-op and a stale copy is replaced. The
  old top-level consts would have thrown "already declared" on re-injection.
- **Also:** media on a blocked page is paused and kept paused (a capturing `play` listener). A
  `useSiteAccess` hook plus `SiteAccessWarning` warns on the Timer/Blocklist screens when the browser
  withholds all-sites access (Edge "On click"/"specific sites"), with an "Allow on all sites" button.
- **Verified** (Chromium, unpacked build, youtube.com mapped to a local page): blocks/unblocks, other sites
  untouched, page media paused and kept paused, re-injection harmless, stale copy replaced: 13/13. The
  focus-sound suite is still 47/47. Not testable here: an actual extension reload (Chrome won't re-enable a
  reloaded unpacked extension under automation) and withheld site access (the API refuses to remove required
  permissions).

## [2026-11-21] Liquid glass UI + 6 color themes

- **Design system** (`src/index.css`): themes are CSS variables on `:root[data-theme]`. Tailwind's
  `--color-primary/secondary/tertiary` point to `--accent-1/2/3`, so existing `*-primary` classes became
  theme-aware. New glass utilities: `glass-panel`, `glass-bar`, `glass-bar-dense`, `glass-popover`,
  `glass-inset`, `liquid` (pointer highlight fed by `lib/liquid.ts`), plus `gradient-primary` with `--on-accent`
  text. Base styles give every button/tab/radio a spring press. There are view/pop/fade keyframes, drifting
  backdrop blobs, and reduced-motion support.
- **Rebuilt components:**
  - Header (glass bar, round glass icon buttons).
  - Floating glass tab bar with a sliding indicator.
  - Phase segmented control with a spring thumb that cross-fades phase colors.
  - Glass timer disc (gradient ring uses theme accents); glass control buttons; the play button is a tinted
    jewel with a breathing halo.
  - iOS Switch (knob stretches on press) and iOS slider.
  - Toast/dialog as glass sheets with pop-in; views glide in on tab change.
  - The two old inline toggles in Settings now use `Switch`.
- **Themes:** Default, Raspberries, Eko-Ile, Aurora, Ember, Graphite (`lib/themes.ts`, `settings.colorTheme`).
  - The draft theme previews live and reverts on Discard (`useSettings.loaded` prevents a default-theme flash
    before settings arrive).
  - The saved theme is cached in localStorage and applied in `main.tsx` before the first render.
  - The block-screen overlay reads `settings.colorTheme` and sets `--ff-*` variables (accents duplicated in
    `content.ts`).
- **Bug caught during review:** the bulk class-rewrite de-duplicated tokens inside every quoted string, which
  corrupted three SVG `rgba(255, 255, 255, …)` values in TimerDial (rendered as a yellow ring and black disc).
  Fixed; a HEAD-vs-tree scan confirmed no other string had duplicate tokens.
- **Verified:** screenshots of all 6 themes and Settings; regression suites 47/47 (sounds) and 13/13 (blocking);
  theme checks 4/4 (instant preview, saved, no flash on reopen, block screen themed).

## [2026-11-21] v1.1.0: Focus naming, Stats tab + gamification, versioning & release zip

- **Naming:** every user-facing "Pomodoro" is now "Focus" (phase tab, Focus Duration, notifications, block
  screen). Manifest name: "FocusFlow — Focus Timer & Site Blocker"; the description and the Settings footer
  mention the Pomodoro technique. Internal ids (`"pomodoro"` phase, `pomodoroDuration`) are unchanged for
  storage compatibility.
- **Stats data:** `src/types/stats.ts` (`focusStats` in storage.local: 120 days of history, lifetime totals,
  badges). `src/lib/gamification.ts` holds pure XP/level/streak/badge rules. `storageService` records with a
  serialized queue. `handlePhaseComplete` records the actual focused seconds (skip < 50% isn't a session). The
  content script sends `BLOCKED_ATTEMPT` (throttled 30s/page), which also fixes `blockedAttempts` never
  incrementing. `FOCUS_STATS_UPDATE` carries a `StatsEvent` for celebrations.
- **UI:** a Stats tab (4-tab bar) with a level card, goal ring, streak and blocked tiles, `FocusChart` (custom
  SVG built to the dataviz skill), a badge grid with locked-badge progress, and lifetime tiles. There's a
  `CelebrationOverlay` with confetti and a queue. `useFocusStats` raises XP toasts. Settings has a Daily Goal
  stepper (`WorkIntervalStepper` generalized). Per-theme `--chart-bar` colors were validated with the dataviz
  validator (all ≥3:1 vs the dark chart surface).
- **Release tooling:** `scripts/bump-version.mjs` (+ `version:*` scripts) keeps package.json and the manifest in
  sync. `build` = tsc + vite + `scripts/package.mjs` (fflate zip, forward slashes, excludes `_metadata`/maps,
  reproducible timestamps, fails on a version mismatch, keeps only the current zip). `CHANGELOG.md` added.
- **Verified:** gamification unit tests 18/18. Real-extension stats flow 19/19: a seeded month; a chart with
  tooltip, 30-day range and table; a real 1-minute session with a blocked site open → +36 XP toast; Goal Getter
  + Distraction Shield badges, then the goal celebration, then level-up to 4; storage totals exact.
  Regressions: sounds 47/47, blocking 13/13, themes 4/4.

# FocusFlow — Focus Timer & Site Blocker ⏳

FocusFlow (repo: `kavara-timer`) is a Chrome and Microsoft Edge extension from **Kavara Digital**. It's a focus
timer built on the **Pomodoro technique** (focus sessions separated by short and long breaks), with a website
blocker that keeps distracting sites closed while you focus, plus gamified stats that reward consistency. It runs in the
browser's **side panel** (toolbar icon, or `Ctrl+Shift+F` / `⌘+Shift+F`).


<img width="1280" height="800" alt="THE PROD" src="https://github.com/user-attachments/assets/8ce9e284-436c-4bb6-9e13-7de0641402c9" />


---

## Contents
1. [Features](#features)
2. [Folder structure](#folder-structure)
3. [Develop & build](#develop--build)
4. [How it works](#how-it-works)
5. [Publishing to Chrome Web Store & Edge Add-ons](#publishing-to-chrome-web-store--edge-add-ons)
6. [Roadmap](#roadmap)

---

## Features

### Timer
- **Focus / Short Break / Long Break** phases (the Pomodoro technique) with configurable durations (1–120 min) and a configurable number
  of focus sessions before a long break.
- **Auto-start next phase** (setting). When off, the timer waits for you to press play after each phase.
  After a long break it always waits, and a notification offers "Start New Focus Cycle".
- System notification when each phase ends.

### Sounds
FocusFlow has two independent sound channels, so a chime can play on top of background audio.

- **Chimes:** 5 built-in themes, each with a **start**, **pause** and **stop** chime, synthesized with WebAudio
  (no audio files, works offline): Classic Chime · Zen Bowl · Digital Alarm · Marimba · Crystal Bells.
  - Start plays when you press play, pause when you pause, and stop when you reset.
  - The stop chime **always** plays when a session finishes, because it's the "time's up" alarm.
  - The start/pause/reset chimes can be switched off. Chimes have their own volume.
- **Focus sound:** background audio that **loops while the timer is running**: an uploaded audio file (≤ 5 MB),
  an audio URL (Dropbox / Google Drive share links are converted to direct links), or a YouTube video
  (long mixes and live streams work well; `?t=` start times are supported).
  - It stops when you pause or reset, resumes when you press play, and fades in after the start chime.
  - It carries on through phase changes.
  - **Keep playing during breaks** (on by default) controls breaks; off means focus sessions only.
  - It has its own volume, and the Timer screen shows when it's playing (or why it couldn't play).
- Every chime and focus sound has a preview button that resets itself when the sound finishes.
  Focus sound previews are capped at 30 s.

### Blocking
- **Social Media Blocker**: a built-in list of social sites, toggled as a group.
- **Custom Blocker**: add your own domains (one per line). They can optionally be auto-categorized.
- Blocked sites show a full-page overlay with a live countdown during focus sessions (not during breaks).
  Video and audio on a blocked page are paused and kept paused while the block is up.
- Works in tabs that were already open when FocusFlow was installed or updated: the blocker is injected into
  every open tab right away.
- If the browser limits FocusFlow's **site access** (Edge: "On click" / "On specific sites"), the Timer and
  Blocklist screens warn that blocking is off and offer an **Allow on all sites** button.

### Stats & rewards (Stats tab)
- **Focus time chart:** minutes per day for the last 7 or 30 days, with the daily goal line, a tooltip per day
  (hover, tap or keyboard), and a table view. Below it: total, average per active day, and best day.
- **Daily goal ring:** focus sessions today vs your goal (Settings → Daily Goal, default 4).
- **Streak:** consecutive days with at least one focus session (plus your best ever).
- **XP & levels:**
  - +10 XP per focus session, +1 per focused minute, +25 for reaching the daily goal, and +2 per blocked
    distraction (max 20/day).
  - Levels go Spark → Kindle → Flicker → Flame → Blaze → … → Supernova, and each level needs 100 XP more than
    the last.
- **10 badges:** First Focus, Goal Getter, On Fire (3-day streak), Unstoppable (7-day streak), Deep Diver
  (6 sessions in a day), 10-Hour Club, Century (100 sessions), Distraction Shield (25 blocks), Early Bird and
  Night Owl. Locked badges show progress.
- **Celebrations:** an XP toast after each session, and a confetti card for daily goals, level-ups and new badges.
- **Fair play:**
  - A session skipped before it's half done earns only its minutes, not session XP.
  - Blocked-visit XP is capped per day and throttled per page.
  - "Clear All Metrics Now" clears history but never takes back XP, levels or badges.

### Look & feel
- **iOS-style "liquid glass" interface:**
  - Frosted, saturated glass panels with a bright top edge, over softly drifting color fields.
  - A light highlight that follows the cursor or finger.
  - Spring-back press animations on every control, and hover lift on cards and buttons.
  - A liquid thumb that slides between timer phases and between tabs.
  - iOS-style toggles (the knob stretches while pressed), sliders, and views that glide in when you switch.
  - Animations are reduced when the OS "reduce motion" setting is on.
- **6 color themes** (Settings → Appearance): Default, Raspberries, Eko-Ile (Lagos danfo yellow & lagoon teal),
  Aurora, Ember and Graphite.
  - A theme previews instantly, is kept when you save, and reverts if you discard.
  - It also colors the block screen on blocked sites.

### Settings & support
- Settings are edited as a draft. Leaving Settings with unsaved changes asks you to **Save / Discard /
  Keep editing**, and saving shows a "Settings saved" confirmation.
- Focus stats reset daily, weekly, monthly, or manually.
- **Send Feedback** form (header icon or Settings → Support), delivered to support@kavaradigital.com.

---

## Folder structure

```
kavara-timer/
├── public/
│   ├── icons/                  # 16 / 32 / 48 / 128 px icons
│   ├── manifest.json           # Manifest V3
│   └── offscreen.html          # Host page for the audio player
├── popup/index.html            # Side panel entry (Vite input)
├── scripts/
│   ├── package.mjs             # dist/ → release/focusflow-<version>.zip (runs after every build)
│   └── bump-version.mjs        # bumps package.json + manifest.json together
├── CHANGELOG.md
├── src/
│   ├── background/
│   │   ├── background.ts       # Service worker: port messages, alarms, notifications
│   │   ├── timerEngine.ts      # Timer state machine; chimes + focus-sound sync (syncFocusSound)
│   │   ├── offscreenManager.ts # Creates the offscreen player; YouTube Referer rule
│   │   ├── storageService.ts   # chrome.storage access, metrics auto-reset
│   │   ├── blockingEngine.ts   # No-op hooks (blocking is done by the content script)
│   │   └── notificationService.ts
│   ├── offscreen/
│   │   ├── offscreen.ts        # Two-channel player: chimes/previews + looping focus sound
│   │   └── synth.ts            # Chime theme recipes (WebAudio)
│   ├── content/content.ts      # Block overlay (Shadow DOM)
│   ├── popup/                  # Side panel React app (App.tsx, hooks/)
│   ├── components/
│   │   ├── timer/  stats/  blocklist/  settings/  feedback/  layout/
│   │   ├── layout/LiquidBackdrop.tsx  # drifting color fields behind the glass
│   │   ├── settings/ThemePicker.tsx   # Appearance swatches
│   │   └── ui/                 # Switch, UnsavedChangesDialog, Toast, SiteAccessWarning
│   ├── lib/
│   │   ├── gamification.ts     # XP, levels, streaks, badges (pure functions)
│   │   ├── themes.ts           # Color theme list + apply/remember helpers
│   │   ├── liquid.ts           # Pointer-following glass highlight (--mx/--my)
│   │   ├── soundThemes.ts      # Chime theme names / descriptions
│   │   ├── mediaUrls.ts        # YouTube link parsing, share-link → direct-link
│   │   ├── focusSourceKey.ts   # Stable id for a focus sound source
│   │   ├── feedback.ts         # Feedback delivery (FormSubmit)
│   │   ├── categoryDetector.ts
│   │   └── utils.ts
│   └── types/                  # settings, timer, blocklist, messages
├── PRIVACY.md                  # Privacy policy for the store listings
└── vite.config.ts
```

---

## Develop & build

Requires [Bun](https://bun.sh/) (or npm) and Node 20+.

```bash
bun install
bun run dev            # rebuilds dist/ on every change
bun run build          # type-check + build dist/ + release/focusflow-<version>.zip
bun run version:patch  # 1.1.0 → 1.1.1 (also version:minor / version:major)
```

**Versioning rule:** every change ships with a version bump (`version:patch` for fixes, `version:minor` for
features) and a line in `CHANGELOG.md`. The stores reject an upload whose version isn't higher than the live
one, and the build fails if `package.json` and `public/manifest.json` disagree.

**Load it in the browser:** open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**,
click **Load unpacked**, and pick the `dist/` folder. After rebuilding, press the reload icon on the extension card.

---

## How it works

- **The service worker is the source of truth.** `timerEngine.ts` owns the timer state and ticks it with
  `chrome.alarms`. The side panel connects over a long-lived port and receives state broadcasts.
- **All audio plays in an offscreen document**, because service workers can't play sound. It has two channels:
  a **cue** channel (chimes and Settings previews, one at a time) and a **background** channel (the looping
  focus sound). `offscreenManager.ts` creates the document on demand and recreates it if Chrome has closed it.
- **The focus sound follows the timer.** `syncFocusSound()` in `timerEngine.ts` runs on start, pause, reset,
  phase change, settings save and worker restart. It starts or stops the background channel based on the timer
  status, the phase, and the "during breaks" setting. It's idempotent: the same source keeps playing without
  restarting. While running, a check every 5 ticks restarts the player if Chrome closed it. A source that failed
  isn't retried until you press play again or change settings.
- **Sound status flows straight to the side panel.** The offscreen player sends `playing` / `ended` / `error`
  (with the expected length) via `chrome.runtime.sendMessage`, and the side panel listens directly. This
  doesn't go through the service worker, because Chrome stops the worker when idle and messages would be lost.
  A watchdog in `useSoundPreview` resets a preview button if the player goes silent.
- **YouTube:** Chrome sends no `Referer` from extension pages, and YouTube rejects embeds without one
  (error 153). A `declarativeNetRequest` session rule sets the Referer header only on YouTube embed frames
  requested by this extension. The player runs on `youtube-nocookie.com`, and FocusFlow uses the IFrame API
  messages to know when it starts and ends.
- **Blocker in already-open tabs:** Chrome/Edge only run manifest content scripts on page load, and copies in open
  tabs disconnect when the extension updates. `injectIntoOpenTabs()` (background.ts, on `onInstalled`)
  injects `content.js` into every open http(s) tab. `content.ts` runs inside an IIFE with a guard: a live copy
  makes a second injection exit, and a stale copy's overlay is removed and replaced.
- **Themes & glass:** `src/index.css` defines each theme as CSS variables on `:root[data-theme="…"]`
  (`--accent-1/2/3`, `--on-accent`, backgrounds, backdrop blobs, phase colors). Tailwind's `primary`/`secondary`
  tokens point at those variables, so `text-primary`, `bg-primary/10` and the rest follow the theme with no
  per-component code.
  - The glass materials are utilities: `glass-panel`, `glass-bar`, `glass-bar-dense`, `glass-popover`,
    `glass-inset`, `liquid` (interactive highlight) and `gradient-primary` (accent fill; text uses `--on-accent`).
  - Adding a theme means: a CSS block, an entry in `lib/themes.ts`, the id in `ColorThemeId`/`COLOR_THEME_IDS`,
    and its accents in `content.ts` (`THEME_COLORS`) for the block screen.
- **Settings drafts:** `useSettings` keeps a draft separate from the saved settings. `App.tsx` routes all
  navigation through one function that intercepts leaving Settings with unsaved changes.

---

## Publishing to Chrome Web Store & Edge Add-ons

```bash
bun run version:minor   # or version:patch
bun run build           # → release/focusflow-<version>.zip
```

Upload the same zip to the [Chrome Web Store dashboard](https://chrome.google.com/webstore/devconsole) and
[Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge). Bump the version
(`bun run version:patch|minor|major`) for every upload.

**Before the first release**
1. **Activate feedback emails.** Send one test feedback. FormSubmit emails an activation link to
   support@kavaradigital.com. Click it, or no feedback is delivered. You can then replace the address in
   `src/lib/feedback.ts` with the random alias FormSubmit gives you.
2. **Host `PRIVACY.md`** at a public URL and add it to both listings.
3. **Test YouTube sounds in real Chrome and Edge**, with a couple of videos.

**Permission justifications** (for the store forms)

| Permission | Why |
|---|---|
| `storage`, `unlimitedStorage` | Settings, blocklists, focus stats, uploaded alarm sound |
| `alarms` | Timer ticks while the side panel is closed |
| `notifications` | "Session complete" notices |
| `offscreen` | Playing chimes and the focus sound (service workers can't play audio) |
| `sidePanel` | The main interface |
| `scripting` | Adds the blocker to tabs that were already open when FocusFlow is installed or updated |
| `declarativeNetRequestWithHostAccess` | Sets the Referer header that YouTube requires on the extension's own YouTube focus-sound player |
| Host access / content script on all sites | Showing the block screen on blocklisted sites; loading focus sounds from user-provided URLs |

> **YouTube policy note:** YouTube's developer policies expect embedded players to be visible, and they
> restrict audio-only playback. FocusFlow plays the video in a hidden player while the timer runs. Mention the
> YouTube option in your listing. If a reviewer objects, remove `"youtube"` from `FOCUS_SOURCES` in
> `SoundSelector.tsx`.

---

## Roadmap
- Right-click (context menu) **"Use as FocusFlow focus sound"** on audio links and YouTube pages, to fill in
  the focus sound without copying and pasting.
- Snooze with a confirmation challenge for work-critical blocked pages.
- Focus history charts (daily and weekly).
- User-defined categories for custom blocked sites.

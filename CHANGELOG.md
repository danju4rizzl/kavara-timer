# Changelog

Every change ships with a version bump (`bun run version:patch|minor|major`) and an entry here.
The version in `package.json` and `public/manifest.json` must match; `bun run build` checks this.

## 1.1.0 — 2026-11-21

### Added
- **Stats tab** with a focus-time chart (7/30 days, goal line, tooltips, table view), a daily goal ring, streaks,
  and distractions-blocked counts.
- **Gamification:** XP, 12 named levels, 10 badges, and celebrations (an XP toast per session; confetti for
  daily goals, level-ups and badges).
- **Daily goal** setting (focus sessions per day).
- Blocked-site visits are now counted (they were tracked but never incremented).
- `version:patch|minor|major` scripts; `build` now also writes the store zip (pure-JS zip, forward-slash paths).
- Liquid glass UI and 6 color themes (Default, Raspberries, Eko-Ile, Aurora, Ember, Graphite).
- Focus sound (file / URL / YouTube) that loops while the timer runs; start/pause/stop chimes with 5 themes.
- Blocker injection into tabs that were already open; media on blocked pages is paused; site-access warning.
- Unsaved-settings prompt and "Settings saved" toast; Send Feedback form.

### Changed
- "Pomodoro" is now **"Focus"** throughout the UI. The store name is now "FocusFlow — Focus Timer & Site Blocker".
- A skipped focus session counts only the time actually focused, and counts as a session only if at least half
  was done.

### Fixed
- Layout: an unlayered CSS reset was overriding all Tailwind spacing.
- Settings that did nothing: auto-start next phase, the focus-stats reset schedule.
- Sound previews stuck on "Stop"; the audio URL preview playing the default chime.

## 1.0.0

- Initial version: Pomodoro timer, site blocker, side panel UI.

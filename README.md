# Kavara Timer ⏳

Kavara Timer (FocusFlow) is a premium, feature-rich Google Chrome extension built to optimize productivity. It combines a highly customizable Pomodoro Timer with an active, content-script-based website blocker to eliminate digital noise during active focus sessions.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Folder Structure](#folder-structure)
3. [Technology Stack & Build Process](#technology-stack--build-process)
4. [Installation Guide](#installation-guide)
5. [Key Design Patterns & Best Practices](#key-design-patterns--best-practices)
6. [Outstanding Features (Roadmap)](#outstanding-features-roadmap)

---

## Core Features

### 1. Pomodoro Timer
* **Phase Cycle**: Alternates seamlessly between **Focus Session**, **Short Break**, and **Long Break** phases.
* **Auto-Start Transitions**: Transitions automatically start the next phase during active sessions (Focus $\rightarrow$ Short Break $\rightarrow$ Focus) to preserve flow.
* **Long Break Prompt**: Pauses at the start of a new focus cycle after a long break completes. Prompts the user with a system notification containing a "Start New Focus Cycle" button.
* **Custom Alarms**: Supports audio alarms using default chime, local files, external audio URLs, or YouTube IDs, played through an offscreen document.
* **Focus Metrics**: Tracks total focus duration and block attempts. Clears automatically based on interval settings (daily, weekly, monthly, manual).

### 2. Website Blocker (In-Tab Overlay)
* **Glassmorphic Overlay**: Distracting websites are blocked by injecting an isolated Shadow DOM glassmorphic overlay containing a live countdown timer synced with the background worker.
* **FOUC Prevention**: Hides the target page's `<body>` element immediately during load before assets compile to prevent a flash of unblocked content.
* **Preset Social Media Blocker**: Always-active read-only list of 7 default social media domains (Facebook, Instagram, Twitter, X, YouTube, TikTok, Reddit). Individual preset domains cannot be edited or deleted; they are toggled as a group.
* **Custom Blocker**: Allows custom domain additions with real-time validation to prevent duplicates against presets and existing custom entries.

### 3. Developer Tools
* Includes a development-only reset button (visible only in `import.meta.env.DEV`) to instantly wipe all Chrome sync/local storage and restore defaults for testing.

---

## Folder Structure

```
kavara-timer/
├── public/                  # Static assets
│   ├── icons/               # Extension icons (16px, 32px, 48px, 128px)
│   └── manifest.json        # Extension Manifest V3 configuration
├── src/
│   ├── background/          # Background service worker and helpers
│   │   ├── background.ts    # Service worker port connections & message listener
│   │   ├── timerEngine.ts   # Core state transitions, alarms, and tick handlers
│   │   ├── storageService.ts# Storage interfaces for local/sync data
│   │   ├── offscreenManager.ts # Controls sound playback documents
│   │   ├── blockingEngine.ts# declarativeNetRequest rule management
│   │   └── notificationService.ts # System notification builder
│   ├── content/             # Injected scripts
│   │   └── content.ts       # Glassmorphic overlay injection and shadow DOM isolation
│   ├── popup/               # Extension Popup UI
│   │   ├── App.tsx          # Main React layout manager
│   │   ├── hooks/           # Custom React hooks (useTimerConnection, useSettings, useBlocklist)
│   │   └── index.html       # Popup HTML entrypoint
│   ├── components/          # Reusable React components
│   │   ├── layout/          # Header and navigation elements
│   │   ├── timer/           # Timer display and controls
│   │   ├── blocklist/       # Blocklist UI and domain validators
│   │   └── settings/        # Settings panels, duration cards, and volume controls
│   ├── types/               # TypeScript interfaces (settings, timer, messages)
│   └── lib/                 # Utility libraries (tailwind classes, category detector)
├── vite.config.ts           # Bundler config (Vite / Rollup)
└── tsconfig.json            # TypeScript configuration
```

---

## Technology Stack & Build Process

This extension is built on modern frontend patterns:
* **UI**: React 18 with TypeScript.
* **Styling**: Vanilla Tailwind CSS.
* **Bundler**: Vite + Rollup configured for multi-input Chrome Extension building.
* **Package Manager**: **Bun** (Preferred over NPM for speed and compatibility).

### Build Commands
Make sure you have [Bun](https://bun.sh/) installed:

```bash
# Install dependencies
bun install

# Run the extension dev server (Vite hot-reloading for Popup UI)
bun run dev

# Compile and package the extension (outputs to /dist)
bun run build
```

---

## Installation Guide

To load the compiled extension into Google Chrome:
1. Run `bun run build` to compile the codebase.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist`** directory located at the root of the project.
6. Pin the **Kavara Timer** extension to your toolbar.

---

## Key Design Patterns & Best Practices

### 1. Robust State Management
* The **background service worker** (`timerEngine.ts`) is the single source of truth for the timer state, running alarms, and phase configuration.
* Popup components connect to the service worker via long-lived `chrome.runtime.Port` connections. State updates are broadcasted to the popup in real-time, preventing state desynchronization when the popup closes.

### 2. React Controlled Input Buffering
* Form fields that change numbers (like durations) use a local string state (`localValues`) to store temporary keystrokes (e.g. empty inputs or backspaces) before validating and parsing them to an integer on `onBlur`. This prevents locked-input bugs.

### 3. Isolated DOM Blockers
* Content script overlays are built inside a closed **Shadow DOM** element (`#focusflow-block-overlay`). This isolates the blocker styling from the parent webpage, preventing styles from leaking or being overwritten by host page stylesheets.

---

## Outstanding Features (Roadmap)

The following features have been identified for future implementation:
* **Sync across Chrome accounts**: Support fully-synchronized lists and progress tracking across multiple browser sessions.
* **Custom Blocker Categories**: Allow users to classify custom blocked sites into personalized categories (e.g. "Work", "Distraction", "News").
* **Snooze Functionality**: Provide a 5-minute snooze option during focus mode for critical work pages, requiring confirmation challenges (such as typing a quote).
* **Pomodoro Stats Analytics**: Expand the metrics dashboard with bar charts showing daily/weekly focus trends using Canvas/SVG.

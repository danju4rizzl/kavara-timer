import type { BlockedSite } from "@/types/blocklist";
import type { TimerState } from "@/types/timer";

/*
 * The whole script runs inside one function so it can be injected more than
 * once into the same tab without "already declared" errors:
 *
 *  - Chrome/Edge do NOT run content scripts in tabs that were already open when
 *    FocusFlow was installed, updated or reloaded, and copies left in those tabs
 *    lose their connection to the extension. The service worker therefore
 *    re-injects this file into every open tab on install/update
 *    (see injectIntoOpenTabs in background.ts).
 *  - If a working copy is already running here, the new one exits. If the copy
 *    here is stale (from before an update), the new one removes its overlay and
 *    takes over.
 */
type BlockerWindow = Window & { __focusflowBlocker?: { isAlive: () => boolean } };

(() => {
  const win = window as BlockerWindow;
  if (win.__focusflowBlocker?.isAlive()) return;

  /*
   * Theme accents for the block screen. This mirrors src/index.css; it's
   * duplicated because content scripts can't import shared bundle chunks.
   */
  type OverlayColors = { a1: string; a2: string; bgTop: string; bgBottom: string };
  const DEFAULT_COLORS: OverlayColors = { a1: "#4f8cff", a2: "#8b5cf6", bgTop: "#1c1b4d", bgBottom: "#050914" };
  const THEME_COLORS: Record<string, OverlayColors> = {
    default: DEFAULT_COLORS,
    raspberries: { a1: "#f43f7f", a2: "#c026d3", bgTop: "#3b0a26", bgBottom: "#0b030a" },
    "eko-ile": { a1: "#fbbf24", a2: "#f97316", bgTop: "#2b2108", bgBottom: "#070604" },
    aurora: { a1: "#34d399", a2: "#22d3ee", bgTop: "#06302e", bgBottom: "#030a0f" },
    ember: { a1: "#fb7149", a2: "#ef4444", bgTop: "#3a1208", bgBottom: "#0a0403" },
    graphite: { a1: "#e4e4e7", a2: "#a1a1aa", bgTop: "#26272b", bgBottom: "#060607" },
  };

  // Remove anything a stale copy left behind.
  document.getElementById("focusflow-blocker-overlay-root")?.remove();
  document.getElementById("focusflow-hide-style")?.remove();
  document.documentElement.classList.remove("focusflow-blocked");

  // chrome.runtime.id becomes undefined once this copy is disconnected from the extension.
  win.__focusflowBlocker = { isAlive: () => Boolean(chrome.runtime?.id) };

  // Default social media list fallback
  const DEFAULT_SOCIAL_MEDIA_SITES: BlockedSite[] = [
    { id: "sm-fb", domain: "facebook.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-ig", domain: "instagram.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-tw", domain: "twitter.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-x", domain: "x.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-yt", domain: "youtube.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-tt", domain: "tiktok.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
    { id: "sm-rd", domain: "reddit.com", category: "Social Media", addedAt: 1719835200000, isActive: true },
  ];

  // 1. Instantly inject the global CSS hiding rule at document_start to avoid flash of unblocked content (FOUC).
  const hideStyle = document.createElement("style");
  hideStyle.id = "focusflow-hide-style";
  hideStyle.textContent = `
    html.focusflow-blocked body {
      display: none !important;
    }
    html.focusflow-blocked {
      background: #090d16 !important;
      overflow: hidden !important;
    }
  `;
  document.documentElement.appendChild(hideStyle);

  // 2. Setup the Shadow DOM container for the overlay
  const overlayRoot = document.createElement("div");
  overlayRoot.id = "focusflow-blocker-overlay-root";

  // We use basic inline styling on the host element so it positions itself correctly
  overlayRoot.style.position = "fixed";
  overlayRoot.style.top = "0";
  overlayRoot.style.left = "0";
  overlayRoot.style.width = "100vw";
  overlayRoot.style.height = "100vh";
  overlayRoot.style.zIndex = "2147483647";
  overlayRoot.style.display = "none";

  function applyOverlayTheme(themeId: unknown): void {
    const colors = (typeof themeId === "string" && THEME_COLORS[themeId]) || DEFAULT_COLORS;
    overlayRoot.style.setProperty("--ff-a1", colors.a1);
    overlayRoot.style.setProperty("--ff-a2", colors.a2);
    overlayRoot.style.setProperty("--ff-bg-top", colors.bgTop);
    overlayRoot.style.setProperty("--ff-bg-bottom", colors.bgBottom);
  }
  applyOverlayTheme("default");

  const shadow = overlayRoot.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(overlayRoot);

  // Inject styling inside shadow root
  const shadowStyle = document.createElement("style");
  shadowStyle.textContent = `
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, var(--ff-bg-top) 0%, var(--ff-bg-bottom) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #dae2fd;
      box-sizing: border-box;
      padding: 12px;
      overflow-y: auto;
    }
    .container {
      text-align: center;
      max-width: 440px;
      width: 90%;
      padding: 40px 30px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .shield {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ff-a1) 0%, var(--ff-a2) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px color-mix(in oklab, var(--ff-a1) 40%, transparent);
      margin-bottom: 24px;
      animation: float 4s ease-in-out infinite;
    }
    .shield svg {
      width: 36px;
      height: 36px;
      color: white;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, var(--ff-a1) 0%, var(--ff-a2) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: color-mix(in oklab, var(--ff-a1) 10%, transparent);
      border: 1px solid color-mix(in oklab, var(--ff-a1) 20%, transparent);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: var(--ff-a1);
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ff-a1);
      animation: pulse 2s ease-in-out infinite;
    }
    .timer {
      font-size: 58px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      margin-bottom: 16px;
      color: #ffffff;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
    }
    .message {
      font-size: 14px;
      line-height: 1.5;
      color: #94a3b8;
      margin: 0 0 32px 0;
      text-align: center;
    }
    button {
      padding: 12px 32px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }
    button:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    button:active {
      transform: translateY(0);
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.9); }
    }
    .button-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      width: 100%;
      margin-top: 8px;
    }
    button.btn-primary {
      background: linear-gradient(135deg, var(--ff-a1) 0%, var(--ff-a2) 100%);
      color: white;
      border: none;
      flex: 1;
    }
    button.btn-primary:hover {
      background: linear-gradient(135deg, var(--ff-a1) 0%, var(--ff-a2) 100%);
      box-shadow: 0 0 15px color-mix(in oklab, var(--ff-a1) 40%, transparent);
      border: none;
    }
    button.btn-danger {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      flex: 1;
    }
    button.btn-danger:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
      color: #ffffff;
    }
  `;
  shadow.appendChild(shadowStyle);

  // Create Overlay UI structure
  const overlayElement = document.createElement("div");
  overlayElement.className = "overlay";

  overlayElement.innerHTML = `
    <div class="container">
      <!-- Main Blocker View -->
      <div id="focusflow-main-view" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="shield">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1>Stay Focused</h1>
        <div class="badge">
          <span class="pulse-dot"></span>
          Focus Session Active
        </div>
        <div class="timer" id="focusflow-countdown">--:--</div>
        <p class="message">This site is blocked during your focus session.<br>Stay on track — you've got this!</p>
        <button id="focusflow-stop-btn">Stop focus session?</button>
      </div>

      <!-- Confirmation View -->
      <div id="focusflow-confirm-view" style="display: none; flex-direction: column; align-items: center; width: 100%;">
        <div class="shield" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); box-shadow: 0 0 35px rgba(239, 68, 68, 0.4);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h1>Stop Timer?</h1>
        <p class="message" style="margin-bottom: 24px;">Do you want to continue staying focused, or are you sure you want to stop the timer?</p>
        <div class="button-group">
          <button id="focusflow-continue-btn" class="btn-primary">Keep Focusing</button>
          <button id="focusflow-yes-stop-btn" class="btn-danger">Yes, Stop Timer</button>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(overlayElement);

  // Setup view toggle event handlers
  const mainView = shadow.getElementById("focusflow-main-view");
  const confirmView = shadow.getElementById("focusflow-confirm-view");
  const stopBtn = shadow.getElementById("focusflow-stop-btn");
  const continueBtn = shadow.getElementById("focusflow-continue-btn");
  const yesStopBtn = shadow.getElementById("focusflow-yes-stop-btn");

  if (stopBtn && mainView && confirmView) {
    stopBtn.addEventListener("click", () => {
      mainView.style.display = "none";
      confirmView.style.display = "flex";
    });
  }

  if (continueBtn && mainView && confirmView) {
    continueBtn.addEventListener("click", () => {
      confirmView.style.display = "none";
      mainView.style.display = "flex";
    });
  }

  if (yesStopBtn) {
    yesStopBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "STOP_TIMER" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error calling STOP_TIMER:", chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          console.log("Timer stopped successfully.");
          document.documentElement.classList.remove("focusflow-blocked");
          overlayRoot.style.display = "none";
          const mainViewEl = shadow.getElementById("focusflow-main-view");
          const confirmViewEl = shadow.getElementById("focusflow-confirm-view");
          if (mainViewEl && confirmViewEl) {
            mainViewEl.style.display = "flex";
            confirmViewEl.style.display = "none";
          }
        }
      });
    });
  }

  /*
   * Hiding the page doesn't stop its media: a YouTube video would keep playing
   * behind the block screen. While blocked, pause everything and pause anything
   * that tries to start (the capturing "play" listener catches autoplay and
   * YouTube's SPA navigations).
   */
  let isBlockedNow = false;

  // Each time a blocked site is put in front of the user during focus counts as a
  // "distraction blocked" (stats + a little XP). Throttled so reloads can't farm it.
  let lastReportedAt = 0;
  function reportBlockedAttempt(): void {
    const now = Date.now();
    if (now - lastReportedAt < 30_000) return;
    lastReportedAt = now;
    try {
      chrome.runtime.sendMessage({ type: "BLOCKED_ATTEMPT" }).catch(() => {});
    } catch {
      /* extension was updated; this copy is stale */
    }
  }
  function pauseAllMedia(): void {
    document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((media) => {
      if (!media.paused) media.pause();
    });
  }
  document.addEventListener(
    "play",
    (event) => {
      if (isBlockedNow && event.target instanceof HTMLMediaElement) event.target.pause();
    },
    true
  );

  // Helper to format remaining seconds to MM:SS
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Domain matching helper
  function isDomainBlocked(
    hostname: string,
    customSites: BlockedSite[],
    customActive: boolean,
    smSites: BlockedSite[],
    smActive: boolean
  ): boolean {
    const cleanHostname = hostname.toLowerCase();

    const isMatch = (domain: string) => {
      const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
      return cleanHostname === cleanDomain || cleanHostname.endsWith("." + cleanDomain);
    };

    // Check custom blocklist
    if (customActive && customSites.some((s) => s.isActive !== false && isMatch(s.domain))) {
      return true;
    }

    // Check social media preset blocklist
    if (smActive && smSites.some((s) => s.isActive !== false && isMatch(s.domain))) {
      return true;
    }

    return false;
  }

  // Main function to check block status and update overlay display
  function checkAndApplyBlocking(): void {
    try {
      chrome.storage.local.get(["timerState"], (localRes) => {
        if (chrome.runtime.lastError) return;

        chrome.storage.sync.get(
          ["blockedSites", "customBlockListActive", "socialMediaBlockerActive", "socialMediaBlockerSites", "settings"],
          (syncRes) => {
            if (chrome.runtime.lastError) return;

            const timerState = localRes.timerState as TimerState | undefined;
            const customSites = (syncRes.blockedSites as BlockedSite[]) ?? [];
            const customActive = syncRes.customBlockListActive !== false;
            const smActive = syncRes.socialMediaBlockerActive !== false;
            const smSites = (syncRes.socialMediaBlockerSites as BlockedSite[]) ?? DEFAULT_SOCIAL_MEDIA_SITES;
            applyOverlayTheme((syncRes.settings as { colorTheme?: string } | undefined)?.colorTheme);

            const isFocusRunning = timerState?.status === "running" && timerState?.phase === "pomodoro";
            const isBlocked = isDomainBlocked(window.location.hostname, customSites, customActive, smSites, smActive);

            if (isFocusRunning && isBlocked) {
              // Reset to main view state if the overlay is transitioning from hidden to visible
              if (overlayRoot.style.display !== "block") {
                const mainViewEl = shadow.getElementById("focusflow-main-view");
                const confirmViewEl = shadow.getElementById("focusflow-confirm-view");
                if (mainViewEl && confirmViewEl) {
                  mainViewEl.style.display = "flex";
                  confirmViewEl.style.display = "none";
                }
              }

              // Apply blocking styling to page and show overlay
              document.documentElement.classList.add("focusflow-blocked");
              overlayRoot.style.display = "block";
              if (!isBlockedNow) reportBlockedAttempt();
              isBlockedNow = true;
              pauseAllMedia();

              // Update countdown text
              const timerDiv = shadow.getElementById("focusflow-countdown");
              if (timerDiv && timerState?.remainingSeconds !== undefined) {
                timerDiv.textContent = formatTime(timerState.remainingSeconds);
              }
            } else {
              // Remove blocking styling and hide overlay (media stays paused; the user can resume it)
              isBlockedNow = false;
              document.documentElement.classList.remove("focusflow-blocked");
              overlayRoot.style.display = "none";
              const mainViewEl = shadow.getElementById("focusflow-main-view");
              const confirmViewEl = shadow.getElementById("focusflow-confirm-view");
              if (mainViewEl && confirmViewEl) {
                mainViewEl.style.display = "flex";
                confirmViewEl.style.display = "none";
              }
            }
          }
        );
      });
    } catch (error) {
      console.error("FocusFlow overlay checking failed:", error);
    }
  }

  // Initialize check
  checkAndApplyBlocking();

  // Listen to storage changes to dynamically apply/remove overlay
  chrome.storage.onChanged.addListener((_changes, namespace) => {
    if (namespace === "local" || namespace === "sync") {
      checkAndApplyBlocking();
    }
  });

  // Recheck and apply blocking when page is shown or becomes visible (e.g. BFCache restoration or tab switch)
  window.addEventListener("pageshow", () => {
    checkAndApplyBlocking();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkAndApplyBlocking();
    }
  });
})();

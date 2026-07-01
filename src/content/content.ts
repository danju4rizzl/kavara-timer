import type { BlockedSite } from "@/types/blocklist";
import type { TimerState } from "@/types/timer";

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
    background: radial-gradient(circle at center, #15203e 0%, #090d16 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #dae2fd;
    box-sizing: border-box;
  }
  .container {
    text-align: center;
    max-width: 440px;
    width: 90%;
    padding: 40px 30px;
    background: rgba(23, 31, 51, 0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
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
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 35px rgba(59, 130, 246, 0.4);
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
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    color: #60a5fa;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3b82f6;
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
`;
shadow.appendChild(shadowStyle);

// Create Overlay UI structure
const overlayElement = document.createElement("div");
overlayElement.className = "overlay";

overlayElement.innerHTML = `
  <div class="container">
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
    <p class="message">This site is blocked during your Pomodoro session.<br>Stay on track — you've got this!</p>
    <button id="focusflow-back-btn">Go Back</button>
  </div>
`;

shadow.appendChild(overlayElement);

// Setup "Go Back" button click handler
const backBtn = shadow.getElementById("focusflow-back-btn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If there is no back history (e.g., opened in a new tab), try closing the tab
      window.close();
    }
  });
}

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
        ["blockedSites", "customBlockListActive", "socialMediaBlockerActive", "socialMediaBlockerSites"],
        (syncRes) => {
          if (chrome.runtime.lastError) return;

          const timerState = localRes.timerState as TimerState | undefined;
          const customSites = (syncRes.blockedSites as BlockedSite[]) ?? [];
          const customActive = syncRes.customBlockListActive !== false;
          const smActive = syncRes.socialMediaBlockerActive !== false;
          const smSites = (syncRes.socialMediaBlockerSites as BlockedSite[]) ?? DEFAULT_SOCIAL_MEDIA_SITES;

          const isFocusRunning = timerState?.status === "running" && timerState?.phase === "pomodoro";
          const isBlocked = isDomainBlocked(window.location.hostname, customSites, customActive, smSites, smActive);

          if (isFocusRunning && isBlocked) {
            // Apply blocking styling to page and show overlay
            document.documentElement.classList.add("focusflow-blocked");
            overlayRoot.style.display = "block";

            // Update countdown text
            const timerDiv = shadow.getElementById("focusflow-countdown");
            if (timerDiv && timerState?.remainingSeconds !== undefined) {
              timerDiv.textContent = formatTime(timerState.remainingSeconds);
            }
          } else {
            // Remove blocking styling and hide overlay
            document.documentElement.classList.remove("focusflow-blocked");
            overlayRoot.style.display = "none";
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

/**
 * Feedback delivery.
 *
 * Submissions are POSTed to FormSubmit's AJAX endpoint, which emails them to
 * SUPPORT_EMAIL. No backend or API key is needed.
 *
 * ONE-TIME SETUP: the very first submission makes FormSubmit send an
 * activation email to SUPPORT_EMAIL. Click the link in it, otherwise no
 * feedback is delivered. After activating, FormSubmit also gives you a random
 * alias string; you can paste it into FEEDBACK_ENDPOINT in place of the email
 * address so the address isn't visible in the extension bundle.
 */
export const SUPPORT_EMAIL = "support@kavaradigital.com";
export const FEEDBACK_ENDPOINT = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;

export type FeedbackCategory = "bug" | "feature" | "general";

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  email?: string;
  rating?: number;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug report",
  feature: "Feature request",
  general: "General feedback",
};

function getDiagnostics() {
  const manifest = typeof chrome !== "undefined" ? chrome.runtime?.getManifest?.() : undefined;
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /Chrome\//.test(ua) ? "Google Chrome" : "Unknown";
  return {
    version: manifest?.version ?? "unknown",
    browser,
    userAgent: ua,
  };
}

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  const diagnostics = getDiagnostics();
  const categoryLabel = CATEGORY_LABELS[payload.category];

  const body: Record<string, string> = {
    _subject: `[FocusFlow ${diagnostics.version}] ${categoryLabel}`,
    _template: "table",
    _captcha: "false",
    Category: categoryLabel,
    Message: payload.message.trim(),
    Rating: payload.rating ? `${payload.rating} / 5` : "Not given",
    "Extension version": diagnostics.version,
    Browser: diagnostics.browser,
    "User agent": diagnostics.userAgent,
  };

  if (payload.email?.trim()) {
    // FormSubmit uses the `email` field as Reply-To.
    body.email = payload.email.trim();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
    const ok = response.ok && (data?.success === true || data?.success === "true");
    if (!ok) {
      throw new Error(data?.message || `Feedback service returned ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/** mailto: fallback used if the feedback service is unreachable. */
export function buildMailtoLink(payload: FeedbackPayload): string {
  const { version, browser } = getDiagnostics();
  const subject = `[FocusFlow ${version}] ${CATEGORY_LABELS[payload.category]}`;
  const body = `${payload.message.trim()}\n\n---\nVersion: ${version}\nBrowser: ${browser}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

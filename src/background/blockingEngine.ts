/**
 * Site blocking is enforced by the content script (src/content/content.ts),
 * which shows a full-page overlay on blocked sites during focus sessions.
 *
 * These hooks are kept so the timer engine has a single place to call when a
 * phase starts or stops. They intentionally do nothing at the network level.
 * (declarativeNetRequestWithHostAccess is only used by offscreenManager.ts to
 * fix YouTube embeds.)
 */
export async function enableBlocking(_domains: string[]): Promise<void> {}

export async function disableBlocking(): Promise<void> {}

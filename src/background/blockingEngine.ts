export async function enableBlocking(_domains: string[]): Promise<void> {
  // Clearing network-level blocking rules as blocking is handled via content script overlay.
  await disableBlocking();
}

export async function disableBlocking(): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: [],
    });
  }
}

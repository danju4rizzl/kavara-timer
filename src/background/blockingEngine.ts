const DYNAMIC_RULE_START_ID = 1000;

export async function enableBlocking(domains: string[]): Promise<void> {
  if (domains.length === 0) return;

  await disableBlocking();

  const addRules: chrome.declarativeNetRequest.Rule[] = domains.map((domain, index) => ({
    id: DYNAMIC_RULE_START_ID + index,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        extensionPath: "/blocked.html",
      },
    },
    condition: {
      urlFilter: `||${domain.replace(/^www\./, "")}`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [],
    addRules,
  });
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

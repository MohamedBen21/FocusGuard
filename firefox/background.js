const DEFAULT_SETTINGS = {
  reels: {
    youtube: true,
    tiktok: true,
    instagram: true,
    facebook: true
  },
  adult: {
    master: true
  },
  doomscroll: {
    threshold: 7,
    cooldownMinutes: 15,
    resetGapSeconds: 90
  }
};

async function hashHostname(hostname) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ADULT_SALT + hostname);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSettings() {
  const stored = await chrome.storage.local.get("settings");
  if (stored.settings) return stored.settings;
  await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const settings = await getSettings();
  if (!settings.adult || !settings.adult.master) return;

  let hostname;
  try {
    hostname = new URL(details.url).hostname.replace(/^www\./, "");
  } catch {
    return;
  }

  const h = await hashHostname(hostname);
  if (!ADULT_HASHES.has(h)) return;

  const blocked = chrome.runtime.getURL(
    `blocked.html?cat=adult&site=${encodeURIComponent(hostname)}`
  );
  chrome.tabs.update(details.tabId, { url: blocked });
});

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((r) => r.id),
      addRules: []
    });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
});
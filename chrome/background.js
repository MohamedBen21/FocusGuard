// ---------------------------------------------------------------------------
// FocusGuard background service worker
//
// Adult sites: hard-blocked at the network level via declarativeNetRequest.
// Reels/Shorts: NOT network-blocked anymore. They're allowed through, but
// content-reels.js watches how many play back-to-back and, past a threshold,
// writes a per-platform "blockedUntil" cooldown to storage. That cooldown is
// what content-reels.js checks before letting a reel page load. This lets a
// single link from a friend through, while still catching binge-scrolling.
// ---------------------------------------------------------------------------

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
    threshold: 7,        // reels watched back-to-back before cooldown kicks in
    cooldownMinutes: 15,  // how long the platform stays blocked afterward
    resetGapSeconds: 90   // pause longer than this and the streak resets
  }
};

// A curated list of well-known adult / pornography domains.
// Matched with DNR's "||domain^" syntax, which also covers all subdomains
// (e.g. "||pornhub.com^" blocks www.pornhub.com, es.pornhub.com, etc.)
const ADULT_DOMAINS = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "youporn.com", "tube8.com", "spankbang.com", "brazzers.com",
  "chaturbate.com", "livejasmin.com", "stripchat.com", "motherless.com",
  "redgifs.com", "thisvid.com", "xvideos2.com", "pornone.com", "txxx.com",
  "tnaflix.com", "drtuber.com", "beeg.com", "porn.com", "sex.com",
  "efukt.com", "hclips.com", "upornia.com", "porntrex.com", "eporner.com",
  "fapello.com", "onlyfans.com", "camsoda.com", "bongacams.com",
  "myfreecams.com", "cam4.com", "6streams.com", "pornbox.com",
  "xxxvideos.com", "javhd.com", "hentaihaven.xxx", "nhentai.net",
  "rule34.xxx", "8muses.com", "erome.com", "xmoviesforyou.co",
  "streamate.com", "adultfriendfinder.com", "ashemaletube.com"
];

const ADULT_RULE_ID_START = 100; // adult domain rules occupy 100..100+N

function buildAdultRules(adult) {
  if (!adult.master) return [];

  return ADULT_DOMAINS.map((domain, i) => ({
    id: ADULT_RULE_ID_START + i,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: `/blocked.html?cat=adult&site=${encodeURIComponent(domain)}` }
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ["main_frame"]
    }
  }));
}

async function applyRules(settings) {
  const newRules = buildAdultRules(settings.adult);

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: newRules
  });
}

async function getSettings() {
  const stored = await chrome.storage.local.get("settings");
  if (stored.settings) return stored.settings;
  await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await applyRules(settings);
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  await applyRules(settings);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes.settings) {
    await applyRules(changes.settings.newValue);
  }
});

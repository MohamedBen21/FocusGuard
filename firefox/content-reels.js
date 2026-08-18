(function () {
  const host = location.hostname;
  const PLATFORM = detectPlatform(host);
  if (!PLATFORM) return;

  const DEFAULT_SETTINGS = {
    reels: { youtube: true, tiktok: true, instagram: true, facebook: true },
    adult: { master: true },
    doomscroll: { threshold: 7, cooldownMinutes: 15, resetGapSeconds: 90 }
  };

  const SITE_LABEL = {
    youtube: "YouTube Shorts",
    tiktok: "TikTok",
    instagram: "Instagram Reels",
    facebook: "Facebook Reels"
  };

  function detectPlatform(h) {
    if (h.includes("youtube.com")) return "youtube";
    if (h.includes("tiktok.com")) return "tiktok";
    if (h.includes("instagram.com")) return "instagram";
    if (h.includes("facebook.com")) return "facebook";
    return null;
  }

  function inReelsContext() {
    const path = location.pathname;
    switch (PLATFORM) {
      case "youtube":
        return /\/shorts\//.test(path);
      case "tiktok":
        return !/^\/(login|messages|upload|about|business)/.test(path);
      case "instagram":
        return /\/reels?\//.test(path);
      case "facebook":
        return /\/reel(s)?(\/|$)/.test(path);
      default:
        return false;
    }
  }

  function currentReelId() {
    const path = location.pathname;
    let m;
    switch (PLATFORM) {
      case "youtube":
        m = path.match(/\/shorts\/([A-Za-z0-9_-]{6,})/);
        return m ? m[1] : null;
      case "tiktok":
        m = path.match(/\/video\/(\d+)/);
        return m ? m[1] : null;
      case "instagram":
        m = path.match(/\/reels?\/([A-Za-z0-9_-]{4,})/);
        return m ? m[1] : null;
      case "facebook":
        m = path.match(/\/reel\/(\d+)/);
        return m ? m[1] : null;
      default:
        return null;
    }
  }

  function redirectToBlocked(reason, blockedUntil) {
    const params = new URLSearchParams({
      cat: "doomscroll",
      reason,
      site: SITE_LABEL[PLATFORM],
      until: String(blockedUntil || 0)
    });
    const target = chrome.runtime.getURL(`blocked.html?${params.toString()}`);
    window.location.replace(target);
  }

  async function getStoredSettings() {
    const data = await chrome.storage.local.get(["settings", "doomscroll"]);
    return {
      settings: data.settings || DEFAULT_SETTINGS,
      doom: data.doomscroll || {}
    };
  }

  let evaluating = false;

  async function evaluate() {
    if (!inReelsContext()) return;
    if (evaluating) return;
    evaluating = true;
    try {
      const { settings, doom } = await getStoredSettings();
      if (!settings.reels[PLATFORM]) return;

      const cfg = settings.doomscroll || DEFAULT_SETTINGS.doomscroll;
      const state = doom[PLATFORM] || { count: 0, lastTs: 0, blockedUntil: 0, lastId: null };
      const now = Date.now();

      if (state.blockedUntil && now < state.blockedUntil) {
        redirectToBlocked("cooldown", state.blockedUntil);
        return;
      }

      const id = currentReelId();
      if (!id || id === state.lastId) return;

      const gapMs = now - (state.lastTs || 0);
      state.count = gapMs > cfg.resetGapSeconds * 1000 ? 1 : state.count + 1;
      state.lastId = id;
      state.lastTs = now;

      if (state.count >= cfg.threshold) {
        state.blockedUntil = now + cfg.cooldownMinutes * 60000;
        state.count = 0;
        doom[PLATFORM] = state;
        await chrome.storage.local.set({ doomscroll: doom });
        redirectToBlocked("threshold", state.blockedUntil);
        return;
      }

      doom[PLATFORM] = state;
      await chrome.storage.local.set({ doomscroll: doom });
    } finally {
      evaluating = false;
    }
  }

  function patchHistory() {
    const fire = () => setTimeout(evaluate, 0);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      origPush.apply(this, args);
      fire();
    };
    history.replaceState = function (...args) {
      origReplace.apply(this, args);
      fire();
    };
    window.addEventListener("popstate", fire);
  }
  patchHistory();

  document.addEventListener(
    "loadstart",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") evaluate();
    },
    true
  );
  document.addEventListener(
    "play",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") evaluate();
    },
    true
  );

  setInterval(evaluate, 700);
  evaluate();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.settings || changes.doomscroll)) {
      evaluate();
    }
  });
})();

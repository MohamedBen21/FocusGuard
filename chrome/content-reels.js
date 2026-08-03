// ---------------------------------------------------------------------------
// FocusGuard content script — smart doomscroll detection
//
// Reels/Shorts are allowed to load. Each reel gets an identifier extracted
// from the URL (its shortcode/video id) — every platform updates its address
// bar per reel, even TikTok/Instagram which sometimes preload or reuse
// <video> elements behind the scenes, which made video-load-event detection
// unreliable. Whenever the id changes we count it as a new reel watched.
//
// Streak logic:
//   - Each new reel within `resetGapSeconds` of the last one adds to the streak.
//   - A longer pause resets the streak to 1 (not consecutive anymore).
//   - Hitting `threshold` sets a `blockedUntil` cooldown and redirects to the
//     blocked page. While blockedUntil is active, any reel page on that
//     platform redirects immediately.
// ---------------------------------------------------------------------------

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

  // Is the current URL a reels/shorts context for this platform?
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

  // Extract the specific reel/video id from the URL, if present. Returns
  // null when we're on a reels-context page but no specific reel is loaded
  // yet (e.g. still on the bare /reels/ feed root).
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

  // Central check, called from every signal (URL change, video events,
  // periodic poll). Cheap no-op unless something actually changed.
  async function evaluate() {
    if (!inReelsContext()) return;
    if (evaluating) return; // avoid overlapping async runs racing each other
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
      if (!id || id === state.lastId) return; // no specific reel yet, or unchanged

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

  // --- Triggers ---------------------------------------------------------
  // 1) SPA navigation (pushState/replaceState/popstate) — the primary signal,
  //    since all four platforms update the URL per reel.
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

  // 2) Video element activity — a helpful extra nudge for platforms that
  //    update the URL a beat after (or before) the video actually starts.
  //    Harmless even if redundant: evaluate() only counts on an actual id
  //    change, so extra calls never double-count.
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

  // 3) Fast poll as a safety net — catches any id change the above signals
  //    miss (e.g. a feed that mutates the URL without a history API call).
  setInterval(evaluate, 700);

  // 4) Initial check on page load.
  evaluate();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.settings || changes.doomscroll)) {
      evaluate();
    }
  });
})();

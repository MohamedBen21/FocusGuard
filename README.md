# FocusGuard

A browser extension that blocks adult/porn websites, and keeps short-form
video feeds (YouTube Shorts, TikTok, Instagram Reels, Facebook Reels) from
turning into doomscrolling — without blocking them outright.

## Repo layout

This repo holds both browser builds side by side, since they share almost all
of their code and only differ in `manifest.json`:

```
focusguard/
├── chrome/     → Chrome, Brave, Edge, Opera, Vivaldi (Chromium-based)
├── firefox/    → Firefox 115+
├── LICENSE
└── README.md
```

## Install — Chrome / Brave / Edge / Opera / Vivaldi

1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`, etc.)
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `chrome/` folder from this repo.
5. Pin the extension so it's easy to reach.

## Install — Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select any file inside the `firefox/` folder (e.g. `manifest.json`).
4. Note: temporary add-ons in Firefox are removed when you restart the
   browser. A permanent install requires the extension to be signed by
   Mozilla (via `about:addons` → Debug Add-ons, or submitted to
   addons.mozilla.org).

## How it works

### Adult content — hard blocked
One switch blocks a curated list of 45+ well-known adult/porn sites at the
network level. There's no "allow once" for this category — visiting redirects
straight to a blocked page.

### Reels & Shorts — smart doomscroll limit
These are **not** blocked outright, so a link a friend sends you still opens
fine. Instead, each platform has its own switch and its own streak counter:

- Every reel is identified by its ID in the URL (all four platforms update
  the address bar per reel/video). A change in ID counts as a new reel watched.
- Watch reels back-to-back and once you hit your threshold (5–10, your
  choice, default 7), that platform pauses itself: a "take a break" screen
  shows up with a countdown, and the platform stays blocked until the
  cooldown (default 15 minutes, configurable) ends.
- Pause for more than 90 seconds between reels and the streak resets — so
  watching one video now and another an hour later never triggers it.
- The popup shows a live badge next to each platform (e.g. `4/7`) so you can
  see your streak building in real time, and a `cooldown 12m` badge while
  paused.

This applies independently to all four platforms — YouTube Shorts, TikTok,
Instagram Reels, and Facebook Reels each track their own streak.

## Notes & limitations

- Reel detection keys off the reel/video ID in the URL rather than video-load
  events, since some platforms preload or reuse `<video>` elements behind the
  scenes in ways that don't line up with what's actually on screen.
- Since this is a JS-based, self-managed limiter rather than a network-level
  block, a technically determined user could disable the extension to get
  around it — same as any personal focus tool. It's built to interrupt casual
  scrolling, not to be tamper-proof.
- The adult-sites list is a static, curated set of domains — it won't catch
  literally every adult site on the internet, but covers the large,
  high-traffic ones. Edit `ADULT_DOMAINS` near the top of `background.js` to
  add more.
- If a platform changes its page structure, the `inReelsContext()` and
  `currentReelId()` functions in `content-reels.js` are the place to update.

## File overview (per browser folder)

- `manifest.json` — extension configuration (Manifest V3; Chrome and Firefox
  versions differ slightly in the `background` and `browser_specific_settings`
  keys)
- `background.js` — builds the adult-site blocking rules
  (`declarativeNetRequest`); reels are not network-blocked here
- `content-reels.js` — detects new reels via their URL id, tracks the streak
  per platform in `chrome.storage.local`, and redirects to the blocked page
  once the threshold or an active cooldown is hit
- `popup.html` / `popup.css` / `popup.js` — the toolbar popup: category
  switches, per-platform live streak badges, and doomscroll threshold/cooldown
  settings
- `blocked.html` / `blocked.js` — the page shown when a site is blocked,
  including a live cooldown countdown for doomscroll blocks
- `icons/` — extension icons

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and share.

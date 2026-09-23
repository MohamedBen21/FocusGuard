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
One switch blocks a curated list of **1,678 domains across 80 adult-site
brands** at the network level — not just the `.com` version of each site, but
every alternate TLD mirror (`.tv`, `.net`, `.xxx`, `.to`, `.org`, and dozens
more) that the same brand operates or that clone sites use to route around
`.com`-only blocklists. There's no "allow once" for this category — visiting
redirects straight to a blocked page.

The list is built from
[Bon-Appetit/porn-domains](https://github.com/Bon-Appetit/porn-domains), a
large, actively maintained, deduplicated open-source blocklist (CC BY-SA
4.0), filtered down to real, well-formed domains for known adult-site brands.
Since the blocking rule matches a domain *and all its subdomains*
automatically (e.g. blocking `pornhub.com` already covers `de.pornhub.com`,
`api.pornhub.com`, etc.), the list only needed to add the separate
alternate-TLD domains, not subdomains.

**Search queries are covered too.** If a search on Google, Bing, DuckDuckGo,
Yahoo, Yandex, Baidu, Ecosia, Startpage, Brave Search, or Qwant contains the
name of one of the 81 tracked brands (`pornhub`, `xvideos`, etc.) — catching
someone searching for a mirror not yet in the domain list — FocusGuard
redirects before the results page loads. Matching is whole-word only, so it
won't trip on unrelated searches that happen to contain a similar substring
(tested against cases like "sex education," "same-sex marriage," and
"webcam repair," which all pass through untouched). This only runs while the
Adult Content switch is on.

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

## Design

The visual identity is built around a lighthouse beacon rather than the
generic shield-and-checkmark look most blocker extensions default to — a
steady, warm signal keeping watch, in keeping with the project's goal of
helping people stay present rather than policing them.

- **Palette:** deep night-sea navy (`#14212c`) with a brass/lantern-amber
  accent (`#d8a44a`), warm parchment text (`#ede3d0`), and muted pine-green /
  signal-flare-red for status states — chosen deliberately over the generic
  dark-mode-plus-neon-teal look common in AI-generated UI.
- **Type:** Libre Caslon Display for the wordmark and headings, IBM Plex Sans
  for UI text, IBM Plex Mono for counters and countdowns — all bundled
  locally as `.woff2` files (see `fonts/` in each build) so nothing is
  fetched over the network at runtime. All three are open-licensed (SIL OFL).
- **Icons:** a small hand-built line-icon set (compass, lock, hourglass,
  reel) rather than a generic icon font, kept consistent in stroke weight and
  style with the beacon mark.

## Notes & limitations

- Reel detection keys off the reel/video ID in the URL rather than video-load
  events, since some platforms preload or reuse `<video>` elements behind the
  scenes in ways that don't line up with what's actually on screen.
- Since this is a JS-based, self-managed limiter rather than a network-level
  block, a technically determined user could disable the extension to get
  around it — same as any personal focus tool. It's built to interrupt casual
  scrolling, not to be tamper-proof.
- The adult-sites list covers 80 brands and their alternate-TLD mirrors
  (1,678 domains total), sourced from a maintained open-source blocklist —
  see `ADULT_DOMAINS` near the top of `background.js` to review, add, or
  remove entries. It won't catch literally every adult site on the internet,
  since new mirror domains appear constantly, but it covers the large,
  high-traffic brands broadly.
- If a platform changes its page structure, the `inReelsContext()` and
  `currentReelId()` functions in `content-reels.js` are the place to update.

## File overview (per browser folder)

- `manifest.json` — extension configuration (Manifest V3; Chrome and Firefox
  versions differ slightly in the `background` and `browser_specific_settings`
  keys)
- `background.js` — builds the adult-site blocking rules
  (`declarativeNetRequest`); reels are not network-blocked here
- `content-search.js` — checks search-engine query parameters for blocked
  brand names and redirects before results load
- `content-reels.js` — detects new reels via their URL id, tracks the streak
  per platform in `chrome.storage.local`, and redirects to the blocked page
  once the threshold or an active cooldown is hit
- `popup.html` / `popup.css` / `popup.js` — the toolbar popup: category
  switches, per-platform live streak badges, and doomscroll threshold/cooldown
  settings
- `blocked.html` / `blocked.js` — the page shown when a site is blocked,
  including a live cooldown countdown for doomscroll blocks
- `icons/` — extension icons (beacon mark)
- `fonts/` — bundled local `.woff2` files and their OFL license

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and share.

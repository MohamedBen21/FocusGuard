const params = new URLSearchParams(location.search);
const site = params.get("site") || "This site";
const cat = params.get("cat") || "reels";
const reason = params.get("reason");
const until = parseInt(params.get("until") || "0", 10);

const titleEl = document.getElementById("title");
const msgEl = document.getElementById("message");
const countdownEl = document.getElementById("countdown");
const countdownLabelEl = document.getElementById("countdown-label");
const backBtn = document.getElementById("back-btn");
const card = document.getElementById("main-card");
const shield = document.getElementById("shield-icon");
const pill = document.getElementById("category-pill");

function fmt(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

if (cat === "doomscroll") {
  card.classList.add("card--break");
  shield.classList.add("shield--break");
  shield.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l9 16H3L12 3Z" fill="rgba(245,158,11,0.1)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="0.9" fill="currentColor"/>
  </svg>`;
  pill.textContent = reason === "threshold" ? "Take a Break" : "Still Cooling Down";
  pill.classList.add("pill--break");
  titleEl.textContent = reason === "threshold" ? "Time for a break" : "Still on cooldown";
  msgEl.innerHTML = reason === "threshold"
    ? `You've watched several <span class="hl">${site}</span> reels back to back. FocusGuard paused this platform so it doesn't turn into a scroll hole.`
    : `<span class="hl">${site}</span> is still cooling down from your last scrolling streak.`;

  if (until > 0) {
    countdownEl.classList.add("visible");
    countdownLabelEl.classList.add("visible");
    const tick = () => {
      const remaining = until - Date.now();
      if (remaining <= 0) {
        countdownEl.textContent = "0:00";
        countdownLabelEl.textContent = "You can go back now";
        clearInterval(timer);
        return;
      }
      countdownEl.textContent = fmt(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);
  }
} else if (cat === "adult") {
  card.classList.add("card--adult");
  shield.classList.add("shield--adult");
  shield.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5L4.5 5.8v5.8C4.5 16.6 7.7 21 12 22.5c4.3-1.5 7.5-5.9 7.5-10.9V5.8L12 2.5Z" fill="rgba(239,68,68,0.1)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
  pill.textContent = "Adult Content Blocked";
  pill.classList.add("pill--adult");
  titleEl.textContent = "Access blocked";
  msgEl.innerHTML = `<span class="hl">${site}</span> is blocked by FocusGuard's adult content filter. You can turn this off anytime from the extension icon.`;
} else {
  pill.textContent = "Site Blocked";
  titleEl.textContent = "This page is blocked";
  msgEl.innerHTML = `<span class="hl">${site}</span> is currently blocked by FocusGuard. You can turn this off anytime from the extension icon.`;
}

backBtn.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    location.href = "https://www.google.com";
  }
});

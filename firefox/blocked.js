const params = new URLSearchParams(location.search);
const site = params.get("site") || "This site";
const cat = params.get("cat") || "reels";
const reason = params.get("reason");
const until = parseInt(params.get("until") || "0", 10);

const titleEl = document.getElementById("title");
const msgEl = document.getElementById("message");
const countdownEl = document.getElementById("countdown");
const backBtn = document.getElementById("back-btn");

function fmt(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

if (cat === "doomscroll") {
  titleEl.textContent = reason === "threshold" ? "Time for a break" : "Still cooling down";
  msgEl.innerHTML =
    reason === "threshold"
      ? `You've watched several <span class="hl">${site}</span> reels back to back. FocusGuard paused this platform so it doesn't turn into a scroll hole.`
      : `<span class="hl">${site}</span> is still cooling down from your last scrolling streak.`;

  if (until > 0) {
    countdownEl.style.display = "block";
    const tick = () => {
      const remaining = until - Date.now();
      if (remaining <= 0) {
        countdownEl.textContent = "You can go back now";
        clearInterval(timer);
        return;
      }
      countdownEl.textContent = `Back in ${fmt(remaining)}`;
    };
    tick();
    const timer = setInterval(tick, 1000);
  }
} else if (cat === "adult") {
  titleEl.textContent = "This page is blocked";
  msgEl.innerHTML =
    reason === "search"
      ? `Your search included <span class="hl">${site}</span>, a term FocusGuard blocks. You can turn this off anytime from the extension icon.`
      : `<span class="hl">${site}</span> is blocked by FocusGuard's adult content filter. You can turn this off anytime from the extension icon.`;
} else {
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

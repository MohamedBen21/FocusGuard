const DEFAULT_SETTINGS = {
  reels: { youtube: true, tiktok: true, instagram: true, facebook: true },
  adult: { master: true },
  doomscroll: { threshold: 7, cooldownMinutes: 15, resetGapSeconds: 90 }
};

const PLATFORMS = ["youtube", "tiktok", "instagram", "facebook"];

const reelsMaster = document.getElementById("reels-master");
const adultMaster = document.getElementById("adult-master");
const siteInputs = Array.from(document.querySelectorAll('input[data-group="reels"]'));
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const thresholdSelect = document.getElementById("doom-threshold");
const cooldownSelect = document.getElementById("doom-cooldown");

let settings = DEFAULT_SETTINGS;
let doomState = {};

function reelsAllOn(r) {
  return r.youtube && r.tiktok && r.instagram && r.facebook;
}
function reelsAllOff(r) {
  return !r.youtube && !r.tiktok && !r.instagram && !r.facebook;
}

function populateSelects() {
  thresholdSelect.innerHTML = "";
  for (let n = 5; n <= 10; n++) {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    thresholdSelect.appendChild(opt);
  }
  cooldownSelect.innerHTML = "";
  [5, 10, 15, 20, 30, 45, 60].forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = `${m} min`;
    cooldownSelect.appendChild(opt);
  });
}

function render() {
  siteInputs.forEach((input) => {
    input.checked = !!settings.reels[input.dataset.site];
  });
  reelsMaster.checked = reelsAllOn(settings.reels);
  adultMaster.checked = !!settings.adult.master;
  thresholdSelect.value = settings.doomscroll.threshold;
  cooldownSelect.value = settings.doomscroll.cooldownMinutes;
  updateStatus();
  renderStreaks();
}

function renderStreaks() {
  const now = Date.now();
  PLATFORMS.forEach((p) => {
    const el = document.getElementById(`streak-${p}`);
    if (!el) return;
    const state = doomState[p];
    el.classList.remove("streak--warn", "streak--cooldown");

    if (!settings.reels[p] || !state) {
      el.textContent = "";
      return;
    }
    if (state.blockedUntil && state.blockedUntil > now) {
      const mins = Math.ceil((state.blockedUntil - now) / 60000);
      el.textContent = `cooldown ${mins}m`;
      el.classList.add("streak--cooldown");
      return;
    }
    if (state.count > 0) {
      el.textContent = `${state.count}/${settings.doomscroll.threshold}`;
      if (state.count >= settings.doomscroll.threshold - 2) {
        el.classList.add("streak--warn");
      }
      return;
    }
    el.textContent = "";
  });
}

function updateStatus() {
  const allOn = reelsAllOn(settings.reels) && settings.adult.master;
  const allOff = reelsAllOff(settings.reels) && !settings.adult.master;

  statusText.classList.remove("status--partial", "status--off");
  statusDot.classList.remove("status--partial", "status--off");

  if (allOn) {
    statusText.textContent = "All protections active";
  } else if (allOff) {
    statusText.textContent = "All protections off";
    statusText.classList.add("status--off");
    statusDot.classList.add("status--off");
  } else {
    statusText.textContent = "Some protections off";
    statusText.classList.add("status--partial");
    statusDot.classList.add("status--partial");
  }
}

function saveSettings() {
  chrome.storage.local.set({ settings });
}

reelsMaster.addEventListener("change", () => {
  const val = reelsMaster.checked;
  settings.reels = { youtube: val, tiktok: val, instagram: val, facebook: val };
  render();
  saveSettings();
});

adultMaster.addEventListener("change", () => {
  settings.adult.master = adultMaster.checked;
  render();
  saveSettings();
});

siteInputs.forEach((input) => {
  input.addEventListener("change", () => {
    settings.reels[input.dataset.site] = input.checked;
    render();
    saveSettings();
  });
});

thresholdSelect.addEventListener("change", () => {
  settings.doomscroll.threshold = parseInt(thresholdSelect.value, 10);
  saveSettings();
});

cooldownSelect.addEventListener("change", () => {
  settings.doomscroll.cooldownMinutes = parseInt(cooldownSelect.value, 10);
  saveSettings();
});

function loadAll() {
  chrome.storage.local.get(["settings", "doomscroll"], (data) => {
    settings = data.settings || DEFAULT_SETTINGS;
    if (!settings.doomscroll) settings.doomscroll = DEFAULT_SETTINGS.doomscroll;
    doomState = data.doomscroll || {};
    if (!data.settings) chrome.storage.local.set({ settings });
    populateSelects();
    render();
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.doomscroll) doomState = changes.doomscroll.newValue || {};
  if (changes.settings) settings = changes.settings.newValue || settings;
  render();
});

loadAll();
setInterval(renderStreaks, 1000);

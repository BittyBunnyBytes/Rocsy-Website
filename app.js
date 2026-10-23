"use strict";

const REPO = "BittyBunnyBytes/Rocsy";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const announce = (text) => { const live = $("#announce"); if (live) live.textContent = text; };

// Mobile menu
const toggle = $(".menu-toggle");
const nav = $("#site-nav");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
$$("#site-nav a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
}));

// Latest release: version, size and a direct link to the installer file.
// Without the API (offline, rate limit) the links keep pointing at the releases page.
async function loadRelease() {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) return;
    const release = await response.json();
    const asset = (release.assets || []).find((item) => /installer\.tar\.gz$/.test(item.name));
    $$("[data-release-tag]").forEach((node) => { node.textContent = release.tag_name; });
    if (asset) {
      $$("[data-download]").forEach((link) => { link.href = asset.browser_download_url; });
      $$("[data-asset-name]").forEach((node) => { node.textContent = asset.name; });
      const size = (asset.size / 1048576).toFixed(1);
      const date = new Date(release.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      $$("[data-release-meta]").forEach((node) => {
        node.textContent = `${release.tag_name} · ${size} MB · ${date} · Linux · Apache-2.0 · Windows via WSL2 (untested)`;
      });
    }
  } catch {
    /* keep the static fallback */
  }
}
loadRelease();

// Install tabs (arrow keys move between them)
const tabs = $$('[role="tab"]');
function selectTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(`#${item.getAttribute("aria-controls")}`).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

// Copy buttons
$$(".copy").forEach((button) => button.addEventListener("click", async () => {
  const text = $("code", button.parentElement).textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    announce("Commands copied");
  } catch {
    button.textContent = "Select";
  }
  setTimeout(() => { button.textContent = "Copy"; }, 1600);
}));

$$(".copy-inline").forEach((button) => button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = "Copied";
    announce("Install command copied");
  } catch {
    button.textContent = "Select";
  }
  setTimeout(() => { button.textContent = "Copy"; }, 1600);
}));

// Hero queue: an illustration that cycles through example jobs.
const EXAMPLES = [
  ["t-video", "Video", "Ocean cliffs at dusk · 10 s"],
  ["t-image", "Image", "Poster, 4 variations"],
  ["t-music", "Music", "Lo-fi loop · 2 min"],
  ["t-voice", "Voice", "Narrator line · 12 s"],
  ["t-video", "Video", "Paper boat in the rain · 2 clips"],
  ["t-image", "Image", "Product shot on marble"],
];
const list = $("#mock-jobs");
let nextExample = 3;
let progress = 0;

function row([tagClass, tag, job], running) {
  const item = document.createElement("li");
  if (running) item.className = "running";
  item.innerHTML = `<span class="tag ${tagClass}">${tag}</span><span class="job"></span><span class="state">${running ? "rendering" : "waiting"}</span>`
    + (running ? '<span class="bar"><i></i></span>' : "");
  $(".job", item).textContent = job;
  return item;
}

function tick() {
  if (!list || document.hidden) return;
  const bar = $(".running .bar i", list);
  progress = Math.min(100, progress + 4 + Math.random() * 6);
  if (bar) bar.style.width = `${progress}%`;
  if (progress < 100) return;
  const done = $(".running", list);
  done.classList.add("leaving");
  setTimeout(() => {
    done.remove();
    const first = list.firstElementChild;
    if (first) {
      first.classList.add("running");
      $(".state", first).textContent = "rendering";
      first.insertAdjacentHTML("beforeend", '<span class="bar"><i></i></span>');
    }
    list.append(row(EXAMPLES[nextExample % EXAMPLES.length], false));
    nextExample += 1;
    progress = 0;
  }, 400);
}

if (list && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(tick, 260);
} else if (list) {
  const bar = $(".running .bar i", list);
  if (bar) bar.style.width = "60%";
}

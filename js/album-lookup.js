import { DEFAULT_CARDS, SET0, blankCard, clearSession, loadSession, persistSession } from "./storage.js?v=phase10";
import { populateThemeSelect } from "./themes.js?v=phase10";
import { FONTCSS, injectFonts } from "./fonts.js?v=phase10";
import { processImageFile, processImageUrl } from "./image-utils.js?v=phase10";
import { CW, abbr, computeLayout, hueOf, renderCard } from "./svg-engine.js?v=phase10";
import { rasterizeSvg, triggerDownload } from "./export.js?v=phase10";
import { bindTapTooltips, hydrateIcons } from "./icons.mjs?v=phase10";
import {
  ALBUM_LOOKUP_CONFIG,
  fetchAlbumCoverArt,
  searchOnlineAlbums
} from "./album-lookup-providers.mjs?v=phase10";

const $ = id => document.getElementById(id);
const MAX_CARDS = 300;

let activeResults = [];
let selectedMatchId = "";
let draftCover = null; // { img, imgUrl, corsLimited, h, s, iw, ih }
let lastTransfer = null;
let sessionState = { existing: null, cards: DEFAULT_CARDS.map(c => ({ ...c })), count: DEFAULT_CARDS.length, settings: undefined };
let lastSearchQuery = "";

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function setStatus(text, { showRetry = false } = {}) {
  $("alb-status").textContent = text;
  $("alb-recovery").hidden = !showRetry;
}

function setBusy(busy) {
  $("alb-search-btn").disabled = busy || !ALBUM_LOOKUP_CONFIG.enabled;
  $("alb-search-btn").setAttribute("aria-busy", String(busy));
}

function buildAlbumCardObject() {
  const rawTitle = $("alb-title").value.trim();
  const rawArtist = $("alb-artist-field").value.trim();
  const title = rawTitle || "Album Name";
  const loc = rawArtist || "Artist Name";
  const year = $("alb-year").value.trim() || "2026";
  const code = $("alb-code").value.trim() || abbr(rawArtist || rawTitle || loc);
  return {
    ...blankCard(),
    kind: "album",
    title,
    genre: "",
    loc,
    year,
    code,
    h: draftCover?.h ?? hueOf(title),
    s: draftCover?.s ?? 0.72,
    ...(draftCover || {})
  };
}

function renderAlbumSvg({ embeddedFonts = false } = {}) {
  const card = buildAlbumCardObject();
  const layout = computeLayout(sessionState.settings?.paper || "a4", sessionState.settings?.cardSize || "ticket");
  const style = $("alb-theme").value || sessionState.settings?.style || "cream";
  const inner = renderCard(card, 0, {
    ...SET0,
    ...(sessionState.settings || {}),
    lay: layout,
    style,
    themeForce: style,
    one: true,
    drag: false,
    cropMarks: false,
    moveStamps: false
  });
  const ch = layout.CH || 239;
  const defsFonts = embeddedFonts ? `<defs><style>${FONTCSS}</style></defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 ${CW + 12} ${ch + 12}" width="${(CW + 12) * 3}" height="${(ch + 12) * 3}">${defsFonts}<rect x="-6" y="-6" width="${CW + 12}" height="${ch + 12}" fill="#fff"/>${inner}</svg>`;
}

function refreshLivePreview() {
  const box = $("alb-svg-preview");
  if (box) box.innerHTML = renderAlbumSvg({ embeddedFonts: false });
}

function syncDraftCoverUi() {
  const thumb = $("alb-thumb");
  const clearBtn = $("alb-clear-cover");
  const statusEl = $("alb-photo-status");
  const src = draftCover?.img || draftCover?.imgUrl || "";
  if (src) {
    thumb.textContent = "";
    thumb.style.backgroundImage = `url(${JSON.stringify(String(src))})`;
    clearBtn.hidden = false;
    statusEl.textContent = draftCover.corsLimited
      ? "Cover ready (host limits canvas pixel reads — uses default accent)."
      : "Cover ready with sampled accent color.";
  } else {
    thumb.style.backgroundImage = "";
    thumb.textContent = "No cover art";
    clearBtn.hidden = true;
    statusEl.textContent = "";
  }
  refreshLivePreview();
}

function populateDraftFromAlbum(item) {
  selectedMatchId = item.id;
  $("alb-title").value = item.albumName || "";
  $("alb-artist-field").value = item.artistName || "";
  $("alb-year").value = item.year || "";
  delete $("alb-code").dataset.manual;
  $("alb-code").value = item.code || abbr(item.artistName || item.albumName || "");
  $("alb-source-pill").hidden = false;
  $("alb-source-pill").textContent = item.licenseNote || item.source || "";
  renderResults();
  refreshLivePreview();
}

function renderResults() {
  $("alb-match-count").textContent = activeResults.length;
  const container = $("alb-results");
  if (!activeResults.length) {
    container.innerHTML = lastSearchQuery
      ? `<p class="hint">No album matches found for “${escapeHtml(lastSearchQuery)}”. Edit your query or try Wikipedia fallback.</p>`
      : `<p class="hint">Enter an album name above and click Search albums.</p>`;
    return;
  }
  container.innerHTML = activeResults.map(item => {
    const selected = item.id === selectedMatchId;
    const metaBits = [item.artistName, item.year, item.releaseType].filter(Boolean).join(" · ");
    return `
      <button type="button" class="lookup-result-card${selected ? " is-selected" : ""}" data-match-id="${escapeHtml(item.id)}" aria-pressed="${selected}">
        <div class="lookup-result-top">
          <strong>${escapeHtml(item.albumName)}</strong>
          <span class="lookup-pill">${escapeHtml(item.source)}${item.score ? ` · ${item.score}%` : ""}</span>
        </div>
        ${item.disambiguation ? `<div class="lookup-result-sub">${escapeHtml(item.disambiguation)}</div>` : ""}
        <div class="lookup-result-meta">${escapeHtml(metaBits || "Click to load album details")}</div>
      </button>`;
  }).join("");
}

async function runAlbumSearch(overrideProvider = null) {
  if (!ALBUM_LOOKUP_CONFIG.enabled) return;
  const query = $("alb-query").value.trim();
  const artist = $("alb-artist").value.trim();
  if (!query) {
    setStatus("Type an album name before searching.");
    $("alb-query").focus();
    return;
  }
  if (overrideProvider) $("alb-provider").value = overrideProvider;
  const provider = $("alb-provider").value || "musicbrainz";
  lastSearchQuery = query;
  setBusy(true);
  setStatus(`Searching ${provider === "wikipedia" ? "Wikipedia" : "MusicBrainz"} albums for “${query}”…`);
  try {
    const res = await searchOnlineAlbums(query, { artist, provider });
    activeResults = res.results;
    renderResults();
    if (!res.results.length) {
      setStatus(`No albums matched “${query}”.`, { showRetry: true });
    } else {
      setStatus(`Found ${res.results.length} album candidate${res.results.length === 1 ? "" : "s"}${res.fromCache ? " (cached)" : ""}.`);
      populateDraftFromAlbum(res.results[0]);
    }
  } catch (err) {
    activeResults = [];
    renderResults();
    setStatus(err instanceof Error ? err.message : "Album lookup failed.", { showRetry: true });
  } finally {
    setBusy(false);
  }
}

async function fetchCoverArt() {
  const albumName = $("alb-title").value.trim() || $("alb-query").value.trim();
  const artistName = $("alb-artist-field").value.trim() || $("alb-artist").value.trim();
  const match = activeResults.find(r => r.id === selectedMatchId);
  if (!albumName && !match?.mbid) {
    $("alb-photo-status").textContent = "Enter or select an album first.";
    return;
  }
  const btn = $("alb-fetch-cover");
  btn.disabled = true;
  $("alb-photo-status").textContent = "Checking Cover Art Archive / Wikipedia for album artwork…";
  try {
    const found = await fetchAlbumCoverArt({
      mbid: match?.mbid || "",
      albumName,
      artistName,
      wikiPageTitle: match?.wikiPageTitle || ""
    });
    if (!found || !found.coverUrl) {
      $("alb-photo-status").textContent = "No cover art found online. Paste a direct URL or upload an image.";
      return;
    }
    $("alb-url").value = found.coverUrl;
    await loadCoverUrl(found.coverUrl, found.licenseNote);
  } catch (err) {
    $("alb-photo-status").textContent = err instanceof Error ? err.message : "Could not load cover art.";
  } finally {
    btn.disabled = false;
  }
}

async function loadCoverUrl(url, note = "") {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return;
  try {
    const imgData = await processImageUrl(cleanUrl);
    draftCover = { ...imgData, imgUrl: cleanUrl };
    syncDraftCoverUi();
    if (note) $("alb-photo-status").textContent += ` (${note})`;
  } catch {
    draftCover = { img: cleanUrl, imgUrl: cleanUrl, corsLimited: true };
    syncDraftCoverUi();
    if (note) $("alb-photo-status").textContent += ` ${note}`;
  }
}

async function refreshSheetPreview() {
  const existing = await loadSession();
  const cards = Array.isArray(existing?.cards) && existing.cards.length
    ? existing.cards
    : DEFAULT_CARDS.map(c => ({ ...c }));
  const count = Math.max(1, Math.min(MAX_CARDS, Number(existing?.count) || cards.length));
  sessionState = { existing, cards, count, settings: existing?.settings };
  if (sessionState.settings?.style && $("alb-theme").querySelector(`option[value="${CSS.escape(sessionState.settings.style)}"]`)) {
    $("alb-theme").value = sessionState.settings.style;
  }

  $("alb-sheet-count").textContent = count;
  const sel = $("alb-fill-target");
  const prev = sel.value;
  sel.innerHTML = Array.from({ length: count }, (_, idx) => {
    const c = cards[idx] || {};
    return `<option value="${idx}">Card ${idx + 1} · ${escapeHtml(c.title || "Untitled")}${c.kind === "album" ? " [Album]" : ""}</option>`;
  }).join("");
  if (prev && Number(prev) < count) sel.value = prev;

  $("alb-sheet-list").innerHTML = cards.slice(0, count).map((c, idx) => `
    <div class="lookup-sheet-item">
      <strong>#${idx + 1}</strong>
      <span>${escapeHtml(c.title || "Untitled")}</span>
      <span class="hint">${escapeHtml([c.kind === "album" ? "Album" : c.genre, c.loc, c.year].filter(Boolean).join(" · ") || "Empty")}</span>
    </div>`).join("");
  refreshLivePreview();
}

async function commitAddAsNew() {
  const title = $("alb-title").value.trim();
  if (!title) {
    setStatus("Enter an Album name before adding to the sheet.");
    $("alb-title").focus();
    return;
  }
  await refreshSheetPreview();
  if (sessionState.count >= MAX_CARDS) {
    setStatus(`Your sheet already has the maximum ${MAX_CARDS} cards.`);
    return;
  }
  const active = sessionState.cards.slice(0, sessionState.count);
  const newCard = buildAlbumCardObject();
  const nextCards = [...active, newCard];
  const saved = await persistSession({
    v: 1,
    count: nextCards.length,
    settings: sessionState.settings,
    cards: nextCards
  });
  if (saved === "Not saved") {
    setStatus("Could not save to storage.");
    return;
  }
  lastTransfer = { existing: sessionState.existing };
  $("alb-transfer-message").textContent = `Added album “${title}” as Card #${nextCards.length}.`;
  $("alb-transfer-toast").hidden = false;
  await refreshSheetPreview();
}

async function commitFillExisting() {
  const title = $("alb-title").value.trim();
  const artist = $("alb-artist-field").value.trim();
  const year = $("alb-year").value.trim();
  const code = $("alb-code").value.trim() || abbr(artist || title);
  if (!title && !artist && !year && !draftCover) {
    setStatus("Enter or pick album details first.");
    return;
  }
  await refreshSheetPreview();
  const targetIdx = Math.max(0, Math.min(sessionState.count - 1, Number($("alb-fill-target").value) || 0));
  const overwrite = $("alb-overwrite").checked;
  const active = sessionState.cards.slice(0, sessionState.count);
  const cur = active[targetIdx] || {};
  const updated = {
    ...cur,
    kind: "album",
    title: overwrite || !String(cur.title || "").trim() ? (title || cur.title) : cur.title,
    loc: overwrite || !String(cur.loc || "").trim() ? (artist || cur.loc) : cur.loc,
    year: overwrite || !String(cur.year || "").trim() ? (year || cur.year) : cur.year,
    code: overwrite || !String(cur.code || "").trim() ? (code || cur.code) : cur.code
  };
  if (draftCover) {
    const hasPhoto = Boolean(cur.img || cur.imgUrl);
    if (overwrite || !hasPhoto) Object.assign(updated, draftCover);
  }
  const nextCards = active.map((c, idx) => idx === targetIdx ? updated : c);
  const saved = await persistSession({
    v: 1,
    count: nextCards.length,
    settings: sessionState.settings,
    cards: nextCards
  });
  if (saved === "Not saved") {
    setStatus("Could not save updated card.");
    return;
  }
  lastTransfer = { existing: sessionState.existing };
  $("alb-transfer-message").textContent = `Updated Card #${targetIdx + 1} as Album (“${updated.title || "Untitled"}”).`;
  $("alb-transfer-toast").hidden = false;
  await refreshSheetPreview();
}

async function undoLastTransfer() {
  if (!lastTransfer) return;
  const res = lastTransfer.existing
    ? await persistSession(lastTransfer.existing)
    : (await clearSession() ? "Saved" : "Not saved");
  if (res === "Not saved") return;
  lastTransfer = null;
  $("alb-transfer-toast").hidden = true;
  await refreshSheetPreview();
  setStatus("Last album update undone.");
}

function init() {
  injectFonts();
  hydrateIcons();
  bindTapTooltips();
  populateThemeSelect($("alb-theme"), false);
  if (!ALBUM_LOOKUP_CONFIG.enabled) {
    $("alb-disabled-banner").hidden = false;
    setBusy(true);
  }
  $("alb-form").addEventListener("submit", event => {
    event.preventDefault();
    runAlbumSearch();
  });
  $("alb-retry-btn").addEventListener("click", () => runAlbumSearch());
  $("alb-wiki-fallback-btn").addEventListener("click", () => runAlbumSearch("wikipedia"));
  $("alb-results").addEventListener("click", event => {
    const btn = event.target.closest("[data-match-id]");
    if (!btn) return;
    const found = activeResults.find(r => r.id === btn.dataset.matchId);
    if (found) populateDraftFromAlbum(found);
  });
  ["alb-title", "alb-artist-field", "alb-year", "alb-code"].forEach(id => {
    $(id).addEventListener("input", () => {
      if ((id === "alb-artist-field" || id === "alb-title") && !$("alb-code").dataset.manual) {
        $("alb-code").value = abbr($("alb-artist-field").value.trim() || $("alb-title").value);
      }
      refreshLivePreview();
    });
  });
  $("alb-code").addEventListener("input", () => { $("alb-code").dataset.manual = "1"; });
  $("alb-theme").addEventListener("change", refreshLivePreview);
  $("alb-fetch-cover").addEventListener("click", fetchCoverArt);
  $("alb-upload-btn").addEventListener("click", () => $("alb-file").click());
  $("alb-file").addEventListener("change", async event => {
    const f = event.target.files?.[0];
    if (!f) return;
    try {
      draftCover = await processImageFile(f);
      $("alb-url").value = "";
      syncDraftCoverUi();
    } catch (err) {
      $("alb-photo-status").textContent = err instanceof Error ? err.message : "Could not read image.";
    }
    event.target.value = "";
  });
  $("alb-load-url").addEventListener("click", () => loadCoverUrl($("alb-url").value));
  $("alb-clear-cover").addEventListener("click", () => {
    draftCover = null;
    $("alb-url").value = "";
    syncDraftCoverUi();
  });
  $("alb-dl-svg").addEventListener("click", () => {
    const slug = ($("alb-title").value.trim() || "album-card").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    triggerDownload(new Blob([renderAlbumSvg({ embeddedFonts: true })], { type: "image/svg+xml" }), `${slug}.svg`);
  });
  $("alb-dl-png").addEventListener("click", async () => {
    try {
      const ch = computeLayout(sessionState.settings?.paper || "a4", sessionState.settings?.cardSize || "ticket").CH || 239;
      const canvas = await rasterizeSvg(renderAlbumSvg({ embeddedFonts: true }), (CW + 12) * 12, Math.round((ch + 12) * 12));
      await new Promise((resolve, reject) => canvas.toBlob(blob => {
        if (!blob) { reject(new Error("PNG canvas export failed.")); return; }
        const slug = ($("alb-title").value.trim() || "album-card").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        triggerDownload(blob, `${slug}.png`);
        resolve();
      }));
    } catch (err) {
      setStatus("PNG export failed: " + (err instanceof Error ? err.message : String(err)));
    }
  });
  $("alb-add-new").addEventListener("click", commitAddAsNew);
  $("alb-fill-btn").addEventListener("click", commitFillExisting);
  $("alb-undo-transfer").addEventListener("click", undoLastTransfer);
  $("alb-open-editor").addEventListener("click", () => { window.location.href = "index.html"; });
  refreshSheetPreview();
}

init();

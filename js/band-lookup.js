import { DEFAULT_CARDS, blankCard, clearSession, loadSession, persistSession } from "./storage.js?v=phase10f";
import { processImageFile, processImageUrl, hexToHS, hslToHex } from "./image-utils.js?v=phase10f";
import { abbr } from "./svg-engine.js?v=phase10f";
import { bindTapTooltips, hydrateIcons, iconMarkup } from "./icons.mjs?v=phase10f";
import {
  LOOKUP_FEATURE_CONFIG,
  fetchWikipediaPhotoForArtist,
  mergeCardLookupFields,
  searchOnlineBands
} from "./band-lookup-providers.mjs?v=phase10f";

const $ = id => document.getElementById(id);
const MAX_CARDS = 300;
const BAND_PROVIDER_NAMES = {
  musicbrainz: "MusicBrainz",
  theaudiodb: "TheAudioDB",
  itunes: "iTunes / Apple Music",
  wikipedia: "Wikipedia"
};

let activeResults = [];
let selectedMatchId = "";
let draftPhoto = null; // { img, imgUrl, corsLimited, h, s, iw, ih }
let lastTransfer = null;
let sessionState = { cards: DEFAULT_CARDS.map(c => ({ ...c })), count: DEFAULT_CARDS.length, settings: undefined };
let lastSearchQuery = "";

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function setStatus(text, { showRetry = false } = {}) {
  $("lookup-status").textContent = text;
  $("lookup-recovery").hidden = !showRetry;
}

function setBusy(busy) {
  $("lookup-search-btn").disabled = busy || !LOOKUP_FEATURE_CONFIG.enabled;
  $("lookup-search-btn").setAttribute("aria-busy", String(busy));
}

function syncDraftPhotoUi() {
  const thumb = $("lk-thumb");
  const clearBtn = $("lk-clear-photo");
  const statusEl = $("lk-photo-status");
  const src = draftPhoto?.img || draftPhoto?.imgUrl || "";
  if (src) {
    thumb.textContent = "";
    thumb.style.backgroundImage = `url(${JSON.stringify(String(src))})`;
    clearBtn.hidden = false;
    statusEl.textContent = draftPhoto.corsLimited
      ? "Photo ready (host blocks canvas pixel sampling — keeps default card accent)."
      : "Photo ready with sampled accent color.";
  } else {
    thumb.style.backgroundImage = "";
    thumb.textContent = "No photo selected";
    clearBtn.hidden = true;
    statusEl.textContent = "";
  }
}

function populateDraftFromMatch(item) {
  selectedMatchId = item.id;
  $("lk-title").value = item.name || "";
  $("lk-genre").value = item.genre || "";
  $("lk-loc").value = item.loc || "";
  $("lk-year").value = item.year || "";
  $("lk-code").value = item.code || abbr(item.name || "");
  $("lookup-source-pill").hidden = false;
  $("lookup-source-pill").textContent = item.licenseNote || item.source || "";
  const hasManualUpload = Boolean(String(draftPhoto?.img || "").startsWith("data:"));
  if (item.photoUrl && !hasManualUpload && $("lk-url").value.trim() !== item.photoUrl) {
    $("lk-url").value = item.photoUrl;
    loadImageFromUrl(item.photoUrl, item.licenseNote, item.id);
  }
  renderResults();
}

function renderResults() {
  $("lookup-match-count").textContent = activeResults.length;
  const container = $("lookup-results");
  if (!activeResults.length) {
    container.innerHTML = lastSearchQuery
      ? `<p class="hint">No online matches found for “${escapeHtml(lastSearchQuery)}”. Edit your query or try Wikipedia fallback.</p>`
      : `<p class="hint">Enter a band name above and click Search to see ranked candidates.</p>`;
    return;
  }
  container.innerHTML = activeResults.map(item => {
    const selected = item.id === selectedMatchId;
    const metaBits = [item.loc, item.year, item.genre].filter(Boolean).join(" · ");
    return `
      <button type="button" class="lookup-result-card${selected ? " is-selected" : ""}" data-match-id="${escapeHtml(item.id)}" aria-pressed="${selected}">
        <div class="lookup-result-top">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="lookup-pill">${escapeHtml(item.source)}${item.score ? ` · ${item.score}%` : ""}</span>
        </div>
        ${item.disambiguation ? `<div class="lookup-result-sub">${escapeHtml(item.disambiguation)}</div>` : ""}
        <div class="lookup-result-meta">${escapeHtml(metaBits || "Click to inspect fields & fetch optional photo")}</div>
      </button>`;
  }).join("");
}

async function runSearch(overrideProvider = null) {
  if (!LOOKUP_FEATURE_CONFIG.enabled) return;
  const query = $("lookup-query").value.trim();
  if (!query) {
    setStatus("Type a band or artist name before searching.");
    $("lookup-query").focus();
    return;
  }
  if (overrideProvider) $("lookup-provider").value = overrideProvider;
  const provider = $("lookup-provider").value || "musicbrainz";
  const providerLabel = BAND_PROVIDER_NAMES[provider] || provider;
  lastSearchQuery = query;
  setBusy(true);
  setStatus(`Searching ${providerLabel} for “${query}”…`);
  try {
    const res = await searchOnlineBands(query, { provider });
    activeResults = res.results;
    renderResults();
    if (!res.results.length) {
      setStatus(`No matches returned for “${query}”.`, { showRetry: true });
    } else {
      setStatus(`Found ${res.results.length} match${res.results.length === 1 ? "" : "es"}${res.fromCache ? " (from session cache)" : ""}. Pick one to inspect.`);
      populateDraftFromMatch(res.results[0]);
    }
  } catch (err) {
    activeResults = [];
    renderResults();
    setStatus(err instanceof Error ? err.message : "Lookup request failed.", { showRetry: true });
  } finally {
    setBusy(false);
  }
}

async function fetchSelectedWikimediaPhoto() {
  const title = $("lk-title").value.trim() || $("lookup-query").value.trim();
  if (!title) {
    $("lk-photo-status").textContent = "Enter or select a band name first.";
    return;
  }
  const match = activeResults.find(r => r.id === selectedMatchId);
  const btn = $("lk-fetch-photo");
  btn.disabled = true;
  $("lk-photo-status").textContent = "Checking Wikimedia / provider photo…";
  try {
    if (match?.photoUrl && !$("lk-url").value.trim()) {
      $("lk-url").value = match.photoUrl;
      await loadImageFromUrl(match.photoUrl, match.licenseNote || match.source || "");
      return;
    }
    const found = await fetchWikipediaPhotoForArtist({
      name: title,
      wikiPageTitle: match?.wikiPageTitle || ""
    });
    if (!found || !found.thumbUrl) {
      if (match?.photoUrl) {
        $("lk-url").value = match.photoUrl;
        await loadImageFromUrl(match.photoUrl, match.licenseNote || match.source || "");
        return;
      }
      $("lk-photo-status").textContent = "No Wikimedia photo found for this artist. Paste a URL or upload a local file.";
      return;
    }
    $("lk-url").value = found.thumbUrl;
    await loadImageFromUrl(found.thumbUrl, found.licenseNote);
  } catch (err) {
    $("lk-photo-status").textContent = err instanceof Error ? err.message : "Could not load photo.";
  } finally {
    btn.disabled = false;
  }
}

async function loadImageFromUrl(url, note = "", expectMatchId = "") {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return;
  try {
    const imgData = await processImageUrl(cleanUrl);
    if (expectMatchId && selectedMatchId !== expectMatchId) return;
    draftPhoto = { ...imgData, imgUrl: cleanUrl };
    syncDraftPhotoUi();
    if (note) $("lk-photo-status").textContent += ` (${note})`;
  } catch {
    if (expectMatchId && selectedMatchId !== expectMatchId) return;
    // Graceful fallback: keep direct URL marked corsLimited so accent defaults cleanly without crashing
    draftPhoto = { img: cleanUrl, imgUrl: cleanUrl, corsLimited: true };
    syncDraftPhotoUi();
    if (note) $("lk-photo-status").textContent += ` ${note}`;
  }
}

async function refreshSheetPreview() {
  const existing = await loadSession();
  const cards = Array.isArray(existing?.cards) && existing.cards.length
    ? existing.cards
    : DEFAULT_CARDS.map(c => ({ ...c }));
  const count = Math.max(1, Math.min(MAX_CARDS, Number(existing?.count) || cards.length));
  sessionState = { existing, cards, count, settings: existing?.settings };

  $("lk-sheet-count").textContent = count;
  const sel = $("lk-fill-target");
  const prevSel = sel.value;
  sel.innerHTML = Array.from({ length: count }, (_, idx) => {
    const c = cards[idx] || {};
    return `<option value="${idx}">Card ${idx + 1} · ${escapeHtml(c.title || "Untitled card")}</option>`;
  }).join("");
  if (prevSel && Number(prevSel) < count) sel.value = prevSel;

  $("lk-sheet-list").innerHTML = cards.slice(0, count).map((c, idx) => `
    <div class="lookup-sheet-item">
      <strong>#${idx + 1}</strong>
      <span>${escapeHtml(c.title || "Untitled")}</span>
      <span class="hint">${escapeHtml([c.genre, c.loc, c.year].filter(Boolean).join(" · ") || "Empty")}</span>
    </div>`).join("");
}

function readDraftCardFields() {
  const title = $("lk-title").value.trim();
  return {
    title,
    genre: $("lk-genre").value.trim(),
    loc: $("lk-loc").value.trim(),
    year: $("lk-year").value.trim(),
    code: $("lk-code").value.trim() || abbr(title),
    ...(draftPhoto || {})
  };
}

async function commitAddAsNew() {
  const fields = readDraftCardFields();
  if (!fields.title) {
    setStatus("Enter or pick an artist/band name before adding to the sheet.");
    $("lk-title").focus();
    return;
  }
  await refreshSheetPreview();
  if (sessionState.count >= MAX_CARDS) {
    setStatus(`Your sheet already has the maximum ${MAX_CARDS} cards.`);
    return;
  }
  const active = sessionState.cards.slice(0, sessionState.count);
  const newCard = { ...blankCard(), ...fields };
  const nextCards = [...active, newCard];
  const payload = {
    v: 1,
    count: nextCards.length,
    settings: sessionState.settings,
    cards: nextCards
  };
  const saved = await persistSession(payload);
  if (saved === "Not saved") {
    setStatus("Could not save to browser storage. Try clearing unused embedded photos.");
    return;
  }
  lastTransfer = { existing: sessionState.existing };
  $("lookup-transfer-message").textContent = `Added “${fields.title}” as Card #${nextCards.length}.`;
  $("lookup-transfer-toast").hidden = false;
  await refreshSheetPreview();
}

async function commitFillExisting() {
  const fields = readDraftCardFields();
  if (!fields.title && !fields.genre && !fields.loc && !fields.year && !fields.imgUrl) {
    setStatus("Select a band match or enter fields first.");
    return;
  }
  await refreshSheetPreview();
  const targetIdx = Math.max(0, Math.min(sessionState.count - 1, Number($("lk-fill-target").value) || 0));
  const overwrite = $("lk-overwrite").checked;
  const active = sessionState.cards.slice(0, sessionState.count);
  const updated = mergeCardLookupFields(active[targetIdx], fields, { overwrite });
  const nextCards = active.map((c, idx) => idx === targetIdx ? updated : c);
  const payload = {
    v: 1,
    count: nextCards.length,
    settings: sessionState.settings,
    cards: nextCards
  };
  const saved = await persistSession(payload);
  if (saved === "Not saved") {
    setStatus("Could not save updated card.");
    return;
  }
  lastTransfer = { existing: sessionState.existing };
  $("lookup-transfer-message").textContent = `Updated Card #${targetIdx + 1} (${updated.title || "card"}${overwrite ? "" : ", empty fields only"}).`;
  $("lookup-transfer-toast").hidden = false;
  await refreshSheetPreview();
}

async function undoLastTransfer() {
  if (!lastTransfer) return;
  const res = lastTransfer.existing
    ? await persistSession(lastTransfer.existing)
    : (await clearSession() ? "Saved" : "Not saved");
  if (res === "Not saved") {
    setStatus("Could not undo transfer.");
    return;
  }
  lastTransfer = null;
  $("lookup-transfer-toast").hidden = true;
  await refreshSheetPreview();
  setStatus("Last sheet update undone.");
}

function init() {
  hydrateIcons();
  bindTapTooltips();
  if (!LOOKUP_FEATURE_CONFIG.enabled) {
    $("lookup-disabled-banner").hidden = false;
    setBusy(true);
  }
  $("lookup-form").addEventListener("submit", event => {
    event.preventDefault();
    runSearch();
  });
  $("lookup-retry-btn").addEventListener("click", () => runSearch());
  $("lookup-fast-fallback-btn")?.addEventListener("click", () => runSearch("theaudiodb"));
  $("lookup-wiki-fallback-btn").addEventListener("click", () => runSearch("wikipedia"));
  $("lookup-results").addEventListener("click", event => {
    const btn = event.target.closest("[data-match-id]");
    if (!btn) return;
    const found = activeResults.find(r => r.id === btn.dataset.matchId);
    if (found) populateDraftFromMatch(found);
  });
  $("lk-fetch-photo").addEventListener("click", fetchSelectedWikimediaPhoto);
  $("lk-upload-btn").addEventListener("click", () => $("lk-file").click());
  $("lk-file").addEventListener("change", async event => {
    const f = event.target.files?.[0];
    if (!f) return;
    try {
      draftPhoto = await processImageFile(f);
      $("lk-url").value = "";
      syncDraftPhotoUi();
    } catch (err) {
      $("lk-photo-status").textContent = err instanceof Error ? err.message : "Could not read photo.";
    }
    event.target.value = "";
  });
  $("lk-load-url").addEventListener("click", () => loadImageFromUrl($("lk-url").value));
  $("lk-clear-photo").addEventListener("click", () => {
    draftPhoto = null;
    $("lk-url").value = "";
    syncDraftPhotoUi();
  });
  $("lk-add-new").addEventListener("click", commitAddAsNew);
  $("lk-fill-btn").addEventListener("click", commitFillExisting);
  $("lk-undo-transfer").addEventListener("click", undoLastTransfer);
  $("lk-open-editor").addEventListener("click", () => { window.location.href = "index.html"; });
  refreshSheetPreview();
}

init();

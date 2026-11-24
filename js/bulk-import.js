import { DEFAULT_CARDS, blankCard, clearSession, loadSession, persistSession } from "./storage.js?v=phase5.2";
import { processImageFile, processImageUrl, cleanFilenameToTitle, hslToHex, hexToHS } from "./image-utils.js?v=phase5.2";
import { abbr } from "./svg-engine.js?v=phase5.2";
import { bindTapTooltips, hydrateIcons, iconMarkup } from "./icons.mjs?v=phase5.2";
import { attachColorHexFields } from "./color-controls.mjs?v=phase5.2";

const $ = id => document.getElementById(id);
const MAX_CARDS = 72;
let staged = [];
let draggedIndex = -1;
let lastTransfer = null;

function message(text) {
  $("bi-msg").textContent = text;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function addStaged(card) {
  if (staged.length >= MAX_CARDS) return false;
  staged.push({ ...blankCard(), ...card });
  return true;
}

function renderStaged() {
  $("staged-count").textContent = staged.length;
  $("staging-grid").innerHTML = staged.map((card, index) => `
    <article class="stage-card" draggable="true" data-index="${index}">
      <div class="stage-meta"><strong>Card ${index + 1}</strong><button class="g sm" type="button" data-remove="${index}" aria-label="Remove staged card">${iconMarkup("delete")} Remove</button></div>
      <div class="stage-thumb" data-thumb="${index}">${card.img || card.imgUrl ? "" : "Photo unavailable"}</div>
      ${card.corsLimited ? '<span class="cors-tag">CORS-limited raster export</span>' : ""}
      <input type="text" data-field="title" data-index="${index}" aria-label="Artist name" placeholder="Artist / band name" value="${escapeHtml(card.title)}">
      <input type="text" data-field="genre" data-index="${index}" aria-label="Genre" placeholder="Genre" value="${escapeHtml(card.genre)}">
      <input type="text" data-field="loc" data-index="${index}" aria-label="Place" placeholder="Place" value="${escapeHtml(card.loc)}">
      <input type="text" data-field="year" data-index="${index}" aria-label="Year" placeholder="Year" value="${escapeHtml(card.year)}">
      <input type="text" data-field="code" data-index="${index}" aria-label="Abbreviation" placeholder="Abbreviation" value="${escapeHtml(card.code || abbr(card.title))}">
      <label class="colour-control"><span>Image accent</span><input type="color" data-accent="${index}" aria-label="Image accent colour" value="${hslToHex(card)}"></label>
      <div class="ctrl-flex">
        <button class="g sm" type="button" data-move="-1" data-index="${index}" aria-label="Move card ${index + 1} up" data-tooltip="Move up" ${index === 0 ? "disabled" : ""}>${iconMarkup("moveUp")}</button>
        <button class="g sm" type="button" data-move="1" data-index="${index}" aria-label="Move card ${index + 1} down" data-tooltip="Move down" ${index === staged.length - 1 ? "disabled" : ""}>${iconMarkup("moveDown")}</button>
      </div>
    </article>`).join("");
  attachColorHexFields($("staging-grid"));
  $("staging-grid").querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", () => {
    staged[+input.dataset.index][input.dataset.field] = input.value;
  }));
  $("staging-grid").querySelectorAll("[data-thumb]").forEach(thumb => {
    const card = staged[+thumb.dataset.thumb];
    const image = card.img || card.imgUrl;
    if (image) thumb.style.backgroundImage = `url(${JSON.stringify(String(image))})`;
  });
  $("staging-grid").querySelectorAll("[data-accent]").forEach(input => input.addEventListener("input", () => {
    Object.assign(staged[+input.dataset.accent], hexToHS(input.value));
  }));
  $("staging-grid").querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    staged.splice(+button.dataset.remove, 1);
    renderStaged();
  }));
  $("staging-grid").querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => {
    const index = +button.dataset.index, destination = index + Number(button.dataset.move);
    if (destination < 0 || destination >= staged.length) return;
    [staged[index], staged[destination]] = [staged[destination], staged[index]];
    renderStaged();
  }));
  $("staging-grid").querySelectorAll(".stage-card").forEach(element => {
    element.addEventListener("dragstart", event => {
      draggedIndex = +element.dataset.index;
      event.dataTransfer.effectAllowed = "move";
    });
    element.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    element.addEventListener("drop", event => {
      event.preventDefault();
      const target = +element.dataset.index;
      if (draggedIndex < 0 || draggedIndex === target) return;
      const [moved] = staged.splice(draggedIndex, 1);
      staged.splice(target, 0, moved);
      draggedIndex = -1;
      renderStaged();
    });
    element.addEventListener("dragend", () => { draggedIndex = -1; });
  });
}

async function processFiles(files) {
  const imageFiles = [...files].filter(file => file.type.startsWith("image/"));
  if (!imageFiles.length) { message("Choose image files to stage."); return; }
  const available = MAX_CARDS - staged.length;
  const selected = imageFiles.slice(0, available);
  const errors = [];
  let added = 0;
  for (const file of selected) {
    try {
      const image = await processImageFile(file);
      if (addStaged({ ...image, title: cleanFilenameToTitle(file.name), code: abbr(cleanFilenameToTitle(file.name)) })) added++;
    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }
  renderStaged();
  const omitted = imageFiles.length - selected.length;
  message(`${added} image${added === 1 ? "" : "s"} staged${omitted ? `; ${omitted} skipped because the 72-card limit was reached` : ""}${errors.length ? `. ${errors.length} failed: ${errors.slice(0, 3).join("; ")}` : "."}`);
}

function parseUrlLine(line) {
  const parts = line.split("|").map(part => part.trim());
  if (parts.length >= 5) {
    const url = parts.slice(4).join("|").trim();
    return { title: parts[0], genre: parts[1], loc: parts[2], year: parts[3], url, code: abbr(parts[0]) };
  }
  return { title: "", genre: "", loc: "", year: "", url: line.trim() };
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field.trim()); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one card.");
  const headers = rows[0].map(header => header.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, ""));
  return rows.slice(1).map(values => {
    const item = {};
    headers.forEach((header, index) => { item[header] = values[index] || ""; });
    const title = item.name || item.title || item.artist || "";
    return {
      name: title,
      genre: item.genre || "",
      place: item.place || item.location || item.loc || "",
      year: item.year || "",
      abbreviation: item.abbreviation || item.abbr || item.code || "",
      photo: item.photo || item.photourl || item.image || item.url || ""
    };
  });
}

async function importStructuredFile(file) {
  const text = await file.text();
  let entries;
  if (/\.json$/i.test(file.name)) {
    const payload = JSON.parse(text);
    entries = Array.isArray(payload) ? payload : payload?.cards;
    if (!Array.isArray(entries)) throw new Error('JSON must be a card array or contain a "cards" array.');
  } else {
    entries = parseCsv(text);
  }
  const remaining = MAX_CARDS - staged.length;
  const selected = entries.slice(0, remaining);
  let added = 0;
  const errors = [];
  for (const raw of selected) {
    const item = raw && typeof raw === "object" ? raw : {};
    const title = String(item.name || item.title || item.artist || "");
    const photo = item.photo || item.photoUrl || item.image || item.url || "";
    const card = {
      title,
      genre: String(item.genre || ""),
      loc: String(item.place || item.location || item.loc || ""),
      year: String(item.year || ""),
      code: String(item.abbreviation || item.abbr || item.code || abbr(title))
    };
    if (typeof photo === "string" && photo.startsWith("data:image/")) {
      card.img = photo;
      if (/^#[\da-f]{6}$/i.test(item.accent || "")) Object.assign(card, hexToHS(item.accent));
    } else if (typeof photo === "string" && photo.trim()) {
      const photoUrl = photo.trim();
      if (!/^https?:\/\//i.test(photoUrl)) {
        errors.push(`${title || photoUrl}: invalid image URL`);
        continue;
      }
      Object.assign(card, {
        img: photoUrl,
        imgUrl: photoUrl,
        iw: 600,
        ih: 600,
        corsLimited: true
      });
    }
    if (addStaged(card)) added++;
  }
  renderStaged();
  const omitted = entries.length - selected.length;
  message(`${added} card${added === 1 ? "" : "s"} imported${omitted ? `; ${omitted} skipped because the 72-card limit was reached` : ""}${errors.length ? `. ${errors.length} failed: ${errors.slice(0, 3).join("; ")}` : "."}`);
}

async function loadUrlBatch() {
  const lines = $("url-textarea").value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) { message("Paste one or more direct image URLs first."); return; }
  const remaining = MAX_CARDS - staged.length;
  const selected = lines.slice(0, remaining);
  const errors = [];
  let added = 0;
  for (const line of selected) {
    const item = parseUrlLine(line);
    try {
      const fallbackName = cleanFilenameToTitle(item.url.split(/[?#]/)[0].split("/").pop());
      if (!/^https?:\/\//i.test(item.url)) throw new Error("Enter a direct http:// or https:// image URL.");
      if (addStaged({
        ...blankCard(),
        title: item.title || fallbackName,
        genre: item.genre,
        loc: item.loc,
        year: item.year,
        code: item.code || abbr(item.title || fallbackName),
        img: item.url,
        imgUrl: item.url,
        iw: 600,
        ih: 600
      })) added++;
    } catch (error) {
      errors.push(`${item.url}: ${error.message}`);
    }
  }
  renderStaged();
  const omitted = lines.length - selected.length;
  message(`${added} URL${added === 1 ? "" : "s"} staged${omitted ? `; ${omitted} skipped because the 72-card limit was reached` : ""}${errors.length ? `. ${errors.length} failed: ${errors.slice(0, 3).join("; ")}` : "."}`);
}

async function parsePastedCardData() {
  const text = $("card-data-textarea").value.trim();
  if (!text) {
    message("Paste card JSON or CSV first.");
    return;
  }
  try {
    const looksJson = text.startsWith("[") || text.startsWith("{");
    const mime = looksJson ? "application/json" : "text/csv";
    const name = looksJson ? "pasted-cards.json" : "pasted-cards.csv";
    await importStructuredFile(new File([text], name, { type: mime }));
  } catch (error) {
    message("Could not parse pasted card data: " + error.message);
  }
}

async function pushToSheet(replace) {
  if (!staged.length) { message("Stage at least one image or URL before sending cards to the sheet."); return; }
  const existing = await loadSession();
  const oldCards = Array.isArray(existing?.cards) ? existing.cards : DEFAULT_CARDS.map(card => ({ ...card }));
  const nextCards = replace ? staged : [...oldCards.slice(0, MAX_CARDS), ...staged];
  const finalCards = nextCards.slice(0, MAX_CARDS);
  if (finalCards.length < nextCards.length) {
    message(`The sheet can hold ${MAX_CARDS} cards. Only the first ${MAX_CARDS} were transferred.`);
  }
  const payload = {
    v: 1,
    count: finalCards.length,
    settings: existing?.settings || undefined,
    cards: finalCards
  };
  const result = await persistSession(payload);
  if (result === "Not saved") {
    message("Could not save the sheet. Your staged cards are still here; try again or use fewer/lower-resolution images.");
    return;
  }
  lastTransfer = { existing };
  $("bulk-transfer-message").textContent = `${replace ? "Replaced" : "Appended to"} the saved sheet. Undo is available until you leave or reload.`;
  $("bulk-transfer-toast").hidden = false;
  message("Transfer saved. Undo it here or open the editor.");
}

async function undoTransfer() {
  if (!lastTransfer) return;
  const result = lastTransfer.existing
    ? await persistSession(lastTransfer.existing)
    : (await clearSession() ? "Saved locally" : "Not saved");
  if (result === "Not saved") {
    message("Could not fully undo the transfer. Reload and verify the saved sheet before continuing.");
    return;
  }
  lastTransfer = null;
  $("bulk-transfer-toast").hidden = true;
  message(result === "Saved (embedded photos exceeded localStorage)"
    ? "Transfer undone, but local storage could not retain embedded photos. Verify the sheet before continuing."
    : "Bulk transfer undone.");
}

function bind() {
  const fileInput = $("file-input");
  $("dropzone").addEventListener("click", event => {
    if (event.target !== fileInput) fileInput.click();
  });
  $("dropzone").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", async () => {
    if (fileInput.files?.length) await processFiles(fileInput.files);
    fileInput.value = "";
  });
  $("dropzone").addEventListener("dragover", event => { event.preventDefault(); $("dropzone").classList.add("drag-over"); });
  $("dropzone").addEventListener("dragleave", () => $("dropzone").classList.remove("drag-over"));
  $("dropzone").addEventListener("drop", async event => {
    event.preventDefault();
    $("dropzone").classList.remove("drag-over");
    if (event.dataTransfer?.files?.length) await processFiles(event.dataTransfer.files);
  });
  $("parse-urls-btn").addEventListener("click", loadUrlBatch);
  $("parse-card-data-btn").addEventListener("click", parsePastedCardData);
  $("import-data-btn").addEventListener("click", () => $("import-data-file").click());
  $("import-data-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (file) {
      try { await importStructuredFile(file); }
      catch (error) { message("Could not import that file: " + error.message); }
    }
    event.target.value = "";
  });
  $("clear-staged-btn").addEventListener("click", () => { staged = []; renderStaged(); message("Staging cleared."); });
  $("push-append-btn").addEventListener("click", () => pushToSheet(false).catch(error => message("Could not append staged cards: " + error.message)));
  $("push-replace-btn").addEventListener("click", () => pushToSheet(true).catch(error => message("Could not replace the sheet: " + error.message)));
  $("undo-transfer").addEventListener("click", () => undoTransfer().catch(error => message("Could not undo the transfer: " + error.message)));
  $("open-sheet-editor").addEventListener("click", () => {
    if (lastTransfer) window.location.href = "index.html";
  });
}

hydrateIcons();
bindTapTooltips();
attachColorHexFields();
bind();
renderStaged();

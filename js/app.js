import { DEFAULT_CARDS, SET0, blankCard, loadSession, persistSession, clearSession } from "./storage.js";
import { BUILTIN_THEMES, CUSTOM, THEMES, buildCustom, populateThemeSelect } from "./themes.js";
import { processImageFile, processImageUrl, sampleImageColor, hslToHex, hexToHS } from "./image-utils.js";
import { CW, SIZES, STAMPS, computeLayout, fitBox, renderCard, tplSvg, cutSvg, regMarksSvg, abbr, hueOf } from "./svg-engine.js";
import { exportAllSvgs, exportAllPngs, exportPdf, exportProjectJson, triggerDownload, rasterizeSvg } from "./export.js";
import { FONTCSS } from "./fonts.js";

const $ = id => document.getElementById(id);
const MAX_CARDS = 72;
const SETTINGS_FIELDS = {
  style: "style", titleFont: "tfont", doors: "gdoors", side: "gside",
  stamp: "gstamp", stampYear: "gsyear", stampSize: "ssize", stampShape: "sshape",
  stampColor: "scol", stamp2: "gs2", stampWear: "wear", borderWear: "bwear",
  gradientSpread: "gspread", paper: "paper", cardSize: "csize", cutterCorners: "crad",
  grain: "tgr", edgeWear: "tew", creases: "tcr", scuffs: "tsc",
  borderStyle: "design-border", yearBadge: "design-badge", tearStyle: "design-tear", photoFilter: "design-filter"
};
const CHECK_FIELDS = {
  cropMarks: "marks", bleed: "bleed", nfc: "nfc", cutTemplate: "tpl",
  serials: "serial", stampAuto: "sauto", regMarks: "regmarks", punchHole: "punch",
  centerTitle: "design-center", halftone: "design-halftone"
};
const CUSTOM_FIELDS = ["bg", "ink", "acc", "tape", "pa"];

let cards = DEFAULT_CARDS.map(c => ({ ...c }));
let count = cards.length;
let selectedCard = 0;
let currentLayout;
let renderFrame = 0;
let saveTimer;
let dragState = null;
let previewIndex = -1;
let previousFocus = null;
let gradientAngle = SET0.gradientAngle;
let activePage = 0;
let pageThemes = [];

function readPageThemes() {
  return pageThemes.slice();
}

function message(text) {
  $("msg").textContent = text;
}

function readSettings() {
  const settings = {};
  for (const [key, id] of Object.entries(SETTINGS_FIELDS)) {
    const value = $(id).value;
    settings[key] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  for (const [key, id] of Object.entries(CHECK_FIELDS)) settings[key] = $(id).checked;
  settings.gradientAngle = gradientAngle;
  settings.customTheme = { ...CUSTOM };
  settings.pageThemes = readPageThemes();
  settings.photoMounts = [...document.querySelectorAll("[data-quick-mount]:checked")].map(input => Number(input.value)).slice(0, 2);
  return settings;
}

function applySettings(settings = {}) {
  const allThemes = { ...THEMES, ...BUILTIN_THEMES };
  for (const [key, id] of Object.entries(SETTINGS_FIELDS)) {
    if (settings[key] === undefined) continue;
    const value = String(settings[key]);
    const element = $(id);
    if (element.tagName !== "SELECT" || [...element.options].some(option => option.value === value)) element.value = value;
  }
  for (const [key, id] of Object.entries(CHECK_FIELDS)) {
    if (typeof settings[key] === "boolean") $(id).checked = settings[key];
  }
  if (Array.isArray(settings.photoMounts)) {
    const savedMounts = settings.photoMounts.slice(0, 2).map(Number);
    const selectedMounts = savedMounts.includes(3) ? [3] : savedMounts;
    document.querySelectorAll("[data-quick-mount]").forEach(input => {
      input.checked = selectedMounts.includes(Number(input.value));
    });
    updateMountStatus();
  }
  if (settings.customTheme && typeof settings.customTheme === "object") {
    Object.assign(CUSTOM, settings.customTheme);
    for (const key of CUSTOM_FIELDS) {
      const el = $("ct_" + key);
      if (el) el.type === "checkbox" ? (el.checked = Boolean(CUSTOM[key])) : (el.value = CUSTOM[key]);
    }
    buildCustom();
  }
  if (settings.gradientAngle !== undefined && Number.isFinite(+settings.gradientAngle)) {
    gradientAngle = ((+settings.gradientAngle % 360) + 360) % 360;
  }
  if (Array.isArray(settings.pageThemes)) pageThemes = settings.pageThemes.map(theme => String(theme || ""));
  $("needle").style.transform = `rotate(${gradientAngle}deg)`;
  $("dial").setAttribute("aria-valuenow", gradientAngle);
  $("gav").textContent = gradientAngle + "°";
  if (settings.style && !allThemes[settings.style]) {
    const found = Object.keys(THEMES).find(key => THEMES[key].n.toLowerCase() === String(settings.style).toLowerCase());
    if (found) $("style").value = found;
  }
}

function renderConfig(one = false) {
  return {
    lay: currentLayout,
    style: $("style").value,
    one,
    bleed: $("bleed").checked,
    cropMarks: $("marks").checked,
    regMarks: $("regmarks").checked,
    stampWear: +$("wear").value,
    borderWear: +$("bwear").value,
    stampSize: +$("ssize").value,
    stampShape: $("sshape").value,
    stamp: $("gstamp").value,
    stampYear: $("gsyear").value,
    stampColor: $("scol").value,
    stampAuto: $("sauto").checked,
    stamp2: $("gs2").value.trim(),
    titleFont: $("tfont").value,
    gradientAngle,
    gradientSpread: +$("gspread").value,
    grain: +$("tgr").value,
    edgeWear: +$("tew").value,
    creases: +$("tcr").value,
    scuffs: +$("tsc").value,
    serials: $("serial").checked,
    nfc: $("nfc").checked,
    punchHole: $("punch")?.checked,
    borderStyle: +$("design-border").value,
    yearBadge: +$("design-badge").value,
    tearStyle: +$("design-tear").value,
    photoFilter: +$("design-filter").value,
    photoMounts: [...document.querySelectorAll("[data-quick-mount]:checked")].map(input => Number(input.value)).slice(0, 2),
    centerTitle: $("design-center").checked,
    halftone: $("design-halftone").checked,
    pageThemes: readPageThemes(),
    doors: $("gdoors").value,
    side: $("gside").value,
    drag: $("drag").checked
  };
}

function updateMountStatus() {
  const names = { "0": "Tape", "1": "Pins", "2": "Corners", "3": "None" };
  const checked = [...document.querySelectorAll("[data-quick-mount]:checked")];
  $("quick-mount-status").textContent = checked.length
    ? `Active mounts: ${checked.map(element => names[element.value]).join(" + ")}`
    : "Active mounts: None";
}

function scheduleRender() {
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function render() {
  const active = THEMES[$("style").value] || THEMES.cream;
  currentLayout = computeLayout($("paper").value, $("csize").value);
  const cfg = renderConfig();
  const activeCards = cards.slice(0, count);
  selectedCard = Math.max(0, Math.min(count - 1, selectedCard));
  const pages = Math.ceil(activeCards.length / currentLayout.PER);
  const width = (currentLayout.W / 2.83465).toFixed(2) + "mm";
  const height = (currentLayout.H / 2.83465).toFixed(2) + "mm";
  const svgPages = Array.from({ length: pages }, (_, page) => {
    const pageCards = activeCards.slice(page * currentLayout.PER, (page + 1) * currentLayout.PER);
    const pageTheme = (cfg.pageThemes?.[page] || "");
    return `<svg class="sheet" data-name="ticket-cards-p${page + 1}" data-page="${page}" width="${width}" height="${height}" viewBox="0 0 ${currentLayout.W} ${currentLayout.H}" xmlns="http://www.w3.org/2000/svg"><rect width="${currentLayout.W}" height="${currentLayout.H}" fill="#fff"/>${regMarksSvg(currentLayout.W, currentLayout.H, cfg.regMarks)}${pageCards.map((card, i) => renderCard(card, page * currentLayout.PER + i, { ...cfg, style: pageTheme || cfg.style, themeForce: pageTheme || "" })).join("")}</svg>`;
  });
  if ($("tpl").checked) svgPages.push(tplSvg(currentLayout, cfg.regMarks));
  $("sheets").innerHTML = svgPages.join("");
  const printStyle = $("print-page-style");
  if (printStyle) printStyle.textContent = `@media print { @page { size: ${$("paper").value === "letter" ? "letter" : "A4"} portrait; margin: 0; } }`;
  $("pg").textContent = `${pages + ($("tpl").checked ? 1 : 0)} page${pages + ($("tpl").checked ? 1 : 0) === 1 ? "" : "s"} · ${currentLayout.PER}/page`;
  const paperName = $("paper").value === "letter" ? "US Letter" : "A4";
  $("sub-info").textContent = `${count} cards across ${pages} ${paperName} page${pages === 1 ? "" : "s"} · ${currentLayout.PER}/page`;
  $("card-count-lbl").textContent = count;
  $("ssv").textContent = cfg.stampSize + "%";
  $("gsv").textContent = cfg.gradientSpread + "%";
  $("gctl").style.opacity = active.grad ? "1" : ".55";
  syncPageTools(pages);
  document.querySelectorAll(".row").forEach((row, i) => {
    row.classList.toggle("selected", i === selectedCard);
    if (i === selectedCard) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
  if (!$("pv").hidden) refreshPreview();
  saveSoon();
}

function selectCard(index, scroll = false) {
  if (index < 0 || index >= count) return;
  selectedCard = index;
  document.querySelectorAll(".row").forEach((row, i) => {
    row.classList.toggle("selected", i === index);
    if (i === index) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
  if (scroll) $("rows").children[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function buildRows() {
  $("rows").replaceChildren();
  cards.slice(0, count).forEach((card, index) => {
    const row = document.createElement("article");
    row.className = "row" + (index === selectedCard ? " selected" : "");
    row.dataset.index = index;
    const imgSrc = card.img || card.imgUrl;
    const themeOptions = `<option value="">Same as sheet</option>${Object.entries(THEMES).map(([key, theme]) => `<option value="${key}"${card.theme === key ? " selected" : ""}>${escapeHtml(theme.n)}</option>`).join("")}`;
    const stampOptions = [["", "Same as sheet"], ["none", "No stamp"], ...Object.keys(STAMPS).map(key => [key, key[0].toUpperCase() + key.slice(1)]), ["mixed", "Mixed"]]
      .map(([value, name]) => `<option value="${value}"${(card.sk || "") === value ? " selected" : ""}>${name}</option>`).join("");
    row.innerHTML = `
      <div class="cv" tabindex="0" role="button" aria-label="Choose photo for card ${index + 1}">${imgSrc ? "" : "Photo"}</div>
      <div class="f">
        <div class="w rb"><b>Card ${index + 1}</b>
          <button class="g" type="button" data-action="up" aria-label="Move card up">▲</button>
          <button class="g" type="button" data-action="down" aria-label="Move card down">▼</button>
          <button class="g" type="button" data-action="duplicate" aria-label="Duplicate card">⧉</button>
          <button class="g" type="button" data-action="delete" aria-label="Delete card">✕</button>
          <button class="g" type="button" data-action="view">View</button>
          <button class="g" type="button" data-action="clear" aria-label="Clear card">↺</button>
        </div>
        <input class="w" type="text" data-field="title" aria-label="Card ${index + 1} name" placeholder="Artist / band name" value="${escapeHtml(card.title)}">
        <input type="text" data-field="genre" aria-label="Genre" placeholder="Genre" value="${escapeHtml(card.genre)}">
        <input type="text" data-field="loc" aria-label="Place" placeholder="Place" value="${escapeHtml(card.loc)}">
        <input type="text" data-field="year" aria-label="Year" placeholder="Year" value="${escapeHtml(card.year)}">
        <input type="text" data-field="code" aria-label="Abbreviation" placeholder="Abbreviation" value="${escapeHtml(card.code)}">
        <label class="fld w"><span>Image URL</span><div class="url-row"><input type="url" data-url placeholder="https://…" value="${escapeHtml(card.imgUrl || (String(card.img || "").startsWith("http") ? card.img : ""))}"><button class="g sm" type="button" data-action="load-url">Load</button></div></label>
        ${card.corsLimited ? '<span class="cors-tag w" title="This host blocks canvas access; SVG export works, raster export may not.">CORS-limited image</span>' : ""}
        <div class="c-row w"><input type="color" data-accent aria-label="Accent colour" value="${hslToHex(card)}"> Accent sampled from image when available</div>
        <details class="w adj"><summary>Photo &amp; theme options</summary>
          <label><span>Zoom</span><input type="range" min="100" max="300" value="${Math.round((card.zm || 1) * 100)}" data-adjust="zm"></label>
          <label><span>Horizontal</span><input type="range" min="-100" max="100" value="${card.px || 0}" data-adjust="px"></label>
          <label><span>Vertical</span><input type="range" min="-100" max="100" value="${card.py || 0}" data-adjust="py"></label>
          <button class="g sm" type="button" data-action="reset-photo">Reset photo crop</button>
          <label><span>Theme</span><select data-option="theme">${themeOptions}</select></label>
          <label><span>Stamp</span><select data-option="sk">${stampOptions}</select></label>
          <label><span>Stamp text</span><input type="text" data-option="stx" placeholder="Same as sheet" value="${escapeHtml(card.stx || "")}"></label>
        </details>
      </div>`;
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.hidden = true;
    file.addEventListener("change", async () => {
      if (file.files?.[0]) await setImage(index, () => processImageFile(file.files[0]));
      file.value = "";
    });
    row.append(file);
    const thumb = row.querySelector(".cv");
    if (imgSrc) thumb.style.backgroundImage = `url(${JSON.stringify(String(imgSrc))})`;
    thumb.addEventListener("click", () => { selectCard(index); file.click(); });
    thumb.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); file.click(); }
    });
    row.addEventListener("focusin", () => selectCard(index));
    row.addEventListener("dragover", event => { event.preventDefault(); row.classList.add("drag-over"); });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", async event => {
      event.preventDefault();
      row.classList.remove("drag-over");
      const dropped = event.dataTransfer?.files?.[0];
      if (dropped) await setImage(index, () => processImageFile(dropped));
    });
    row.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", () => {
      card[input.dataset.field] = input.value;
      scheduleRender();
    }));
    row.querySelectorAll("[data-adjust]").forEach(input => input.addEventListener("input", () => {
      const field = input.dataset.adjust;
      card[field] = field === "zm" ? +input.value / 100 : +input.value;
      scheduleRender();
    }));
    row.querySelectorAll("[data-option]").forEach(input => input.addEventListener("input", () => {
      card[input.dataset.option] = input.value;
      scheduleRender();
    }));
    row.querySelector("[data-accent]").addEventListener("input", event => {
      Object.assign(card, hexToHS(event.target.value));
      scheduleRender();
    });
    row.querySelector("[data-action='load-url']").addEventListener("click", async () => {
      const url = row.querySelector("[data-url]").value.trim();
      await setImage(index, () => processImageUrl(url));
    });
    row.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "load-url") return;
      if (action === "view") { selectCard(index); openPreview(index); }
      else if (action === "up" && index > 0) moveCard(index, index - 1);
      else if (action === "down" && index < count - 1) moveCard(index, index + 1);
      else if (action === "duplicate" && count < MAX_CARDS) {
        cards.splice(index + 1, 0, { ...card });
        count++;
        selectedCard = index + 1;
        buildRows();
        render();
      } else if (action === "delete" && count > 1) {
        cards.splice(index, 1);
        count--;
        selectedCard = Math.min(index, count - 1);
        $("count").value = count;
        buildRows();
        render();
      } else if (action === "clear") {
        cards[index] = blankCard();
        buildRows();
        render();
      } else if (action === "reset-photo") {
        Object.assign(card, { zm: 1, px: 0, py: 0 });
        buildRows();
        render();
      }
    }));
    $("rows").append(row);
  });
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function setImage(index, loader) {
  const target = cards[index];
  try {
    const image = await loader();
    const currentIndex = cards.indexOf(target);
    if (currentIndex < 0) {
      message("That card changed before its image finished loading.");
      return;
    }
    Object.assign(target, image);
    buildRows();
    render();
    message(`Image added to card ${currentIndex + 1}${target.corsLimited ? " (host limits raster export)" : ""}.`);
  } catch (error) {
    message(error instanceof Error ? error.message : "Could not load the image.");
  }
}

function moveCard(from, to) {
  [cards[from], cards[to]] = [cards[to], cards[from]];
  selectedCard = to;
  buildRows();
  render();
}

function setCount(value) {
  count = Math.max(1, Math.min(MAX_CARDS, Number.parseInt(value, 10) || 1));
  while (cards.length < count) cards.push(blankCard());
  if (cards.length > count) cards.length = count;
  selectedCard = Math.min(selectedCard, count - 1);
  $("count").value = count;
  buildRows();
  render();
}

function imageDataFromJson(value) {
  if (typeof value !== "string") return "";
  if (/^data:image\//i.test(value)) return value;
  return /^https?:\/\//i.test(value) ? value : "";
}

function photoForJson(entry) {
  const photo = imageDataFromJson(entry?.photo);
  return photo.startsWith("data:") ? photo : imageDataFromJson(entry?.photoUrl || photo);
}

async function importJson(text) {
  let data;
  try { data = JSON.parse(text); }
  catch (error) { message("Invalid JSON: " + error.message); return; }
  const entries = Array.isArray(data) ? data : data?.cards;
  if (!Array.isArray(entries) || !entries.length) {
    message('No cards found. Use an array of cards or an object with a "cards" array.');
    return;
  }
  const imported = entries.slice(0, MAX_CARDS).map(entry => {
    const item = entry && typeof entry === "object" ? entry : {};
    const title = String(item.name || item.title || "");
    const accent = /^#[\da-f]{6}$/i.test(item.accent || "") ? hexToHS(item.accent) : null;
    const photo = photoForJson(item);
    return {
      ...blankCard(),
      title,
      genre: String(item.genre || ""),
      loc: String(item.place || item.location || item.loc || ""),
      year: String(item.year || ""),
      code: String(item.abbreviation || item.abbr || item.code || abbr(title)),
      h: accent?.h ?? hueOf(title),
      s: accent?.s ?? .75,
      img: photo.startsWith("data:") ? photo : null,
      imgUrl: photo.startsWith("http") ? photo : "",
      zm: Math.max(1, Math.min(3, Number(item.photoZoom) || 1)),
      px: Math.max(-100, Math.min(100, Number(item.photoX) || 0)),
      py: Math.max(-100, Math.min(100, Number(item.photoY) || 0)),
      theme: String(item.theme || ""),
      sk: String(item.stampShape || ""),
      stx: String(item.stampText || ""),
      autoAccent: !accent,
      ...(accent || {})
    };
  });
  cards = imported;
  count = imported.length;
  selectedCard = 0;
  $("count").value = count;
  if (!Array.isArray(data) && data.settings) applySettings(data.settings);
  buildRows();
  render();
  for (let i = 0; i < imported.length; i++) {
    const entry = entries[i];
    const photo = photoForJson(entry);
    if (photo.startsWith("http")) {
      await setImage(i, () => processImageUrl(photo));
    } else if (photo.startsWith("data:")) {
      await hydrateDataImage(imported[i]);
    }
  }
  message(`Loaded ${imported.length} card${imported.length === 1 ? "" : "s"}${entries.length > MAX_CARDS ? " (first 72 only)" : ""}.`);
}

function hydrateDataImage(card) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      card.iw = image.naturalWidth;
      card.ih = image.naturalHeight;
      if (card.autoAccent) Object.assign(card, sampleImageColor(image));
      delete card.autoAccent;
      resolve();
    };
    image.onerror = () => { delete card.autoAccent; resolve(); };
    image.src = card.img;
  });
}

function setGradientAngle(angle, snap = true) {
  const rounded = snap ? Math.round(angle / 5) * 5 : Math.round(angle);
  gradientAngle = ((rounded % 360) + 360) % 360;
  $("needle").style.transform = `rotate(${gradientAngle}deg)`;
  $("dial").setAttribute("aria-valuenow", gradientAngle);
  $("gav").textContent = gradientAngle + "°";
  scheduleRender();
}

function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const result = await persistSession({ v: 1, count, settings: readSettings(), cards });
    $("sv").textContent = result;
  }, 450);
}

function syncCustomControls() {
  for (const key of CUSTOM_FIELDS) {
    const el = $("ct_" + key);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(CUSTOM[key]);
    else el.value = CUSTOM[key];
  }
  updateMountStatus();
}

function resetDefaults() {
  cards = DEFAULT_CARDS.map(card => ({ ...card }));
  count = cards.length;
  selectedCard = 0;
  $("count").value = count;
  applySettings(SET0);
  syncCustomControls();
  buildRows();
  render();
  message("Defaults restored.");
}

function loadSamples() {
  const sample = [
    ["Three Days Grace", "Alt-Rock", "Canada", "1997", "TDG", 345],
    ["Linkin Park", "Nu Metal", "California", "1996", "LP", 325],
    ["Skillet", "Hard Rock", "Tennessee", "1996", "SKLT", 18],
    ["Breaking Benjamin", "Hard Rock", "Pennsylvania", "1999", "BB", 30],
    ["Simple Plan", "Pop-Punk", "Quebec", "1999", "SP", 203],
    ["Saint Asonia", "Alt-Metal", "Ontario", "2015", "SA", 355],
    ["Sum 41", "Punk Rock", "Ontario", "1996", "SUM", 2],
    ["Citizen Soldier", "Alt-Rock", "Utah", "2016", "CS", 220],
    ["Daughtry", "Post-Grunge", "North Carolina", "2006", "DGHT", 32]
  ];
  cards = sample.map(([title, genre, loc, year, code, h]) => ({ ...blankCard(), title, genre, loc, year, code, h, s: .75 }));
  count = cards.length;
  selectedCard = 0;
  $("count").value = count;
  buildRows();
  render();
  message("Sample cards loaded.");
}

function randomise() {
  const themeKeys = Object.keys(THEMES).filter(key => key !== "custom");
  $("style").value = themeKeys[Math.floor(Math.random() * themeKeys.length)];
  $("sshape").value = [...Object.keys(STAMPS), "mixed"][Math.floor(Math.random() * (Object.keys(STAMPS).length + 1))];
  $("wear").value = 15 + Math.floor(Math.random() * 60);
  $("bwear").value = 15 + Math.floor(Math.random() * 60);
  $("ssize").value = 50 + 25 * Math.floor(Math.random() * 9);
  $("tgr").value = Math.floor(Math.random() * 40);
  $("tew").value = Math.floor(Math.random() * 50);
  $("tcr").value = Math.random() > .5 ? Math.floor(Math.random() * 50) : 0;
  $("tsc").value = Math.random() > .5 ? Math.floor(Math.random() * 40) : 0;
  $("gspread").value = 25 + Math.floor(Math.random() * 45);
  setGradientAngle(Math.floor(Math.random() * 24) * 15, false);
  message("Randomised theme and surface details.");
}

function previewSvg(index) {
  const originalIndex = selectedCard;
  selectedCard = index;
  const layout = currentLayout;
  const baseConfig = renderConfig(true);
  const page = Math.floor(index / layout.PER);
  const cardMarkup = renderCard(cards[index], index, {
    ...baseConfig,
    lay: layout,
    one: true,
    drag: false,
    cropMarks: false,
    style: pageThemes[page] || baseConfig.style,
    themeForce: pageThemes[page] || ""
  });
  selectedCard = originalIndex;
  const height = Math.max(204, Math.min(309, Math.round((SIZES[$("csize").value] || SIZES.ticket)[1] * 2.83465 / layout.K * 10) / 10));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${CW + 16} ${height + 16}" width="${(CW + 16) * 4}" height="${(height + 16) * 4}"><defs><style>${FONTCSS}</style></defs><rect x="-8" y="-8" width="${CW + 16}" height="${height + 16}" fill="#fff"/>${cardMarkup}</svg>`;
}

function sheetCardPreviewSvg(index) {
  const source = $("sheets").querySelector(`.sheet [data-ci="${index}"]`);
  if (!source) return previewSvg(index);
  const clone = source.cloneNode(true);
  clone.removeAttribute("class");
  clone.querySelectorAll(".pp").forEach(node => node.remove());
  clone.setAttribute("transform", "translate(8 8) scale(1)");
  const height = currentLayout.CH;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${CW + 16} ${height + 16}" width="${(CW + 16) * 4}" height="${(height + 16) * 4}"><defs><style>${FONTCSS}</style></defs><rect x="-8" y="-8" width="${CW + 16}" height="${height + 16}" fill="#fff"/>${clone.outerHTML}</svg>`;
}

function refreshPreview() {
  if (previewIndex < 0 || $("pv").hidden) return;
  $("pvi").innerHTML = sheetCardPreviewSvg(previewIndex);
  $("pvt").textContent = `Card ${previewIndex + 1} of ${count}`;
}

function openPreview(index) {
  previewIndex = (index + count) % count;
  if ($("pv").hidden) previousFocus = document.activeElement;
  $("pv").hidden = false;
  refreshPreview();
  $("pvx").focus();
}

function closePreview() {
  $("pv").hidden = true;
  previewIndex = -1;
  $("pvi").replaceChildren();
  if (previousFocus?.isConnected) previousFocus.focus();
}

function downloadCardSvg() {
  const markup = sheetCardPreviewSvg(previewIndex);
  triggerDownload(new Blob([markup], { type: "image/svg+xml" }), `card-${previewIndex + 1}.svg`);
}

function bindEvents() {
  $("count").addEventListener("change", event => setCount(event.target.value));
  $("page-select")?.addEventListener("change", event => {
    activePage = +event.target.value;
    $("page-theme").value = pageThemes[activePage] || "";
  });
  $("page-theme")?.addEventListener("change", event => {
    pageThemes[activePage] = event.target.value;
    scheduleRender();
  });
  $("duplicate-page")?.addEventListener("click", () => duplicateActivePage(currentLayout.PER));
  $("rows").addEventListener("click", event => {
    const row = event.target.closest(".row");
    if (row) selectCard(+row.dataset.index);
  });
  document.querySelectorAll("[data-live]").forEach(input => input.addEventListener("input", scheduleRender));
  ["marks", "bleed", "nfc", "punch", "tpl", "regmarks", "drag", "style", "sshape", "sauto", "design-border", "design-badge", "design-tear", "design-filter", "design-center", "design-halftone"].forEach(id => $(id).addEventListener("change", scheduleRender));
  ["wear", "bwear", "ssize", "gspread", "tgr", "tew", "tcr", "tsc"].forEach(id => $(id).addEventListener("input", scheduleRender));
  ["gdoors", "gside", "gstamp", "gsyear"].forEach(id => $(id).addEventListener("input", scheduleRender));
  document.querySelectorAll("[data-quick-mount]").forEach(input => {
    input.addEventListener("change", () => {
      if (input.value === "3" && input.checked) {
        document.querySelectorAll("[data-quick-mount]").forEach(other => {
          if (other !== input) other.checked = false;
        });
      } else if (input.checked) {
        const none = document.querySelector("[data-quick-mount][value='3']");
        if (none) none.checked = false;
      }
      const checked = [...document.querySelectorAll("[data-quick-mount]:checked")];
      if (checked.length > 2) {
        input.checked = false;
        message("Choose no more than 2 photo mounts.");
        return;
      }
      updateMountStatus();
      scheduleRender();
    });
  });
  document.querySelectorAll("[data-ct]").forEach(input => {
    const update = () => {
      CUSTOM[input.id.slice(3)] = input.type === "checkbox" ? input.checked : input.value;
      buildCustom();
      scheduleRender();
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  $("prev-style").addEventListener("click", () => cycleTheme(-1));
  $("next-style").addEventListener("click", () => cycleTheme(1));
  $("print").addEventListener("click", () => window.print());
  $("svg").addEventListener("click", () => exportAllSvgs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("png").addEventListener("click", () => exportAllPngs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("pdf").addEventListener("click", () => exportPdf([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("cut").addEventListener("click", () => {
    triggerDownload(new Blob([cutSvg(currentLayout, $("crad").value, $("regmarks").checked)], { type: "image/svg+xml" }), "cutter-template.svg");
    message("Cutter SVG downloaded (red = cut, blue = punch).");
  });
  $("rnd").addEventListener("click", randomise);
  $("smp").addEventListener("click", loadSamples);
  $("rst").addEventListener("click", async () => { await clearSession(); resetDefaults(); });
  $("exp").addEventListener("click", () => exportProjectJson(readSettings(), cards, count));
  $("imp").addEventListener("click", () => $("jf").click());
  $("jf").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importJson(await file.text()); }
    catch (error) { message("Could not read JSON file: " + error.message); }
    event.target.value = "";
  });
  $("jl").addEventListener("click", () => importJson($("jt").value));
  $("pvp").addEventListener("click", () => openPreview(previewIndex - 1));
  $("pvn").addEventListener("click", () => openPreview(previewIndex + 1));
  $("pvx").addEventListener("click", closePreview);
  $("pv").addEventListener("click", event => { if (event.target === $("pv")) closePreview(); });
  $("pve").addEventListener("click", () => {
    const index = previewIndex;
    closePreview();
    selectCard(index, true);
    $("rows").children[index]?.querySelector("[data-field='title']")?.focus({ preventScroll: true });
  });
  $("pvsvg").addEventListener("click", downloadCardSvg);
  $("pvpng").addEventListener("click", async () => {
    try {
      const canvas = await rasterizeSvg(sheetCardPreviewSvg(previewIndex), (CW + 16) * 12, 3400);
      await new Promise((resolve, reject) => canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Canvas export failed."));
          return;
        }
        triggerDownload(blob, `card-${previewIndex + 1}.png`);
        resolve();
      }));
    } catch (error) { message("Card PNG export failed: " + error.message); }
  });
  $("sheets").addEventListener("click", event => {
    if (event.target.closest(".pp")) return;
    const cardElement = event.target.closest("[data-ci]");
    if (cardElement) openPreview(+cardElement.dataset.ci);
  });
  document.addEventListener("keydown", event => {
    if ($("pv").hidden) return;
    if (event.key === "Escape") closePreview();
    else if (event.key === "ArrowLeft") openPreview(previewIndex - 1);
    else if (event.key === "ArrowRight") openPreview(previewIndex + 1);
  });

  const dial = $("dial");
  const angleFromEvent = event => {
    const rect = dial.getBoundingClientRect();
    return Math.atan2(event.clientX - (rect.left + rect.width / 2), -(event.clientY - (rect.top + rect.height / 2))) * 180 / Math.PI;
  };
  dial.addEventListener("pointerdown", event => {
    dial.setPointerCapture(event.pointerId);
    dial.dataset.dragging = "true";
    setGradientAngle(angleFromEvent(event), !event.shiftKey);
  });
  dial.addEventListener("pointermove", event => {
    if (dial.dataset.dragging) setGradientAngle(angleFromEvent(event), !event.shiftKey);
  });
  ["pointerup", "pointercancel"].forEach(name => dial.addEventListener(name, () => delete dial.dataset.dragging));
  dial.addEventListener("keydown", event => {
    const step = event.shiftKey ? 15 : 5;
    const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[event.key];
    if (delta !== undefined) { event.preventDefault(); setGradientAngle(gradientAngle + delta, false); }
    else if (event.key === "Home") { event.preventDefault(); setGradientAngle(180, false); }
  });

  $("sheets").addEventListener("pointerdown", event => {
    const target = event.target.closest(".pp");
    if (!target) return;
    const index = +target.dataset.ci, card = cards[index];
    if (!card?.img || !card.iw) return;
    event.preventDefault();
    dragState = { index, x: event.clientX, y: event.clientY, px: card.px || 0, py: card.py || 0, scale: target.ownerSVGElement.getScreenCTM().a };
  });
  window.addEventListener("pointermove", event => {
    if (!dragState) return;
    const card = cards[dragState.index], box = fitBox(card, currentLayout.CH);
    if (!box) return;
    const dx = (event.clientX - dragState.x) / dragState.scale;
    const dy = (event.clientY - dragState.y) / dragState.scale;
    card.px = box.mx > 0 ? Math.max(-100, Math.min(100, dragState.px + dx / box.mx * 100)) : 0;
    card.py = box.my > 0 ? Math.max(-100, Math.min(100, dragState.py + dy / box.my * 100)) : 0;
    const image = $("photo" + dragState.index);
    if (image) {
      const photoHeight = 136 + currentLayout.CH - 239;
      image.setAttribute("x", (17 + 68 - box.w / 2 + card.px / 100 * box.mx).toFixed(2));
      image.setAttribute("y", (16 + photoHeight / 2 - box.h / 2 + card.py / 100 * box.my).toFixed(2));
    }
    const row = $("rows").children[dragState.index];
    if (row) {
      row.querySelector("[data-adjust='px']").value = card.px;
      row.querySelector("[data-adjust='py']").value = card.py;
    }
  });
  ["pointerup", "pointercancel"].forEach(name => window.addEventListener(name, () => {
    if (!dragState) return;
    dragState = null;
    render();
  }));
}

function cycleTheme(direction) {
  const select = $("style");
  const options = [...select.options];
  const current = options.findIndex(option => option.value === select.value);
  select.value = options[(current + direction + options.length) % options.length].value;
  render();
}

function syncPageTools(pageCount) {
  const select = $("page-select");
  const themeSelect = $("page-theme");
  if (!select || !themeSelect) return;
  while (pageThemes.length < pageCount) pageThemes.push("");
  if (pageThemes.length > pageCount) pageThemes.length = pageCount;
  activePage = Math.min(activePage, pageCount - 1);
  select.innerHTML = Array.from({ length: pageCount }, (_, page) =>
    `<option value="${page}"${page === activePage ? " selected" : ""}>Page ${page + 1}</option>`
  ).join("");
  if (!themeSelect.options.length || themeSelect.options.length === 1) {
    themeSelect.innerHTML = `<option value="">Use global</option>${Object.entries(THEMES).map(([key, theme]) =>
      `<option value="${key}">${escapeHtml(theme.n)}</option>`
    ).join("")}`;
  }
  themeSelect.value = pageThemes[activePage] || "";
}

function duplicateActivePage(perPage) {
  const start = activePage * perPage;
  const end = Math.min(cards.length, start + perPage);
  if (start >= cards.length) return;
  const sourcePage = activePage + 1;
  const pageCards = cards.slice(start, end).map(card => ({ ...card }));
  if (cards.length + pageCards.length > MAX_CARDS) {
    message(`That would exceed the ${MAX_CARDS}-card limit. Remove or duplicate fewer cards first.`);
    return;
  }
  const insertAt = Math.min(cards.length, end);
  cards.splice(insertAt, 0, ...pageCards);
  count = Math.min(MAX_CARDS, cards.length);
  cards.length = count;
  pageThemes.splice(activePage + 1, 0, pageThemes[activePage] || "");
  activePage++;
  $("count").value = count;
  buildRows();
  render();
  message(`Duplicated page ${sourcePage} with ${pageCards.length} card${pageCards.length === 1 ? "" : "s"}.`);
}

async function init() {
  populateThemeSelect($("style"));
  syncCustomControls();
  const printStyle = document.createElement("style");
  printStyle.id = "print-page-style";
  document.head.append(printStyle);
  bindEvents();
  const saved = await loadSession();
  if (saved && Array.isArray(saved.cards) && saved.cards.length) {
    cards = saved.cards.slice(0, MAX_CARDS).map(card => ({ ...blankCard(), ...card }));
    count = Math.max(1, Math.min(MAX_CARDS, saved.count || cards.length));
    while (cards.length < count) cards.push(blankCard());
    $("count").value = count;
    applySettings(saved.settings || {});
    message("Restored your saved sheet.");
  }
  buildRows();
  render();
}

init().catch(error => {
  console.error("Could not initialize Ticket Card Studio:", error);
  message("Could not restore the studio session. Reload the page to try again.");
});

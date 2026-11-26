import { BUILTIN_THEMES, DEFAULT_CUSTOM, compileCustomTheme, getSavedCustomThemes, saveCustomThemesList } from "./themes.js?v=phase9b";
import { SAMPLE_CARDS } from "./storage.js?v=phase9b";
import { computeLayout, renderCard } from "./svg-engine.js?v=phase9b";
import { triggerDownload } from "./export.js?v=phase9b";
import { FONTCSS } from "./fonts.js?v=phase9b";
import { History } from "./history.mjs?v=phase9b";
import { bindTapTooltips, hydrateIcons } from "./icons.mjs?v=phase9b";
import { attachColorHexFields, syncColorHexFields } from "./color-controls.mjs?v=phase9b";
import { configForTheme, nextCustomThemeName, PREVIEW_OPTIONS, uniqueThemeName } from "./theme-studio-utils.mjs?v=phase9b";

const $ = id => document.getElementById(id);
const FIELD_MAP = {
  name: "ts_name", bg: "ts_bg", ink: "ts_ink", acc: "ts_acc", frame: "ts_frame", tape: "ts_tape",
  pa: "ts_pa", grad: "ts_grad", gs: "ts_gs", gl: "ts_gl"
};
const PALETTE_KEYS = ["bg", "ink", "acc", "frame", "tape", "pa", "grad", "gs", "gl"];
const PREVIEW_LAYOUT = computeLayout("a4", "ticket");
const DRAFT_HISTORY_LIMIT = 100;
const coalescingTimers = new Map();
const tileRecords = new Map();
let draftBaseline = { ...DEFAULT_CUSTOM };
let draftOriginTheme = null;
let draftPreviewUrl = "";
let selectedThemeKey = "";
let editingId = "";
let intersectionObserver;

const draftHistory = new History({ limit: DRAFT_HISTORY_LIMIT, onChange: updateHistoryControls });

function message(text) {
  $("st-msg").textContent = text;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function readForm() {
  const config = {};
  for (const [key, id] of Object.entries(FIELD_MAP)) {
    const element = $(id);
    config[key] = element.type === "checkbox" ? element.checked : element.value;
  }
  config.gl = Number(config.gl);
  return config;
}

function writeForm(config) {
  const normalized = { ...DEFAULT_CUSTOM, ...config };
  for (const [key, id] of Object.entries(FIELD_MAP)) {
    const element = $(id);
    const value = normalized[key];
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value ?? DEFAULT_CUSTOM[key] ?? "";
  }
  syncColorHexFields();
  updateGradientControls();
}

function updateGradientControls() {
  const enabled = $("ts_grad").checked;
  $("grad-opts").hidden = !enabled;
  const value = `${Math.round(Number($("ts_gl").value) * 100)}%`;
  $("ts_gl_value").textContent = value;
  $("ts_gl").setAttribute("aria-valuetext", value);
}

function samePalette(left, right) {
  return PALETTE_KEYS.every(key => left[key] === right[key]);
}

function isDraftDirty() {
  return JSON.stringify(readForm()) !== JSON.stringify(draftBaseline);
}

function confirmDiscard(action) {
  return !isDraftDirty() || window.confirm(`Discard unsaved theme changes before ${action}?`);
}

function updateHistoryControls() {
  const undo = $("ts_undo");
  const redo = $("ts_redo");
  if (!undo || !redo) return;
  undo.disabled = !draftHistory.canUndo;
  redo.disabled = !draftHistory.canRedo;
  undo.setAttribute("aria-label", draftHistory.undoLabel);
  undo.dataset.tooltip = draftHistory.undoLabel;
  redo.setAttribute("aria-label", draftHistory.redoLabel);
  redo.dataset.tooltip = draftHistory.redoLabel;
}

function recordDraftChange(key, label) {
  const coalesceKey = `draft:${key}`;
  draftHistory.record(readForm(), label, coalesceKey);
  clearTimeout(coalescingTimers.get(coalesceKey));
  coalescingTimers.set(coalesceKey, setTimeout(() => {
    draftHistory.endCoalescing(coalesceKey);
    coalescingTimers.delete(coalesceKey);
  }, 600));
}

function finishDraftChange(key) {
  const coalesceKey = `draft:${key}`;
  clearTimeout(coalescingTimers.get(coalesceKey));
  coalescingTimers.delete(coalesceKey);
  draftHistory.endCoalescing(coalesceKey);
}

function clearCoalescing() {
  for (const timer of coalescingTimers.values()) clearTimeout(timer);
  coalescingTimers.clear();
}

function getThemeItems() {
  const builtins = Object.entries(BUILTIN_THEMES).map(([id, theme], index) => ({
    key: `builtin:${id}`,
    id,
    type: "builtin",
    index,
    name: theme.n,
    config: configForTheme(id, theme, DEFAULT_CUSTOM),
    themeObj: theme
  }));
  const saved = getSavedCustomThemes().map((item, index) => ({
    key: `saved:${item.id}`,
    id: item.id,
    type: "saved",
    index: builtins.length + index,
    name: String(item.config?.name || "Untitled theme"),
    config: configForTheme(item.id, { config: item.config || {} }, DEFAULT_CUSTOM)
  }));
  return [...builtins, ...saved];
}

function sampleIndexFor(record) {
  const selection = $("ts_sample").value;
  if (selection === "auto") return record.index % SAMPLE_CARDS.length;
  const index = Number(selection);
  return Number.isInteger(index) && SAMPLE_CARDS[index] ? index : 0;
}

function sampleForDraft(record) {
  if (record) return SAMPLE_CARDS[sampleIndexFor(record)];
  const selection = $("ts_sample").value;
  const index = selection === "auto" ? 0 : Number(selection);
  return SAMPLE_CARDS[index] || SAMPLE_CARDS[0];
}

function themeForRecord(record, config, override) {
  if (override) return override;
  if (record.type === "builtin" && record.key !== selectedThemeKey) return record.themeObj;
  if (record.type === "builtin" && draftOriginTheme && samePalette(config, draftBaseline)) return draftOriginTheme;
  return compileCustomTheme(config);
}

function previewMarkup(config, themeObj, card) {
  const rendered = renderCard(card, 0, {
    ...PREVIEW_OPTIONS,
    lay: PREVIEW_LAYOUT,
    themeObj
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="${PREVIEW_LAYOUT.CH}" viewBox="0 0 170 ${PREVIEW_LAYOUT.CH}"><defs><style>${FONTCSS}</style></defs>${rendered}</svg>`;
}

function setImageSource(image, markup) {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  image.src = url;
  return url;
}

function renderTile(record, configOverride, themeOverride) {
  const config = configOverride || (record.key === selectedThemeKey ? readForm() : record.config);
  const themeObj = themeForRecord(record, config, themeOverride);
  const sampleIndex = sampleIndexFor(record);
  const renderConfig = { ...config };
  delete renderConfig.name;
  const renderTheme = { ...themeObj };
  delete renderTheme.n;
  delete renderTheme.grp;
  delete renderTheme._raw;
  const fingerprint = JSON.stringify({ config: renderConfig, theme: renderTheme, sampleIndex });
  if (record.fingerprint !== fingerprint) {
    if (record.url) URL.revokeObjectURL(record.url);
    record.markup = previewMarkup(config, themeObj, SAMPLE_CARDS[sampleIndex]);
    record.fingerprint = fingerprint;
    record.url = setImageSource(record.image, record.markup);
  } else if (record.image.src !== record.url) {
    record.image.src = record.url;
  }
  if (record.key === selectedThemeKey) $("ts-preview-image").src = record.url;
}

function nearViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom >= -240 && rect.top <= innerHeight + 240 && rect.right >= 0 && rect.left <= innerWidth;
}

function updateSelectionStyles() {
  for (const [key, record] of tileRecords) {
    const selected = key === selectedThemeKey;
    record.button.classList.toggle("is-selected", selected);
    record.button.setAttribute("aria-pressed", String(selected));
  }
  $("theme-editor").hidden = !$("theme-editor").dataset.open;
  $("theme-workspace").classList.toggle("editor-open", Boolean($("theme-editor").dataset.open));
  document.body.classList.toggle("theme-editor-open", Boolean($("theme-editor").dataset.open));
}

function openEditor() {
  $("theme-editor").dataset.open = "true";
  updateSelectionStyles();
}

function closeEditor() {
  delete $("theme-editor").dataset.open;
  updateSelectionStyles();
}

function renderGallery() {
  intersectionObserver?.disconnect();
  const items = getThemeItems();
  const liveKeys = new Set(items.map(item => item.key));
  for (const [key, record] of tileRecords) {
    if (!liveKeys.has(key)) {
      if (record.url) URL.revokeObjectURL(record.url);
      tileRecords.delete(key);
    }
  }

  const builtinGallery = $("builtin-gallery");
  const savedGallery = $("saved-gallery");
  builtinGallery.replaceChildren();
  savedGallery.replaceChildren();
  $("saved-gallery-group").hidden = !items.some(item => item.type === "saved");

  intersectionObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach(entry => {
          const record = tileRecords.get(entry.target.dataset.themeKey);
          if (record) renderTile(record);
        });
      }, { rootMargin: "240px" })
    : null;

  items.forEach(item => {
    let record = tileRecords.get(item.key);
    if (!record) {
      record = { ...item, fingerprint: "", markup: "", url: "" };
      tileRecords.set(item.key, record);
    } else {
      Object.assign(record, item);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-tile";
    button.dataset.themeKey = item.key;
    button.setAttribute("aria-label", `${item.name} theme${item.type === "saved" ? ", Custom" : ""}`);
    button.setAttribute("aria-pressed", String(item.key === selectedThemeKey));
    button.innerHTML = `<span class="theme-tile-image"><img alt="" loading="lazy" decoding="async"></span><span class="theme-tile-name">${escapeHtml(item.name)}</span>${item.type === "saved" ? '<span class="theme-custom-badge">Custom</span>' : ""}`;
    record.button = button;
    record.image = button.querySelector("img");
    if (record.url) record.image.src = record.url;
    button.addEventListener("click", () => selectTheme(item.key));
    (item.type === "saved" ? savedGallery : builtinGallery).append(button);
    if (intersectionObserver) intersectionObserver.observe(button);
    else renderTile(record);
  });
  updateSelectionStyles();
  for (const record of tileRecords.values()) {
    if (nearViewport(record.button) && record.fingerprint) renderTile(record);
  }
}

function setDraft(config, { baseline = config, originTheme = null, themeKey = "", savedId = "" } = {}) {
  clearCoalescing();
  selectedThemeKey = themeKey;
  editingId = savedId;
  draftOriginTheme = originTheme;
  writeForm(config);
  draftBaseline = readForm();
  const normalizedBaseline = { ...DEFAULT_CUSTOM, ...baseline };
  draftBaseline = Object.fromEntries(Object.keys(FIELD_MAP).map(key => [key, normalizedBaseline[key]]));
  draftHistory.initialize(readForm());
  $("theme-editor-title").textContent = String(config.name || "New theme");
  $("ts_update").hidden = !editingId;
  $("ts_duplicate").hidden = !editingId;
  $("ts_delete").hidden = !editingId;
  updateSelectionStyles();
  openEditor();
  renderDraftPreview();
}

function selectTheme(key) {
  if (key === selectedThemeKey) {
    openEditor();
    return;
  }
  if (!confirmDiscard("switching themes")) return;
  const record = tileRecords.get(key);
  if (!record) return;
  if (selectedThemeKey) {
    const previous = tileRecords.get(selectedThemeKey);
    if (previous && previous.type === "builtin") renderTile(previous, previous.config, previous.themeObj);
    else if (previous) renderTile(previous, previous.config);
  }
  const config = { ...record.config };
  setDraft(config, {
    baseline: config,
    originTheme: record.type === "builtin" ? record.themeObj : null,
    themeKey: key,
    savedId: record.type === "saved" ? record.id : ""
  });
  message(`Editing "${record.name}".`);
}

function renderDraftPreview() {
  updateGradientControls();
  const config = readForm();
  const selected = tileRecords.get(selectedThemeKey);
  if (selected) {
    renderTile(selected, config);
    return;
  }
  const markup = previewMarkup(config, compileCustomTheme(config), sampleForDraft(null));
  if (draftPreviewUrl) URL.revokeObjectURL(draftPreviewUrl);
  draftPreviewUrl = setImageSource($("ts-preview-image"), markup);
}

function bindDraftControls() {
  document.querySelectorAll("[data-ts]").forEach(element => {
    const key = Object.keys(FIELD_MAP).find(field => FIELD_MAP[field] === element.id);
    const label = element.id === "ts_name" ? "change theme name"
      : element.id === "ts_gl" ? "change accent lightness"
        : element.type === "checkbox" ? `toggle ${element.id === "ts_grad" ? "gradient background" : "photo accent"}`
          : `change ${element.labels?.[0]?.textContent?.trim().toLowerCase() || "theme colour"}`;
    const historyKey = key || element.id;
    element.addEventListener("input", () => {
      renderDraftPreview();
      recordDraftChange(historyKey, label);
    });
    element.addEventListener("change", () => {
      renderDraftPreview();
      if (!draftHistory.isCoalescing(`draft:${historyKey}`)) recordDraftChange(historyKey, label);
      finishDraftChange(historyKey);
    });
    element.addEventListener("blur", () => finishDraftChange(historyKey));
  });
}

function existingThemeNames(exceptId = "") {
  return [
    ...Object.values(BUILTIN_THEMES).map(theme => theme.n),
    ...getSavedCustomThemes()
      .filter(theme => theme.id !== exceptId)
      .map(theme => theme.config?.name || "Untitled theme")
  ];
}

function createThemeId() {
  return globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persistTheme(item, replaceId = "") {
  const themes = getSavedCustomThemes();
  if (replaceId) {
    const index = themes.findIndex(theme => theme.id === replaceId);
    if (index < 0) {
      message("This saved theme no longer exists. Reload the library before updating.");
      return false;
    }
    themes[index] = item;
  } else {
    themes.push(item);
  }
  if (!saveCustomThemesList(themes)) {
    message("Could not save the theme library. Check browser storage availability and try again.");
    return false;
  }
  return true;
}

function afterSave(item, status) {
  editingId = item.id;
  selectedThemeKey = `saved:${item.id}`;
  draftOriginTheme = null;
  $("theme-editor-title").textContent = String(item.config.name || "New theme");
  $("theme-editor-title").textContent = String(item.config.name || "New theme");
  $("ts_update").hidden = false;
  $("ts_duplicate").hidden = false;
  $("ts_delete").hidden = false;
  draftBaseline = { ...item.config };
  writeForm(item.config);
  draftHistory.initialize(readForm());
  renderGallery();
  openEditor();
  renderDraftPreview();
  message(status);
}

function saveAsNewTheme() {
  const config = readForm();
  config.name = nextCustomThemeName(config.name, existingThemeNames());
  const item = { id: createThemeId(), config };
  if (!persistTheme(item)) return;
  afterSave(item, `Saved "${config.name}" as a new custom theme.`);
}

function updateTheme() {
  if (!editingId) return;
  const config = readForm();
  config.name = uniqueThemeName(config.name, existingThemeNames(editingId));
  const item = { id: editingId, config };
  if (!persistTheme(item, editingId)) return;
  afterSave(item, `Updated "${config.name}".`);
}

function duplicateTheme() {
  if (!editingId) return;
  const config = readForm();
  config.name = nextCustomThemeName(config.name, existingThemeNames());
  const item = { id: createThemeId(), config };
  if (!persistTheme(item)) return;
  afterSave(item, `Duplicated as "${config.name}".`);
}

function deleteTheme() {
  if (!editingId) return;
  const target = getSavedCustomThemes().find(theme => theme.id === editingId);
  if (!target) {
    message("This saved theme no longer exists.");
    return;
  }
  const prompt = isDraftDirty()
    ? `Delete "${target.config?.name || "Untitled theme"}" and discard its unsaved changes?`
    : `Delete "${target.config?.name || "Untitled theme"}"?`;
  if (!window.confirm(prompt)) return;
  const remaining = getSavedCustomThemes().filter(theme => theme.id !== editingId);
  if (!saveCustomThemesList(remaining)) {
    message("Could not delete the theme. Check browser storage availability and try again.");
    return;
  }
  selectedThemeKey = "";
  setDraft(DEFAULT_CUSTOM, { baseline: DEFAULT_CUSTOM });
  closeEditor();
  renderGallery();
  message("Theme deleted.");
}

function newTheme() {
  if (!confirmDiscard("starting a new draft")) return;
  setDraft(DEFAULT_CUSTOM, { baseline: DEFAULT_CUSTOM });
  message("Started a new theme draft.");
}

function exportTheme() {
  triggerDownload(new Blob([JSON.stringify({ config: readForm() }, null, 2)], { type: "application/json" }), "ticket-theme.json");
  message("Theme JSON exported.");
}

function normalizeImportedTheme(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("The file must contain a theme object.");
  const normalized = { ...DEFAULT_CUSTOM };
  for (const [key, id] of Object.entries(FIELD_MAP)) {
    const element = $(id);
    if (Object.hasOwn(config, key)) {
      normalized[key] = element.type === "checkbox" ? Boolean(config[key]) : config[key];
    }
  }
  if (typeof normalized.name !== "string") throw new Error("Theme name must be text.");
  normalized.name = normalized.name.trim().slice(0, 60) || "Untitled theme";
  for (const key of ["bg", "ink", "acc", "frame", "tape", "gs"]) {
    if (typeof normalized[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(normalized[key])) {
      throw new Error(`${key} must be a 6-digit hex colour.`);
    }
  }
  normalized.gl = Number(normalized.gl);
  if (!Number.isFinite(normalized.gl)) normalized.gl = DEFAULT_CUSTOM.gl;
  normalized.gl = Math.max(0.2, Math.min(0.85, normalized.gl));
  normalized.pa = normalized.pa === true || normalized.pa === "true" || normalized.pa === 1 || normalized.pa === "1";
  normalized.grad = normalized.grad === true || normalized.grad === "true" || normalized.grad === 1 || normalized.grad === "1";
  normalized.name = uniqueThemeName(normalized.name, existingThemeNames());
  return normalized;
}

async function importTheme(file) {
  if (!confirmDiscard("importing a theme")) return;
  try {
    const payload = JSON.parse(await file.text());
    const normalized = normalizeImportedTheme(payload.config || payload);
    setDraft(normalized, { baseline: DEFAULT_CUSTOM });
    message(`Imported "${normalized.name}" as a draft. Save it to add it to the library.`);
  } catch (error) {
    message(`Could not import theme: ${error instanceof Error ? error.message : "Invalid theme file."}`);
  }
}

function isTextEditingTarget(target) {
  if (!(target instanceof HTMLElement) || target.isContentEditable) return Boolean(target?.isContentEditable);
  if (target.tagName === "TEXTAREA") return true;
  if (target.tagName !== "INPUT") return false;
  return ["text", "search", "url", "email", "password", "tel"].includes(target.type);
}

function bindKeyboardHistory() {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("theme-editor").dataset.open) {
      closeEditor();
      return;
    }
    if (!(event.metaKey || event.ctrlKey) || event.altKey || isTextEditingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === "z" && event.shiftKey) {
      event.preventDefault();
      redoDraft();
    } else if (key === "z") {
      event.preventDefault();
      undoDraft();
    } else if (key === "y") {
      event.preventDefault();
      redoDraft();
    }
  });
}

function undoDraft() {
  const result = draftHistory.undo();
  if (result) {
    writeForm(result.snapshot);
    renderDraftPreview();
  }
}

function redoDraft() {
  const result = draftHistory.redo();
  if (result) {
    writeForm(result.snapshot);
    renderDraftPreview();
  }
}

function bind() {
  $("ts_sample").addEventListener("change", () => {
    for (const record of tileRecords.values()) {
      if (nearViewport(record.button) || record.key === selectedThemeKey) renderTile(record);
    }
    if (selectedThemeKey) renderDraftPreview();
    else if (!$("theme-editor").hidden) renderDraftPreview();
  });
  $("ts_new_btn").addEventListener("click", newTheme);
  $("ts_save_new").addEventListener("click", saveAsNewTheme);
  $("ts_update").addEventListener("click", updateTheme);
  $("ts_duplicate").addEventListener("click", duplicateTheme);
  $("ts_delete").addEventListener("click", deleteTheme);
  $("ts_undo").addEventListener("click", undoDraft);
  $("ts_redo").addEventListener("click", redoDraft);
  $("ts_close").addEventListener("click", closeEditor);
  $("ts_export_btn").addEventListener("click", exportTheme);
  $("ts_import_btn").addEventListener("click", () => $("ts_import_file").click());
  $("ts_import_file").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) importTheme(file);
    event.target.value = "";
  });
  window.addEventListener("beforeunload", event => {
    if (!isDraftDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  bindDraftControls();
  bindKeyboardHistory();
}

function init() {
  hydrateIcons();
  bindTapTooltips();
  attachColorHexFields();
  $("ts_sample").insertAdjacentHTML("beforeend", SAMPLE_CARDS.map((card, index) => `<option value="${index}">${escapeHtml(card.title)}</option>`).join(""));
  writeForm(DEFAULT_CUSTOM);
  draftBaseline = readForm();
  draftHistory.initialize(readForm());
  bind();
  renderGallery();
  updateHistoryControls();
}

init();

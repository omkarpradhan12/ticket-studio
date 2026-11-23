import { BUILTIN_THEMES, DEFAULT_CUSTOM, compileCustomTheme, getSavedCustomThemes, saveCustomThemesList } from "./themes.js";
import { SAMPLE_CARDS } from "./storage.js";
import { computeLayout, renderCard } from "./svg-engine.js";
import { triggerDownload } from "./export.js";
import { FONTCSS } from "./fonts.js";

const $ = id => document.getElementById(id);
const FIELD_MAP = {
  name: "ts_name", bg: "ts_bg", ink: "ts_ink", acc: "ts_acc", frame: "ts_frame", tape: "ts_tape",
  pa: "ts_pa", grad: "ts_grad", gs: "ts_gs", gl: "ts_gl"
};
let draft = { ...DEFAULT_CUSTOM };
let editingId = "";
let previewCard = { ...SAMPLE_CARDS[0] };

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
  draft = { ...DEFAULT_CUSTOM, ...config };
  for (const [key, id] of Object.entries(FIELD_MAP)) {
    const element = $(id);
    const value = draft[key];
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value ?? DEFAULT_CUSTOM[key] ?? "";
  }
  $("grad-opts").style.display = draft.grad ? "grid" : "none";
  renderPreview();
}

function configForTheme(key, theme) {
  if (theme._raw) return { ...DEFAULT_CUSTOM, ...theme._raw };
  return {
    ...DEFAULT_CUSTOM,
    name: theme.n || key,
    bg: theme.grad ? (theme.bg || theme.gs) : theme.bg,
    ink: theme.ink,
    acc: theme.fixed || "#e8833a",
    frame: theme.frame || theme.ink,
    tape: theme.tape || DEFAULT_CUSTOM.tape,
    pa: !theme.fixed,
    grad: Boolean(theme.grad),
    gs: theme.gs || theme.bg,
    gl: theme.gl ?? .45
  };
}

function renderPreview() {
  const config = readForm();
  $("grad-opts").style.display = config.grad ? "grid" : "none";
  const theme = compileCustomTheme(config);
  const layout = computeLayout("a4", "ticket");
  const markup = renderCard(previewCard, 0, {
    lay: layout,
    one: true,
    drag: false,
    cropMarks: false,
    style: "custom",
    themeObj: theme,
    doors: "Doors 7PM",
    side: "Preview",
    stamp: "Soul Fuel",
    stampYear: "2026",
    stampSize: 100,
    stampShape: "round",
    stampWear: 25,
    borderWear: 20,
    stampAuto: true,
    gradientAngle: 180,
    gradientSpread: 32,
    titleFont: "pirata",
    grain: 12,
    edgeWear: 0,
    creases: 0,
    scuffs: 0,
    serials: false,
    nfc: true,
    punchHole: false,
    borderStyle: 0,
    yearBadge: 0,
    tearStyle: 0,
    photoFilter: 0,
    photoMounts: [0],
    centerTitle: false,
    halftone: false,
    bleed: false,
    cropMarks: false
  });
  const cardHeight = layout.CH;
  $("ts-preview-svg").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 ${cardHeight}" role="img" aria-label="Live ticket theme preview"><defs><style>${FONTCSS}</style></defs>${markup}</svg>`;
}

function renderSavedList() {
  const saved = getSavedCustomThemes();
  $("saved-list").innerHTML = saved.length ? saved.map(item => {
    const config = item.config || {};
    return `<div class="saved-theme-item">
      <div><strong>${escapeHtml(config.name || "Untitled theme")}</strong><div class="swatch-dots" aria-label="Theme colors">
        <span class="swatch-dot" style="background:${escapeHtml(config.bg || "#fff")}"></span>
        <span class="swatch-dot" style="background:${escapeHtml(config.ink || "#000")}"></span>
        <span class="swatch-dot" style="background:${escapeHtml(config.acc || "#e8833a")}"></span>
      </div></div>
      <div class="ctrl-flex">
        <button class="g sm" type="button" data-edit="${escapeHtml(item.id)}">Edit</button>
        <button class="g sm" type="button" data-delete="${escapeHtml(item.id)}">Delete</button>
      </div>
    </div>`;
  }).join("") : '<p class="hint">No saved themes yet. Save your first design above.</p>';
  $("saved-list").querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => {
    const theme = saved.find(item => item.id === button.dataset.edit);
    if (!theme) return;
    editingId = theme.id;
    writeForm(theme.config || {});
    message(`Editing "${theme.config?.name || "theme"}". Save to update it.`);
  }));
  $("saved-list").querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => {
    const next = getSavedCustomThemes().filter(item => item.id !== button.dataset.delete);
    saveCustomThemesList(next);
    if (editingId === button.dataset.delete) editingId = "";
    renderSavedList();
    message("Theme deleted.");
  }));
}

function populateCloneOptions() {
  const select = $("ts_clone");
  const saved = getSavedCustomThemes();
  const builtinOptions = Object.entries(BUILTIN_THEMES).map(([key, theme]) => `<option value="builtin:${key}">${escapeHtml(theme.n)}</option>`).join("");
  const savedOptions = saved.map(theme => `<option value="saved:${escapeHtml(theme.id)}">${escapeHtml(theme.config?.name || "Untitled theme")}</option>`).join("");
  select.innerHTML = `<optgroup label="Built-in Themes">${builtinOptions}</optgroup>${saved.length ? `<optgroup label="Saved Custom Themes">${savedOptions}</optgroup>` : ""}`;
}

function saveDraft() {
  const config = readForm();
  const saved = getSavedCustomThemes();
  const id = editingId || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const existing = saved.findIndex(item => item.id === id);
  const item = { id, config };
  if (existing >= 0) saved[existing] = item;
  else saved.push(item);
  saveCustomThemesList(saved);
  editingId = id;
  populateCloneOptions();
  renderSavedList();
  message(`Saved "${config.name || "Untitled theme"}" to the shared theme library.`);
}

function exportTheme() {
  triggerDownload(new Blob([JSON.stringify({ config: readForm() }, null, 2)], { type: "application/json" }), "ticket-theme.json");
  message("Theme JSON exported.");
}

async function importTheme(file) {
  try {
    const payload = JSON.parse(await file.text());
    const config = payload.config || payload;
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("The file must contain a theme object.");
    writeForm({ ...DEFAULT_CUSTOM, ...config });
    editingId = "";
    message("Theme imported. Save it to add it to your library.");
  } catch (error) {
    message("Could not import theme: " + error.message);
  }
}

function bind() {
  document.querySelectorAll("[data-ts]").forEach(element => {
    element.addEventListener("input", renderPreview);
    element.addEventListener("change", renderPreview);
  });
  $("ts_clone_btn").addEventListener("click", () => {
    const [type, key] = $("ts_clone").value.split(":");
    const theme = type === "builtin" ? BUILTIN_THEMES[key] : getSavedCustomThemes().find(item => item.id === key)?.config;
    if (!theme) { message("That theme is no longer available."); return; }
    editingId = "";
    writeForm(configForTheme(key, theme));
    message(`Loaded "${theme.n || theme.name || "theme"}" as a new draft.`);
  });
  $("ts_save_btn").addEventListener("click", saveDraft);
  $("ts_new_btn").addEventListener("click", () => {
    editingId = "";
    writeForm(DEFAULT_CUSTOM);
    message("Started a new theme draft.");
  });
  $("ts_export_btn").addEventListener("click", exportTheme);
  $("ts_import_btn").addEventListener("click", () => $("ts_import_file").click());
  $("ts_import_file").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) importTheme(file);
    event.target.value = "";
  });
  $("ts_sample").addEventListener("change", () => {
    const sample = SAMPLE_CARDS[Number($("ts_sample").value)] || SAMPLE_CARDS[0];
    previewCard = { ...sample };
    renderPreview();
  });
}

function init() {
  populateCloneOptions();
  const sampleSelect = $("ts_sample");
  sampleSelect.innerHTML = SAMPLE_CARDS.map((card, index) => `<option value="${index}">${escapeHtml(card.title)}</option>`).join("");
  bind();
  writeForm(DEFAULT_CUSTOM);
  renderSavedList();
}

init();

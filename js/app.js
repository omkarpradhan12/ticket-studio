import { DEFAULT_CARDS, SET0, blankCard, loadSession, persistSession, clearSession } from "./storage.js?v=phase9";
import { BUILTIN_THEMES, CUSTOM, DEFAULT_CUSTOM, THEMES, buildCustom, getGroupedThemes, populateThemeSelect, renderThemeThumbSvg } from "./themes.js?v=phase9";
import { processImageFile, processImageUrl, sampleImageColor, hslToHex, hexToHS } from "./image-utils.js?v=phase9";
import { CW, SIZES, STAMPS, computeLayout, fitBox, renderCard, tplSvg, cutSvg, regMarksSvg, abbr, hueOf } from "./svg-engine.js?v=phase9";
import { exportAllSvgs, exportAllPngs, exportPdf, exportProjectJson, triggerDownload, rasterizeSvg } from "./export.js?v=phase9";
import { FONTCSS, injectFonts } from "./fonts.js?v=phase9";
import { History } from "./history.mjs?v=phase9";
import { bindTapTooltips, hydrateIcons, iconMarkup } from "./icons.mjs?v=phase9";
import { attachColorHexFields, syncColorHexFields } from "./color-controls.mjs?v=phase9";
import {
  BORDER_STYLES,
  compactBorderOverrides,
  getBorderPresets,
  getBorderStyleMeta,
  hasBorderOverrides,
  renderBorderSwatchSvg,
  resolveBorderConfig,
  sanitizeBorderPatch,
  saveBorderPresetsList,
  uniquePresetName
} from "./borders.mjs?v=phase9";
import {
  SKINDS,
  STAMP_OPTIONS,
  clampStampNorm,
  clampStampScale,
  compactStampStyle,
  getStampPresets,
  getStampShapeName,
  hasStampStyleOverrides,
  normalizeAngle,
  renderStampSwatchSvg,
  resolveStampStyle,
  resolveStampTransform,
  sanitizeStampOverride,
  sanitizeStampStyle,
  saveStampPresetsList,
  snapStampNorm,
  uniqueStampPresetName
} from "./stamps.mjs?v=phase9";
import {
  MAX_CARDS_LIMIT,
  blendHex,
  clearCardStylingRecord,
  hasCustomCardStyling,
  hslObjectToHex,
  normalizeHex,
  sanitizeCardStyleOverrides
} from "./card-styles.mjs?v=phase9";
import {
  generateSeed,
  getSurprisePrefs,
  saveSurprisePrefs,
  surpriseCardsBatch
} from "./randomiser.mjs?v=phase9";
import {
  cardSearchHaystack,
  debounce,
  filterCardIndices,
  formatSearchCount
} from "./search.mjs?v=phase9";

const MOUNT_NAMES = {
  "0": "Tape",
  "1": "Pins",
  "2": "Corners",
  "3": "None",
  "4": "Washi tape",
  "5": "Brads",
  "6": "Paperclip",
  "7": "Staples",
  "8": "Wax seal"
};

const $ = id => document.getElementById(id);
const MAX_CARDS = MAX_CARDS_LIMIT;
const SURPRISE_STRENGTH_LABELS = ["Subtle", "Normal", "Wild"];
const HISTORY_LIMIT = 100;
const SETTINGS_FIELDS = {
  sheetTitle: "sheet-title",
  style: "style", titleFont: "tfont", titleScale: "title-size", doors: "gdoors", side: "gside",
  stamp: "gstamp", stampYear: "gsyear", stampSize: "ssize",
  stampColor: "scol", stamp2: "gs2", stampWear: "wear", borderWear: "bwear",
  gradientSpread: "gspread", paper: "paper", cardSize: "csize", cutterCorners: "crad",
  grain: "tgr", edgeWear: "tew", creases: "tcr", scuffs: "tsc",
  yearBadge: "design-badge", tearStyle: "design-tear", photoFilter: "design-filter"
};
const CHECK_FIELDS = {
  cropMarks: "marks", bleed: "bleed", nfc: "nfc", cutTemplate: "tpl",
  serials: "serial", stampAuto: "sauto", regMarks: "regmarks", punchHole: "punch",
  centerTitle: "design-center", halftone: "design-halftone"
};
const CUSTOM_FIELDS = ["bg", "ink", "acc", "tape", "pa"];

const initialCards = DEFAULT_CARDS.map(c => ({ ...c }));
const studioState = {
  cards: initialCards,
  count: initialCards.length,
  selectedCard: 0,
  activePage: 0,
  pageThemes: [],
  gradientAngle: SET0.gradientAngle,
  borderStyle: SET0.borderStyle,
  borderConfig: undefined,
  stampShape: SET0.stampShape,
  stampStyle: undefined,
  quickColors: undefined,
  settings: { customTheme: { ...CUSTOM } }
};
let lastSwatchThemeKey = "";
let lastStampSwatchKey = "";
let lastBuiltRowsPerPage = 0;
const cardIds = new WeakMap();
let nextCardId = 0;
let currentLayout;
let renderFrame = 0;
let saveTimer;
let dragState = null;
let stampDragState = null;
let moveStampsMode = false;
let selectedStampIndex = 0;
let previewIndex = -1;
let previousFocus = null;
let historyReady = false;
let batchImportInProgress = false;
let undoToastTimer;
let previewZoom = 1;
// Transient local card-list filter (never stored in studioState, history, layout, or exports)
let cardSearchQuery = "";
let lastSurpriseSeed = generateSeed();
let pendingPhotoUploadIndex = -1;
let sharedPhotoFileInput = null;
const coalescingTimers = new Map();
const history = new History({ limit: HISTORY_LIMIT, onChange: updateHistoryControls });

function cardIdentity(card) {
  let id = cardIds.get(card);
  if (!id) {
    id = ++nextCardId;
    cardIds.set(card, id);
  }
  return id;
}

function updateCard(index, changes) {
  const current = studioState.cards[index];
  if (!current) return;
  const next = { ...current, ...changes };
  cardIds.set(next, cardIdentity(current));
  studioState.cards = studioState.cards.map((card, cardIndex) => cardIndex === index ? next : card);
  return next;
}
function readPageThemes() {
  return studioState.pageThemes.slice();
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
  settings.gradientAngle = studioState.gradientAngle;
  settings.borderStyle = studioState.borderStyle;
  if (studioState.borderConfig) settings.border = { ...studioState.borderConfig };
  settings.stampShape = studioState.stampShape;
  if (studioState.stampStyle) settings.stampStyle = { ...studioState.stampStyle };
  settings.customTheme = { ...studioState.settings.customTheme };
  if (studioState.quickColors) {
    settings.quickColors = {
      ...studioState.quickColors,
      ...(Array.isArray(studioState.quickColors.gradStops) ? { gradStops: studioState.quickColors.gradStops.slice() } : {})
    };
  }
  settings.pageThemes = readPageThemes();
  settings.photoMounts = [...document.querySelectorAll("[data-quick-mount]:checked")].map(input => Number(input.value)).slice(0, 2);
  $("title-size-value").textContent = `${settings.titleScale}%`;
  $("title-size").setAttribute("aria-valuetext", `${settings.titleScale}%`);
  studioState.settings = settings;
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
    studioState.settings = {
      ...studioState.settings,
      customTheme: { ...settings.customTheme }
    };
    Object.assign(CUSTOM, studioState.settings.customTheme);
    for (const key of CUSTOM_FIELDS) {
      const el = $("ct_" + key);
      if (el) el.type === "checkbox"
        ? (el.checked = Boolean(studioState.settings.customTheme[key]))
        : (el.value = studioState.settings.customTheme[key]);
    }
    buildCustom();
  }
  if (settings.gradientAngle !== undefined && Number.isFinite(+settings.gradientAngle)) {
    studioState.gradientAngle = ((+settings.gradientAngle % 360) + 360) % 360;
  }
  if (settings.borderStyle !== undefined) {
    const styleId = Number.parseInt(settings.borderStyle, 10);
    studioState.borderStyle = Number.isInteger(styleId) && styleId >= 0 && styleId < BORDER_STYLES.length ? styleId : 0;
  }
  studioState.borderConfig = settings.border && typeof settings.border === "object"
    ? compactBorderOverrides(studioState.borderStyle, settings.border)
    : undefined;
  if (settings.stampShape !== undefined) {
    const shapeId = String(settings.stampShape || "round");
    studioState.stampShape = STAMP_OPTIONS.some(o => o.id === shapeId) ? shapeId : "round";
  }
  studioState.stampStyle = settings.stampStyle && typeof settings.stampStyle === "object"
    ? compactStampStyle(settings.stampStyle)
    : undefined;
  if (Array.isArray(settings.pageThemes)) studioState.pageThemes = settings.pageThemes.map(theme => String(theme || ""));
  studioState.quickColors = settings.quickColors && typeof settings.quickColors === "object"
    ? {
      ...settings.quickColors,
      ...(Array.isArray(settings.quickColors.gradStops) ? { gradStops: settings.quickColors.gradStops.slice() } : {})
    }
    : undefined;
  $("needle").style.transform = `rotate(${studioState.gradientAngle}deg)`;
  $("dial").setAttribute("aria-valuenow", studioState.gradientAngle);
  $("gav").textContent = studioState.gradientAngle + "°";
  if (settings.style && !allThemes[settings.style]) {
    const found = Object.keys(THEMES).find(key => THEMES[key].n.toLowerCase() === String(settings.style).toLowerCase());
    if (found) $("style").value = found;
  }
  syncBorderControls();
  syncStampControls();
  syncQuickColorsControls();
  syncThemeDropdown();
  studioState.settings = readSettings();
  syncColorHexFields();
}

function renderConfig(one = false) {
  const settings = studioState.settings;
  return {
    lay: currentLayout,
    style: settings.style,
    one,
    bleed: settings.bleed,
    cropMarks: settings.cropMarks,
    regMarks: settings.regMarks,
    stampWear: settings.stampWear,
    borderWear: settings.borderWear,
    stampSize: settings.stampSize,
    stampShape: settings.stampShape,
    stampStyle: settings.stampStyle,
    stamp: settings.stamp,
    stampYear: settings.stampYear,
    stampColor: settings.stampColor,
    stampAuto: settings.stampAuto,
    stamp2: settings.stamp2.trim(),
    titleFont: settings.titleFont,
    titleScale: settings.titleScale / 100,
    gradientAngle: settings.gradientAngle,
    gradientSpread: settings.gradientSpread,
    grain: settings.grain,
    edgeWear: settings.edgeWear,
    creases: settings.creases,
    scuffs: settings.scuffs,
    serials: settings.serials,
    nfc: settings.nfc,
    punchHole: settings.punchHole,
    borderStyle: settings.borderStyle,
    border: settings.border,
    borderScope: one ? "pv" : "",
    quickColors: settings.quickColors,
    yearBadge: settings.yearBadge,
    tearStyle: settings.tearStyle,
    photoFilter: settings.photoFilter,
    photoMounts: settings.photoMounts,
    centerTitle: settings.centerTitle,
    halftone: settings.halftone,
    pageThemes: settings.pageThemes,
    doors: settings.doors,
    side: settings.side,
    drag: $("drag").checked,
    moveStamps: moveStampsMode && !one,
    selectedCard: studioState.selectedCard,
    selectedStamp: selectedStampIndex
  };
}

function captureSnapshot() {
  const settings = readSettings();
  return {
    version: 1,
    state: {
      cards: studioState.cards.slice(),
      count: studioState.count,
      selectedCard: studioState.selectedCard,
      activePage: studioState.activePage,
      pageThemes: studioState.pageThemes.slice(),
      gradientAngle: studioState.gradientAngle,
      settings: {
        ...settings,
        ...(settings.border ? { border: { ...settings.border } } : {}),
        ...(settings.stampStyle ? { stampStyle: { ...settings.stampStyle } } : {}),
        customTheme: { ...settings.customTheme },
        photoMounts: settings.photoMounts.slice()
      }
    }
  };
}

function snapshotsEqual(left, right) {
  if (!left || !right || left.version !== right.version) return false;
  const a = left.state, b = right.state;
  if (a.count !== b.count || a.selectedCard !== b.selectedCard
    || a.activePage !== b.activePage || a.gradientAngle !== b.gradientAngle
    || a.cards.length !== b.cards.length || a.pageThemes.length !== b.pageThemes.length) return false;
  if (a.cards.some((card, index) => card !== b.cards[index])
    || a.pageThemes.some((theme, index) => theme !== b.pageThemes[index])) return false;
  const settingKeys = new Set([...Object.keys(a.settings), ...Object.keys(b.settings)]);
  for (const key of settingKeys) {
    const first = a.settings[key], second = b.settings[key];
    if (Array.isArray(first) && Array.isArray(second)) {
      if (first.length !== second.length || first.some((value, index) => value !== second[index])) return false;
    } else if (first && second && typeof first === "object" && typeof second === "object") {
      const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
      if ([...keys].some(name => first[name] !== second[name])) return false;
    } else if (first !== second) return false;
  }
  return true;
}

function recordHistory(label, coalesceKey = null) {
  if (!historyReady) return false;
  const snapshot = captureSnapshot();
  if (snapshotsEqual(history.present, snapshot)) return false;
  history.record(snapshot, label, coalesceKey);
  return true;
}

function clearCoalescingTimers() {
  for (const timer of coalescingTimers.values()) clearTimeout(timer);
  coalescingTimers.clear();
}

function recordContinuous(label, coalesceKey) {
  if (!recordHistory(label, coalesceKey) && !history.isCoalescing(coalesceKey)) return;
  clearTimeout(coalescingTimers.get(coalesceKey));
  coalescingTimers.set(coalesceKey, setTimeout(() => {
    history.endCoalescing(coalesceKey);
    coalescingTimers.delete(coalesceKey);
  }, 600));
}

function finishContinuous(label, coalesceKey) {
  clearTimeout(coalescingTimers.get(coalesceKey));
  coalescingTimers.delete(coalesceKey);
  if (!history.isCoalescing(coalesceKey)) recordHistory(label, coalesceKey);
  history.endCoalescing(coalesceKey);
}

function bindContinuousHistory(element, label, coalesceKey) {
  element.addEventListener("input", () => recordContinuous(label, coalesceKey));
  ["change", "blur", "pointerup", "pointercancel"].forEach(name => {
    element.addEventListener(name, () => finishContinuous(label, coalesceKey));
  });
}

function recordDiscrete(label) {
  if (!historyReady) return;
  clearCoalescingTimers();
  history.endCoalescing();
  recordHistory(label);
}

function updateHistoryControls(current = history) {
  const undo = $("undo"), redo = $("redo");
  if (!undo || !redo) return;
  undo.disabled = !current.canUndo;
  redo.disabled = !current.canRedo;
  undo.setAttribute("aria-label", current.undoLabel);
  undo.dataset.tooltip = current.undoLabel;
  redo.setAttribute("aria-label", current.redoLabel);
  redo.dataset.tooltip = current.redoLabel;
}

function showUndoToast(text) {
  const toast = $("undo-toast");
  $("undo-toast-message").textContent = text;
  toast.hidden = false;
  clearTimeout(undoToastTimer);
  undoToastTimer = setTimeout(() => { toast.hidden = true; }, 8000);
}

function hideUndoToast() {
  clearTimeout(undoToastTimer);
  $("undo-toast").hidden = true;
}

function focusedRowControl() {
  const element = document.activeElement;
  const row = element?.closest?.(".row");
  if (!row) return null;
  const attribute = ["data-field", "data-adjust", "data-option", "data-url", "data-accent"]
    .find(name => element.hasAttribute(name));
  if (!attribute) return null;
  const supportsSelection = element.tagName === "TEXTAREA"
    || (element.tagName === "INPUT" && ["text", "search", "url", "tel", "password"].includes(element.type));
  return {
    index: Number(row.dataset.index),
    attribute,
    value: element.getAttribute(attribute),
    selectionStart: supportsSelection ? element.selectionStart : null,
    selectionEnd: supportsSelection ? element.selectionEnd : null
  };
}

function getCardRowEl(index) {
  return $("rows")?.querySelector(`.row[data-index="${index}"]`) || null;
}

function restoreRowFocus(focus) {
  if (!focus) return;
  const row = getCardRowEl(focus.index);
  const control = [...(row?.querySelectorAll(`[${focus.attribute}]`) || [])]
    .find(element => element.getAttribute(focus.attribute) === focus.value);
  if (!control) return;
  control.focus({ preventScroll: true });
  if (focus.selectionStart !== null && focus.selectionEnd !== null) {
    control.setSelectionRange(focus.selectionStart, focus.selectionEnd);
  }
}

function applySnapshot(snapshot) {
  if (snapshot?.version !== 1 || !snapshot.state) throw new TypeError("Invalid Sheet Editor history snapshot.");
  const focus = focusedRowControl();
  const expandedCardIds = new Set([...document.querySelectorAll(".row")].flatMap(row => {
    const card = studioState.cards[Number(row.dataset.index)];
    return row.querySelector("details.adj")?.open && card ? [cardIdentity(card)] : [];
  }));
  const scrollPosition = { x: window.scrollX, y: window.scrollY, rows: $("rows").scrollTop };
  const previewCardId = previewIndex >= 0 && studioState.cards[previewIndex]
    ? cardIdentity(studioState.cards[previewIndex])
    : null;
  const state = snapshot.state;
  studioState.cards = state.cards.slice();
  studioState.count = state.count;
  studioState.selectedCard = state.selectedCard;
  studioState.activePage = state.activePage;
  studioState.pageThemes = state.pageThemes.slice();
  studioState.gradientAngle = state.gradientAngle;
  $("count").value = state.count;
  applySettings(state.settings);
  studioState.activePage = state.activePage;
  if (previewIndex >= 0) {
    const restoredIndex = previewCardId === null
      ? -1
      : studioState.cards.findIndex(card => cardIdentity(card) === previewCardId);
    previewIndex = restoredIndex >= 0 ? restoredIndex : Math.min(previewIndex, studioState.count - 1);
  }
  buildRows();
  document.querySelectorAll(".row").forEach(row => {
    const card = studioState.cards[Number(row.dataset.index)];
    const details = row.querySelector("details.adj");
    if (card && details) details.open = expandedCardIds.has(cardIdentity(card));
  });
  render();
  $("rows").scrollTop = scrollPosition.rows;
  window.scrollTo(scrollPosition.x, scrollPosition.y);
  restoreRowFocus(focus);
}

function undo() {
  const result = history.undo();
  if (result) applySnapshot(result.snapshot);
  hideUndoToast();
  return result;
}

function redo() {
  const result = history.redo();
  if (result) applySnapshot(result.snapshot);
  return result;
}

const BORDER_CONTROL_IDS = [
  "bd-width", "bd-inset", "bd-opacity", "bd-linegap",
  "bd-color-mode", "bd-color", "bd-pattern", "bd-dash", "bd-gap",
  "bd-corner", "bd-corner-size", "bd-ornament", "bd-ornament-size",
  "bd-wear", "bd-glow", "bd-inner", "bd-inner-width", "bd-inner-gap",
  "bd-inner-color-mode", "bd-inner-color"
];
const STAMP_CONTROL_IDS = [
  "st-fill-mode", "st-pattern", "st-weight", "st-opacity",
  "st-wear", "st-inner-ring", "st-show-year"
];

function toHex6(color, fallback = "#111111") {
  return normalizeHex(color, "") || fallback;
}

function resolveActiveThemeStops(theme, overrides = null) {
  if (Array.isArray(overrides?.gradStops) && overrides.gradStops.length >= 2) {
    return overrides.gradStops.map(col => toHex6(col, "#111111")).slice(0, 4);
  }
  if (Array.isArray(theme?.gradStops) && theme.gradStops.length >= 2) {
    return theme.gradStops.map(col => toHex6(col, "#111111")).slice(0, 4);
  }
  const refCard = studioState.cards[studioState.selectedCard] || studioState.cards[0] || { h: 35, s: 0.75 };
  const gsHex = toHex6(overrides?.bg || theme?.gs || theme?.bg, "#0b0b10");
  const endSat = theme?.fixed ? 0.7 : Math.max(theme?.sm || 0, refCard.s ?? 0.75);
  const endHex = toHex6(
    overrides?.acc || theme?.fixed,
    hslObjectToHex({ h: refCard.h ?? 35, s: endSat, l: Number(theme?.gl) || 0.45 })
  );
  if (theme?.gradType === "triple" || theme?.gradType === "radial") {
    return [gsHex, blendHex(gsHex, endHex, 0.52), endHex];
  }
  return [gsHex, endHex];
}

function syncQuickColorsControls({ rebuildStops = true } = {}) {
  const themeKey = $("style")?.value || "cream";
  const theme = THEMES[themeKey] || THEMES.cream;
  const isCustomTheme = themeKey === "custom";
  const qc = isCustomTheme ? studioState.settings.customTheme : (studioState.quickColors || {});
  const refCard = studioState.cards[studioState.selectedCard] || studioState.cards[0] || { h: 35, s: 0.75 };

  const bgVal = toHex6(qc.bg || theme.bg, "#1f2430");
  const inkVal = toHex6(qc.ink || theme.ink, "#ffffff");
  const accFallback = toHex6(theme.fixed, refCard.accent || hslToHex(refCard));
  const accVal = toHex6(qc.acc, accFallback);
  const tapeVal = toHex6(qc.tape || theme.tape, "#d8b46b");
  const paVal = qc.pa !== undefined ? Boolean(qc.pa) : !theme.fixed;

  if ($("ct_bg")) $("ct_bg").value = bgVal;
  if ($("ct_ink")) $("ct_ink").value = inkVal;
  if ($("ct_acc")) $("ct_acc").value = accVal;
  if ($("ct_tape")) $("ct_tape").value = tapeVal;
  if ($("ct_pa")) $("ct_pa").checked = paVal;

  const legend = $("quick-colours-legend");
  if (legend) {
    legend.textContent = isCustomTheme
      ? "Quick colours · My theme"
      : (studioState.quickColors ? `Quick colours · ${theme.n} (customised)` : `Quick colours · ${theme.n}`);
  }
  if ($("ct_reset")) {
    const customDirty = isCustomTheme && JSON.stringify(studioState.settings.customTheme) !== JSON.stringify(DEFAULT_CUSTOM);
    $("ct_reset").disabled = !(isCustomTheme ? customDirty : Boolean(studioState.quickColors));
  }

  const gradBlock = $("grad-stops-block");
  const gradRow = $("grad-stops-row");
  if (gradBlock && gradRow) {
    const showGradStops = Boolean(theme.grad);
    gradBlock.hidden = !showGradStops;
    if (showGradStops) {
      const stops = resolveActiveThemeStops(theme, isCustomTheme ? CUSTOM : studioState.quickColors);
      const existingInputs = [...gradRow.querySelectorAll("input[data-grad-stop]")];
      if (rebuildStops || existingInputs.length !== stops.length) {
        gradRow.innerHTML = stops.map((hex, idx) =>
          `<label class="swatch-control"><span>Stop ${idx + 1}</span><input type="color" data-grad-stop="${idx}" aria-label="Gradient colour ${idx + 1}" value="${hex}"></label>`
        ).join("");
        attachColorHexFields(gradRow);
      } else {
        stops.forEach((hex, idx) => {
          if (existingInputs[idx] && existingInputs[idx].value !== hex) existingInputs[idx].value = hex;
        });
      }
      if ($("grad-stop-add")) $("grad-stop-add").disabled = stops.length >= 4;
      if ($("grad-stop-remove")) $("grad-stop-remove").disabled = stops.length <= 2;
    } else if (gradRow.children.length) {
      gradRow.replaceChildren();
    }
  }

  const quickScope = $("ct_bg")?.closest(".sec");
  if (quickScope) syncColorHexFields(quickScope);
}

function themeTagLabel(theme) {
  if (!theme.grad) return "";
  if (theme.gradType === "radial") return "Radial";
  if (theme.gradType === "triple" || (Array.isArray(theme.gradStops) && theme.gradStops.length === 3)) return "3-colour";
  if (theme.gradType === "multi" || (Array.isArray(theme.gradStops) && theme.gradStops.length >= 4)) return "4-colour";
  return "Gradient";
}

function effectivePreviewThemeForThumb(key, theme) {
  if (key !== ($("style")?.value || "cream") || !studioState.quickColors || key === "custom") return theme;
  const qc = studioState.quickColors;
  return {
    ...theme,
    ...(qc.bg ? { bg: qc.bg } : {}),
    ...(qc.ink ? { ink: qc.ink } : {}),
    ...(qc.acc && qc.pa !== true ? { fixed: qc.acc } : {}),
    ...(Array.isArray(qc.gradStops) && qc.gradStops.length >= 2 ? { gradStops: qc.gradStops, gs: qc.gradStops[0] } : {})
  };
}

function buildThemeDropdown(filterText = "") {
  const listEl = $("theme-menu-list");
  if (!listEl) return;
  const q = String(filterText || "").trim().toLowerCase();
  const activeKey = $("style")?.value || "cream";
  const groups = getGroupedThemes();
  const html = groups.map(([groupLabel, entries]) => {
    const filtered = q
      ? entries.filter(([, theme]) =>
        theme.n.toLowerCase().includes(q) || groupLabel.toLowerCase().includes(q) || themeTagLabel(theme).toLowerCase().includes(q)
      )
      : entries;
    if (!filtered.length) return "";
    const optionsHtml = filtered.map(([key, theme]) => {
      const tag = themeTagLabel(theme);
      const selected = key === activeKey;
      return `<button class="theme-option" type="button" role="option" data-theme-key="${escapeHtml(key)}" aria-selected="${selected}">
        <span class="theme-thumb">${renderThemeThumbSvg(key, theme, "th-mnu")}</span>
        <span class="theme-option-name">${escapeHtml(theme.n)}</span>
        ${tag ? `<span class="theme-option-tag">${tag}</span>` : ""}
      </button>`;
    }).join("");
    return `<div class="theme-group-label">${escapeHtml(groupLabel)}</div>${optionsHtml}`;
  }).join("");
  listEl.innerHTML = html || `<p class="hint" style="padding:10px">No matching themes.</p>`;
}

function syncThemeDropdown() {
  const key = $("style")?.value || "cream";
  const theme = THEMES[key] || THEMES.cream;
  const previewTheme = effectivePreviewThemeForThumb(key, theme);
  if ($("theme-trigger-thumb")) $("theme-trigger-thumb").innerHTML = renderThemeThumbSvg(key, previewTheme, "th-trg");
  if ($("theme-trigger-label")) $("theme-trigger-label").textContent = theme.n || "Cream";
  if ($("theme-trigger-cat")) $("theme-trigger-cat").textContent = theme.cat || theme.grp || "Theme";
  $("theme-menu-list")?.querySelectorAll(".theme-option").forEach(btn => {
    btn.setAttribute("aria-selected", String(btn.dataset.themeKey === key));
  });
}

function closeThemeMenu(restoreFocus = false) {
  const menu = $("theme-menu");
  const trigger = $("theme-trigger");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
  if (restoreFocus) trigger?.focus();
}

function openThemeMenu() {
  const menu = $("theme-menu");
  const trigger = $("theme-trigger");
  if (!menu) return;
  if ($("theme-filter")) $("theme-filter").value = "";
  buildThemeDropdown("");
  menu.hidden = false;
  trigger?.setAttribute("aria-expanded", "true");
  const activeOption = menu.querySelector('.theme-option[aria-selected="true"]');
  activeOption?.scrollIntoView({ block: "nearest" });
  ($("theme-filter") || activeOption)?.focus();
}

function selectThemeKey(key) {
  if (!key || !THEMES[key] || !$("style")) return;
  $("style").value = key;
  studioState.quickColors = undefined;
  syncQuickColorsControls({ rebuildStops: true });
  syncThemeDropdown();
  closeThemeMenu(true);
  recordDiscrete("change theme");
  render();
}

function bindHistoryControlEvents() {
  const labels = {
    sheetTitle: "change sheet title",
    style: "change theme",
    titleFont: "change title font",
    titleScale: "change card title size",
    doors: "change doors text",
    side: "change side text",
    stamp: "change stamp text",
    stampYear: "change stamp year",
    stampSize: "change stamp size",
    stampColor: "change stamp colour",
    stamp2: "change second stamp",
    stampWear: "change stamp wear",
    borderWear: "change border wear",
    gradientSpread: "change gradient spread",
    paper: "change paper size",
    cardSize: "change card size",
    cutterCorners: "change cutter corner radius",
    grain: "change paper grain",
    edgeWear: "change edge wear",
    creases: "change paper creases",
    scuffs: "change surface scuffs",
    yearBadge: "change year badge",
    tearStyle: "change tear line",
    photoFilter: "change photo filter",
    cropMarks: "toggle crop marks",
    bleed: "toggle bleed",
    nfc: "toggle NFC icon",
    cutTemplate: "toggle cut template",
    serials: "toggle serial number",
    stampAuto: "toggle stamp accent",
    regMarks: "toggle registration marks",
    punchHole: "toggle punch hole",
    centerTitle: "toggle centered title",
    halftone: "toggle photo halftone"
  };
  const controls = new Map();
  for (const [field, id] of Object.entries(SETTINGS_FIELDS)) controls.set(id, labels[field]);
  for (const [field, id] of Object.entries(CHECK_FIELDS)) controls.set(id, labels[field]);
  for (const key of CUSTOM_FIELDS) controls.set("ct_" + key, `change custom ${key} colour`);
  for (const id of BORDER_CONTROL_IDS) controls.set(id, "customise border");
  for (const id of STAMP_CONTROL_IDS) controls.set(id, "customise stamp");
  controls.forEach((label, id) => {
    const element = $(id);
    if (element) bindContinuousHistory(element, label, `setting:${id}`);
  });
  document.querySelectorAll("[data-quick-mount]").forEach(input => {
    const name = MOUNT_NAMES[input.value] || "mount";
    bindContinuousHistory(input, `toggle ${name.toLowerCase()} mount`, `mount:${input.value}`);
  });
}

function buildBorderPicker() {
  const container = $("border-picker");
  if (!container) return;
  container.replaceChildren();
  BORDER_STYLES.forEach(style => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "border-swatch";
    btn.setAttribute("role", "radio");
    btn.dataset.borderStyle = String(style.id);
    btn.setAttribute("aria-checked", String(style.id === studioState.borderStyle));
    btn.tabIndex = style.id === studioState.borderStyle ? 0 : -1;
    btn.innerHTML = `<span class="border-swatch-svg"></span><span class="border-swatch-name">${escapeHtml(style.name)}</span>`;
    container.append(btn);
  });
  lastSwatchThemeKey = "";
  refreshBorderSwatches();
}

function refreshBorderSwatches() {
  const container = $("border-picker");
  if (!container) return;
  const active = THEMES[$("style").value] || THEMES.cream;
  const accent = active.fixed || "#ff5a36";
  const key = `${active.bg || ""}|${active.ink || ""}|${accent}|${active.hi || ""}`;
  if (key === lastSwatchThemeKey) return;
  lastSwatchThemeKey = key;
  container.querySelectorAll(".border-swatch").forEach(btn => {
    const styleId = Number(btn.dataset.borderStyle);
    btn.querySelector(".border-swatch-svg").innerHTML = renderBorderSwatchSvg(styleId, accent, active);
  });
}

function syncBorderControls() {
  const bwearEl = $("bwear");
  const resolved = resolveBorderConfig({
    borderStyle: studioState.borderStyle,
    borderWear: bwearEl ? Number(bwearEl.value) : 35,
    border: studioState.borderConfig
  }, null);
  const meta = getBorderStyleMeta(resolved.style);
  const sup = meta.supports;

  const activeLabel = $("border-style-active");
  if (activeLabel) activeLabel.textContent = meta.name;

  document.querySelectorAll("#border-picker .border-swatch").forEach(btn => {
    const selected = Number(btn.dataset.borderStyle) === resolved.style;
    btn.setAttribute("aria-checked", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });

  const printNote = $("border-print-note");
  if (printNote) {
    printNote.textContent = meta.printNote || "";
    printNote.hidden = !meta.printNote;
  }
  const noneNote = $("border-none-note");
  if (noneNote) noneNote.hidden = meta.id !== 15;
  const grid = $("border-controls-grid");
  if (grid) grid.hidden = meta.id === 15;

  const setVal = (id, value) => {
    const el = $(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(value);
    else el.value = String(value);
  };
  setVal("bd-width", resolved.width);
  setVal("bd-inset", resolved.inset);
  setVal("bd-opacity", resolved.opacity);
  setVal("bd-linegap", resolved.lineGap);
  setVal("bd-color-mode", resolved.colorMode);
  setVal("bd-color", resolved.color);
  setVal("bd-pattern", resolved.pattern);
  setVal("bd-dash", resolved.dash);
  setVal("bd-gap", resolved.gap);
  setVal("bd-corner", resolved.corner);
  setVal("bd-corner-size", resolved.cornerSize);
  setVal("bd-ornament", resolved.ornament);
  setVal("bd-ornament-size", resolved.ornamentSize);
  setVal("bd-wear", resolved.wear);
  setVal("bd-glow", resolved.glow);
  setVal("bd-inner", resolved.inner);
  setVal("bd-inner-width", resolved.innerWidth);
  setVal("bd-inner-gap", resolved.innerGap);
  setVal("bd-inner-color-mode", resolved.innerColorMode);
  setVal("bd-inner-color", resolved.innerColor);

  $("bd-width-val").textContent = Number(resolved.width).toFixed(1);
  $("bd-inset-val").textContent = Number(resolved.inset).toFixed(1);
  $("bd-opacity-val").textContent = `${Math.round(resolved.opacity)}%`;
  $("bd-linegap-val").textContent = Number(resolved.lineGap).toFixed(1);
  $("bd-dash-val").textContent = String(resolved.dash);
  $("bd-gap-val").textContent = String(resolved.gap);
  $("bd-corner-size-val").textContent = String(resolved.cornerSize);
  $("bd-ornament-size-val").textContent = String(resolved.ornamentSize);
  $("bd-wear-val").textContent = `${Math.round(resolved.wear)}%`;
  $("bd-glow-val").textContent = `${Math.round(resolved.glow)}%`;
  $("bd-inner-width-val").textContent = Number(resolved.innerWidth).toFixed(1);
  $("bd-inner-gap-val").textContent = Number(resolved.innerGap).toFixed(1);

  const showGroup = (group, visible) => {
    const el = document.querySelector(`[data-border-group="${group}"]`);
    if (el) el.hidden = !visible;
  };
  showGroup("width", sup.width);
  showGroup("inset", sup.inset);
  showGroup("opacity", sup.opacity);
  showGroup("lineGap", sup.lineGap);
  showGroup("color", sup.color);
  showGroup("customColor", sup.color && resolved.colorMode === "custom");
  showGroup("pattern", sup.pattern);
  showGroup("dash", sup.pattern && (resolved.pattern === "dashed" || resolved.pattern === "dashdot"));
  showGroup("dashGap", sup.pattern && resolved.pattern !== "solid");
  showGroup("corner", sup.corner);
  showGroup("cornerSize", sup.corner && resolved.corner !== "square");
  showGroup("ornament", sup.ornament);
  showGroup("ornamentSize", sup.ornament && resolved.ornament !== "none");
  showGroup("wear", sup.wear);
  showGroup("glow", sup.glow);
  showGroup("inner", sup.inner);

  $("bd-inner-fields").hidden = !(sup.inner && resolved.inner);
  $("bd-inner-color-wrap").hidden = !(sup.inner && resolved.inner && resolved.innerColorMode === "custom");

  const metaEl = $("border-customise-meta");
  if (metaEl) {
    if (meta.id === 15) {
      metaEl.textContent = "None";
    } else if (hasBorderOverrides(resolved)) {
      const tags = [`${Number(resolved.width).toFixed(1)}px`];
      if (sup.corner && resolved.corner !== meta.defaults.corner) tags.push(resolved.corner);
      if (resolved.ornament !== "none") tags.push(resolved.ornament);
      if (resolved.inner) tags.push("+inner");
      if (resolved.glow > 0 && resolved.glow !== meta.defaults.glow) tags.push("glow");
      metaEl.textContent = tags.join(" · ");
    } else {
      metaEl.textContent = "Default";
    }
  }

  const applySelBtn = $("bd-apply-selected");
  if (applySelBtn) applySelBtn.textContent = `Apply to card #${studioState.selectedCard + 1}`;
  const activeEl = document.activeElement;
  if (!activeEl?.classList?.contains("color-hex") || !$("border-customise")?.contains(activeEl)) {
    syncColorHexFields($("border-customise"));
  }
}

function readBorderControlsIntoState(syncBwear = true) {
  const raw = {
    width: Number($("bd-width").value),
    inset: Number($("bd-inset").value),
    opacity: Number($("bd-opacity").value),
    lineGap: Number($("bd-linegap").value),
    colorMode: $("bd-color-mode").value,
    color: $("bd-color").value,
    pattern: $("bd-pattern").value,
    dash: Number($("bd-dash").value),
    gap: Number($("bd-gap").value),
    corner: $("bd-corner").value,
    cornerSize: Number($("bd-corner-size").value),
    ornament: $("bd-ornament").value,
    ornamentSize: Number($("bd-ornament-size").value),
    glow: Number($("bd-glow").value),
    inner: $("bd-inner").checked,
    innerWidth: Number($("bd-inner-width").value),
    innerGap: Number($("bd-inner-gap").value),
    innerColorMode: $("bd-inner-color-mode").value,
    innerColor: $("bd-inner-color").value
  };
  studioState.borderConfig = compactBorderOverrides(studioState.borderStyle, raw);
  if (syncBwear && $("bwear") && $("bd-wear")) {
    $("bwear").value = $("bd-wear").value;
  }
  syncBorderControls();
  scheduleRender();
}

function populateBorderPresets(selectedId = "") {
  const select = $("bd-preset-select");
  if (!select) return;
  const presets = getBorderPresets();
  select.innerHTML = `<option value="">Saved presets…</option>${presets.map(p =>
    `<option value="${escapeHtml(p.id)}"${p.id === selectedId ? " selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(getBorderStyleMeta(p.border.style).name)})</option>`
  ).join("")}`;
  syncPresetButtons();
}

function syncPresetButtons() {
  const select = $("bd-preset-select");
  if (!select) return;
  const hasSelection = Boolean(select.value);
  $("bd-preset-apply").disabled = !hasSelection;
  $("bd-preset-apply-card").disabled = !hasSelection;
  $("bd-preset-delete").disabled = !hasSelection;
}

function selectBorderStyle(styleId) {
  const nextId = Math.max(0, Math.min(BORDER_STYLES.length - 1, Number(styleId) || 0));
  if (nextId === studioState.borderStyle) return;
  studioState.borderStyle = nextId;
  studioState.borderConfig = undefined;
  syncBorderControls();
  recordDiscrete("change border style");
  render();
}

function buildStampPicker() {
  const container = $("stamp-picker");
  if (!container) return;
  container.replaceChildren();
  STAMP_OPTIONS.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "border-swatch stamp-swatch";
    btn.setAttribute("role", "radio");
    btn.dataset.stampShape = opt.id;
    btn.setAttribute("aria-checked", String(opt.id === studioState.stampShape));
    btn.tabIndex = opt.id === studioState.stampShape ? 0 : -1;
    btn.innerHTML = `<span class="border-swatch-svg"></span><span class="border-swatch-name">${escapeHtml(opt.name)}</span>`;
    container.append(btn);
  });
  lastStampSwatchKey = "";
  refreshStampSwatches();
}

function refreshStampSwatches() {
  const container = $("stamp-picker");
  if (!container) return;
  const active = THEMES[$("style").value] || THEMES.cream;
  const accent = $("sauto")?.checked ? (active.fixed || "#ff5a36") : ($("scol")?.value || "#d9322f");
  const style = resolveStampStyle({ stampShape: studioState.stampShape, stampStyle: studioState.stampStyle }, null);
  const key = `${active.bg || ""}|${active.ink || ""}|${accent}|${JSON.stringify(style)}`;
  if (key === lastStampSwatchKey) return;
  lastStampSwatchKey = key;
  container.querySelectorAll(".stamp-swatch").forEach(btn => {
    const shapeKey = btn.dataset.stampShape;
    btn.querySelector(".border-swatch-svg").innerHTML = renderStampSwatchSvg(shapeKey, accent, active, style);
  });
}

function syncStampControls() {
  const wearEl = $("wear");
  const resolved = resolveStampStyle({
    stampShape: studioState.stampShape,
    stampStyle: studioState.stampStyle
  }, null);
  const wearVal = wearEl ? Number(wearEl.value) : 35;

  const activeLabel = $("stamp-shape-active");
  if (activeLabel) activeLabel.textContent = getStampShapeName(studioState.stampShape);

  document.querySelectorAll("#stamp-picker .stamp-swatch").forEach(btn => {
    const selected = btn.dataset.stampShape === studioState.stampShape;
    btn.setAttribute("aria-checked", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });

  const isNone = studioState.stampShape === "none";
  const noneNote = $("stamp-none-note");
  if (noneNote) noneNote.hidden = !isNone;
  const grid = $("stamp-controls-grid");
  if (grid) grid.hidden = isNone;

  if ($("st-fill-mode")) $("st-fill-mode").value = resolved.fillMode;
  if ($("st-pattern")) $("st-pattern").value = resolved.pattern;
  if ($("st-weight")) $("st-weight").value = String(resolved.weight);
  if ($("st-opacity")) $("st-opacity").value = String(resolved.opacity);
  if ($("st-wear")) $("st-wear").value = String(wearVal);
  if ($("st-inner-ring")) $("st-inner-ring").checked = Boolean(resolved.innerRing);
  if ($("st-show-year")) $("st-show-year").checked = Boolean(resolved.showYear);

  if ($("st-weight-val")) $("st-weight-val").textContent = `${Number(resolved.weight).toFixed(1)}×`;
  if ($("st-opacity-val")) $("st-opacity-val").textContent = `${Math.round(resolved.opacity)}%`;
  if ($("st-wear-val")) $("st-wear-val").textContent = `${Math.round(wearVal)}%`;

  const metaEl = $("stamp-customise-meta");
  if (metaEl) {
    if (isNone) {
      metaEl.textContent = "None";
    } else if (hasStampStyleOverrides(resolved)) {
      const tags = [];
      if (resolved.fillMode !== "outline") tags.push(resolved.fillMode);
      if (resolved.weight !== 1) tags.push(`${Number(resolved.weight).toFixed(1)}×`);
      if (resolved.pattern !== "solid") tags.push(resolved.pattern);
      if (resolved.opacity !== 95) tags.push(`${resolved.opacity}%`);
      if (!resolved.innerRing) tags.push("no inner");
      if (!resolved.showYear) tags.push("no year");
      metaEl.textContent = tags.join(" · ");
    } else {
      metaEl.textContent = "Default";
    }
  }

  const applySelBtn = $("st-apply-selected");
  if (applySelBtn) applySelBtn.textContent = `Apply to card #${studioState.selectedCard + 1}`;
}

function readStampControlsIntoState(syncWear = true) {
  const raw = {
    fillMode: $("st-fill-mode").value,
    pattern: $("st-pattern").value,
    weight: Number($("st-weight").value),
    opacity: Number($("st-opacity").value),
    innerRing: $("st-inner-ring").checked,
    showYear: $("st-show-year").checked
  };
  studioState.stampStyle = compactStampStyle(raw);
  if (syncWear && $("wear") && $("st-wear")) {
    $("wear").value = $("st-wear").value;
  }
  syncStampControls();
  refreshStampSwatches();
  scheduleRender();
}

function selectStampShape(shapeKey) {
  if (!STAMP_OPTIONS.some(o => o.id === shapeKey) || shapeKey === studioState.stampShape) return;
  studioState.stampShape = shapeKey;
  syncStampControls();
  recordDiscrete("change stamp shape");
  render();
}

function populateStampPresets(selectedId = "") {
  const select = $("st-preset-select");
  if (!select) return;
  const presets = getStampPresets();
  select.innerHTML = `<option value="">Saved presets…</option>${presets.map(p =>
    `<option value="${escapeHtml(p.id)}"${p.id === selectedId ? " selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(getStampShapeName(p.stamp.shape))})</option>`
  ).join("")}`;
  syncStampPresetButtons();
}

function syncStampPresetButtons() {
  const select = $("st-preset-select");
  if (!select) return;
  const hasSelection = Boolean(select.value);
  $("st-preset-apply").disabled = !hasSelection;
  $("st-preset-apply-card").disabled = !hasSelection;
  $("st-preset-delete").disabled = !hasSelection;
}

function isTextEditingTarget(target) {
  if (!target || target.isContentEditable) return Boolean(target?.isContentEditable);
  if (target.tagName === "TEXTAREA") return true;
  return target.tagName === "INPUT"
    && ["text", "search", "url", "tel", "password", "email", "number"].includes(target.type);
}

function updateMountStatus() {
  const checked = [...document.querySelectorAll("[data-quick-mount]:checked")];
  $("quick-mount-status").textContent = checked.length
    ? `Active mounts: ${checked.map(element => MOUNT_NAMES[element.value] || "Mount").join(" + ")}`
    : "Active mounts: None";
}

function stampKeyFor(stampIndex) {
  return stampIndex === 1 ? "stamp2Pos" : "stampPos";
}

function resolveCardStamp(index, stampIndex = 0) {
  const card = studioState.cards[index];
  if (!card) return null;
  const CH = currentLayout?.CH || 239;
  const stampSize = Number($("ssize")?.value) || 100;
  return resolveStampTransform({
    index,
    stampIndex,
    CW,
    CH,
    stampSize,
    override: card[stampKeyFor(stampIndex)]
  });
}

function syncCardStampRow(index) {
  const row = getCardRowEl(index);
  if (!row) return;
  const box = row.querySelector(".card-stamp-pos");
  if (!box) return;
  const hasSecond = Boolean($("gs2")?.value.trim());
  const targetSelect = box.querySelector("[data-stamp-target]");
  const targetWrap = box.querySelector("[data-stamp-target-wrap]");
  if (!hasSecond && selectedStampIndex === 1) selectedStampIndex = 0;
  if (targetWrap) targetWrap.hidden = !hasSecond;
  if (targetSelect) targetSelect.value = String(selectedStampIndex);

  const st = resolveCardStamp(index, selectedStampIndex);
  if (!st) return;
  const card = studioState.cards[index];
  const hasOverride = Boolean(card?.[stampKeyFor(selectedStampIndex)]);
  const angleDeg = Math.round(st.r);
  const scalePct = Math.round(st.mult * 100);

  const dial = box.querySelector("[data-stamp-dial]");
  const needle = box.querySelector("[data-stamp-needle]");
  const rotInput = box.querySelector("[data-stamp-rot]");
  const scaleRange = box.querySelector("[data-stamp-scale-range]");
  const scaleInput = box.querySelector("[data-stamp-scale]");
  const posLabel = box.querySelector("[data-stamp-pos-label]");
  const resetBtn = box.querySelector("[data-action='reset-stamp']");

  if (needle) needle.style.transform = `rotate(${angleDeg}deg)`;
  if (dial) dial.setAttribute("aria-valuenow", String(angleDeg));
  if (rotInput && document.activeElement !== rotInput) rotInput.value = String(angleDeg);
  if (scaleRange) scaleRange.value = String(scalePct);
  if (scaleInput && document.activeElement !== scaleInput) scaleInput.value = String(scalePct);
  if (posLabel) {
    posLabel.textContent = hasOverride
      ? `Custom · ${Math.round(st.nx * 100)}% × ${Math.round(st.ny * 100)}%`
      : `Auto · ${Math.round(st.nx * 100)}% × ${Math.round(st.ny * 100)}%`;
  }
  if (resetBtn) resetBtn.disabled = !(card?.stampPos || card?.stamp2Pos);
}

function updateSnapGuides(cardGroup, snapInfo) {
  if (!cardGroup) return;
  cardGroup.querySelectorAll(".st-snap-guide").forEach(node => node.remove());
  if (!snapInfo || (!snapInfo.snappedX && !snapInfo.snappedY)) return;
  const CH = currentLayout?.CH || 239;
  const ns = "http://www.w3.org/2000/svg";
  if (snapInfo.snappedX && snapInfo.snapPxX !== null) {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("class", "st-snap-guide");
    line.setAttribute("x1", snapInfo.snapPxX.toFixed(1));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", snapInfo.snapPxX.toFixed(1));
    line.setAttribute("y2", String(CH));
    cardGroup.append(line);
  }
  if (snapInfo.snappedY && snapInfo.snapPxY !== null) {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("class", "st-snap-guide");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", snapInfo.snapPxY.toFixed(1));
    line.setAttribute("x2", String(CW));
    line.setAttribute("y2", snapInfo.snapPxY.toFixed(1));
    cardGroup.append(line);
  }
}

function patchLiveStampDom(index, si, snapInfo = null) {
  const st = resolveCardStamp(index, si);
  if (!st) return;
  const stampEl = $(`st${si}-${index}`);
  if (stampEl) {
    stampEl.setAttribute("transform", `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)}) scale(${Number(st.scale.toFixed(3))})`);
  }
  const uiEl = $("sheets")?.querySelector(`.st-ui[data-ci="${index}"][data-si="${si}"]`);
  if (uiEl) {
    uiEl.setAttribute("transform", `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)})`);
    const hit = uiEl.querySelector(".st-hit");
    if (hit) hit.setAttribute("aria-valuetext", `${Math.round(st.nx * 100)}% across, ${Math.round(st.ny * 100)}% down, ${Math.round(st.r)} degrees`);
  }
  const cardGroup = $("sheets")?.querySelector(`.sheet [data-ci="${index}"]`);
  updateSnapGuides(cardGroup, snapInfo);
  syncCardStampRow(index);
}

function copyStampPlacement(sourceIndex, targetIndices, label) {
  const src = studioState.cards[sourceIndex];
  if (!src) return;
  const st0 = resolveCardStamp(sourceIndex, 0);
  const stampPos = src.stampPos
    ? sanitizeStampOverride(src.stampPos)
    : sanitizeStampOverride({ x: st0.nx, y: st0.ny, r: st0.r, scale: 1 });
  const hasSecond = Boolean($("gs2")?.value.trim());
  const st1 = hasSecond ? resolveCardStamp(sourceIndex, 1) : null;
  const stamp2Pos = src.stamp2Pos
    ? sanitizeStampOverride(src.stamp2Pos)
    : (st1 ? sanitizeStampOverride({ x: st1.nx, y: st1.ny, r: st1.r, scale: 1 }) : undefined);

  const targetSet = new Set(targetIndices);
  studioState.cards = studioState.cards.map((card, i) => {
    if (!targetSet.has(i) || i === sourceIndex) return card;
    const next = { ...card, stampPos: { ...stampPos } };
    if (stamp2Pos) next.stamp2Pos = { ...stamp2Pos };
    cardIds.set(next, cardIdentity(card));
    return next;
  });
  recordDiscrete(label);
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
}

function scheduleRender() {
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function render() {
  studioState.settings = readSettings();
  const active = THEMES[$("style").value] || THEMES.cream;
  currentLayout = computeLayout($("paper").value, $("csize").value);
  if (lastBuiltRowsPerPage && currentLayout.PER !== lastBuiltRowsPerPage) {
    buildRows();
  }
  const cfg = renderConfig();
  const activeCards = studioState.cards.slice(0, studioState.count);
  studioState.selectedCard = Math.max(0, Math.min(studioState.count - 1, studioState.selectedCard));
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
  updatePreviewZoom(previewZoom);
  const printStyle = $("print-page-style");
  if (printStyle) {
    const paperSize = $("paper").value === "letter" ? "letter" : "A4";
    const paperWidth = $("paper").value === "letter" ? "215.9mm" : "210mm";
    const paperHeight = $("paper").value === "letter" ? "279.4mm" : "297mm";
    printStyle.textContent = `@media print {
      @page { size: ${paperSize} portrait; margin: 0; }
      .topbar, .panel, .page-tools, #pv, h1, p.subtitle { display: none !important; }
      .app[data-mobile-view] .stage { display: block !important; }
      .mobile-view-toggle, .mobile-actionbar { display: none !important; }
      .sheet { width: ${paperWidth} !important; height: ${paperHeight} !important; }
    }`;
  }
  $("pg").textContent = `${pages + ($("tpl").checked ? 1 : 0)} page${pages + ($("tpl").checked ? 1 : 0) === 1 ? "" : "s"} · ${currentLayout.PER}/page`;
  const paperName = $("paper").value === "letter" ? "US Letter" : "A4";
  $("sub-info").textContent = `${studioState.count} cards across ${pages} ${paperName} page${pages === 1 ? "" : "s"} · ${currentLayout.PER}/page`;
  $("card-count-lbl").textContent = studioState.count;
  $("ssv").textContent = cfg.stampSize + "%";
  $("gsv").textContent = cfg.gradientSpread + "%";
  const gradientEnabled = Boolean(active.grad);
  $("dial").setAttribute("aria-disabled", String(!gradientEnabled));
  $("dial").tabIndex = gradientEnabled ? 0 : -1;
  $("dial").classList.toggle("disabled", !gradientEnabled);
  if ($("grad-angle-reset")) {
    $("grad-angle-reset").disabled = !gradientEnabled || studioState.gradientAngle === 180;
  }
  $("gradient-hint").textContent = gradientEnabled
    ? (active.gradType === "radial" ? "Drag dial to shift spotlight; edit stops below." : "Drag the dial or edit gradient colours below.")
    : "Choose a gradient theme to enable the angle control.";
  syncPageTools(pages);
  refreshBorderSwatches();
  refreshStampSwatches();
  syncThemeDropdown();
  const moveBtn = $("move-stamps");
  if (moveBtn) moveBtn.setAttribute("aria-pressed", String(moveStampsMode));
  const snapWrap = $("stamp-snap-wrap");
  if (snapWrap) snapWrap.hidden = !moveStampsMode;
  const resetAllStampsBtn = $("reset-all-stamps");
  if (resetAllStampsBtn) {
    const anyStampOverride = activeCards.some(c => Boolean(c.stampPos || c.stamp2Pos));
    resetAllStampsBtn.hidden = !(moveStampsMode || anyStampOverride);
  }
  const applySelBtn = $("bd-apply-selected");
  if (applySelBtn) applySelBtn.textContent = `Apply to card #${studioState.selectedCard + 1}`;
  const applyStBtn = $("st-apply-selected");
  if (applyStBtn) applyStBtn.textContent = `Apply to card #${studioState.selectedCard + 1}`;
  document.querySelectorAll(".row").forEach((row, i) => {
    row.classList.toggle("selected", i === studioState.selectedCard);
    row.setAttribute("aria-expanded", String(i === studioState.selectedCard));
    if (i === studioState.selectedCard) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
  syncCardStampRow(studioState.selectedCard);
  if (!$("pv").hidden) refreshPreview();
  if (historyReady) history.refresh(captureSnapshot());
  saveSoon();
}

function scrollStageToPage(targetPage) {
  const stage = $("stage");
  const sheetEl = $("sheets")?.querySelector(`svg.sheet[data-page="${targetPage}"]`);
  if (!stage || !sheetEl) return;
  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  if (stage.scrollHeight > stage.clientHeight + 2) {
    const stageRect = stage.getBoundingClientRect();
    const sheetRect = sheetEl.getBoundingClientRect();
    const toolsH = $("page-tools")?.offsetHeight || 48;
    const targetTop = Math.max(0, stage.scrollTop + (sheetRect.top - stageRect.top) - toolsH - 12);
    if (typeof stage.scrollTo === "function") stage.scrollTo({ top: targetTop, behavior });
    else stage.scrollTop = targetTop;
  } else {
    sheetEl.scrollIntoView({ behavior, block: "start" });
  }
}

function syncPreviewPageForCard(index, scrollStage = false) {
  const per = currentLayout?.PER || computeLayout($("paper")?.value || "a4", $("csize")?.value || "ticket").PER || 9;
  const pageCount = Math.max(1, Math.ceil(studioState.count / per));
  const targetPage = Math.max(0, Math.min(pageCount - 1, Math.floor(index / per)));
  if (studioState.activePage !== targetPage) {
    studioState.activePage = targetPage;
    syncPageTools(pageCount);
  }
  if (scrollStage) scrollStageToPage(targetPage);
}

function applyCardSearchFilter() {
  const rowsContainer = $("rows");
  const clearBtn = $("card-search-clear");
  const countEl = $("card-search-count");
  if (clearBtn) clearBtn.hidden = !cardSearchQuery.length;
  const res = filterCardIndices(studioState.cards, studioState.count, cardSearchQuery);
  if (countEl) {
    countEl.hidden = !res.isActive;
    countEl.textContent = res.isActive ? formatSearchCount(res.matchCount, res.totalCount) : "";
  }
  if (!rowsContainer) return;
  const per = currentLayout?.PER || lastBuiltRowsPerPage || 9;
  const activeEl = document.activeElement;
  const visiblePages = new Set();
  rowsContainer.querySelectorAll(".row").forEach(row => {
    const idx = Number(row.dataset.index);
    const matches = !res.isActive || res.matchedSet.has(idx);
    const keepFocused = Boolean(activeEl && row.contains(activeEl));
    const hidden = res.isActive && !matches && !keepFocused;
    row.hidden = hidden;
    if (!hidden) visiblePages.add(Math.floor(idx / per));
  });
  rowsContainer.querySelectorAll(".rows-page-break").forEach(div => {
    const pageIdx = Number(div.dataset.page);
    div.hidden = res.isActive && !visiblePages.has(pageIdx);
  });
  const emptyEl = $("card-search-empty");
  if (emptyEl) {
    const showEmpty = res.isActive && res.matchCount === 0;
    emptyEl.hidden = !showEmpty;
    const emptyMsg = emptyEl.querySelector("[data-search-empty-msg]");
    if (emptyMsg) {
      emptyMsg.textContent = showEmpty ? `No cards match “${cardSearchQuery.trim()}”.` : "";
    }
  }
}

const debouncedCardSearch = debounce(() => applyCardSearchFilter(), 110);

function clearCardSearch(refocus = true) {
  debouncedCardSearch.cancel();
  cardSearchQuery = "";
  const input = $("card-search");
  if (input) {
    input.value = "";
    if (refocus) input.focus();
  }
  applyCardSearchFilter();
}

function selectCard(index, scroll = false, scrollPreview = false) {
  if (index < 0 || index >= studioState.count) return;
  studioState.selectedCard = index;
  syncPreviewPageForCard(index, scrollPreview);
  const applySelBtn = $("bd-apply-selected");
  if (applySelBtn) applySelBtn.textContent = `Apply to card #${index + 1}`;
  const applyStBtn = $("st-apply-selected");
  if (applyStBtn) applyStBtn.textContent = `Apply to card #${index + 1}`;
  if (historyReady) history.refresh(captureSnapshot());
  document.querySelectorAll(".row").forEach((row, i) => {
    row.classList.toggle("selected", i === index);
    row.setAttribute("aria-expanded", String(i === index));
    if (i === index) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
  if (moveStampsMode) {
    $("sheets")?.querySelectorAll(".st-ui").forEach(el => {
      const sel = Number(el.dataset.ci) === index && Number(el.dataset.si) === selectedStampIndex;
      el.classList.toggle("is-selected", sel);
    });
  }
  syncCardStampRow(index);
  if (scroll) getCardRowEl(index)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ensureSharedPhotoInput() {
  if (sharedPhotoFileInput) return sharedPhotoFileInput;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.hidden = true;
  input.addEventListener("change", async () => {
    const targetIdx = pendingPhotoUploadIndex;
    const fileObj = input.files?.[0];
    input.value = "";
    pendingPhotoUploadIndex = -1;
    if (fileObj && targetIdx >= 0 && targetIdx < studioState.count) {
      await setImage(targetIdx, () => processImageFile(fileObj));
    }
  });
  document.body.append(input);
  sharedPhotoFileInput = input;
  return input;
}

function buildRows() {
  const activeCards = studioState.cards.slice(0, studioState.count);
  const per = currentLayout?.PER || computeLayout($("paper")?.value || "a4", $("csize")?.value || "ticket").PER || 9;
  lastBuiltRowsPerPage = per;
  const fullThemeOptions = `<option value="">Same as sheet</option>${getGroupedThemes().map(([lbl, entries]) => `<optgroup label="${escapeHtml(lbl)}">${entries.map(([key, theme]) => `<option value="${key}">${escapeHtml(theme.n)}</option>`).join("")}</optgroup>`).join("")}`;
  const fullStampOptions = [["", "Same as sheet"], ["none", "No stamp"], ...Object.keys(STAMPS).map(key => [key, STAMPS[key].name || (key[0].toUpperCase() + key.slice(1))]), ["mixed", "Mixed"]]
    .map(([value, name]) => `<option value="${value}">${escapeHtml(name)}</option>`).join("");

  const hydrateLazySelects = row => {
    row.querySelectorAll("select[data-lazy-kind]").forEach(selectEl => {
      if (selectEl.dataset.populated === "1") return;
      const curVal = selectEl.value;
      selectEl.innerHTML = selectEl.dataset.lazyKind === "theme" ? fullThemeOptions : fullStampOptions;
      selectEl.value = curVal;
      selectEl.dataset.populated = "1";
    });
  };

  const frag = document.createDocumentFragment();
  activeCards.forEach((card, index) => {
    const row = document.createElement("article");
    row.className = "row" + (index === studioState.selectedCard ? " selected" : "");
    row.dataset.index = index;
    row.setAttribute("aria-expanded", String(index === studioState.selectedCard));
    const imgSrc = card.img || card.imgUrl;
    const imageUrl = card.imgUrl || (String(card.img || "").startsWith("http") ? card.img : "");
    const genre = String(card.genre || "");
    const isCustomStyled = hasCustomCardStyling(card);
    const isLocked = Boolean(card.locked);
    const curThemeLabel = card.theme ? (THEMES[card.theme]?.n || card.theme) : "Same as sheet";
    const curStampLabel = !card.sk
      ? "Same as sheet"
      : (card.sk === "none" ? "No stamp" : (card.sk === "mixed" ? "Mixed" : (STAMPS[card.sk]?.name || card.sk)));
    const compactThemeOpt = `<option value="${escapeHtml(card.theme || "")}" selected>${escapeHtml(curThemeLabel)}</option>`;
    const compactStampOpt = `<option value="${escapeHtml(card.sk || "")}" selected>${escapeHtml(curStampLabel)}</option>`;
    row.innerHTML = `
      <div class="cv" tabindex="0" role="button" aria-label="Choose photo for card ${index + 1}">${imgSrc ? "" : `${iconMarkup("upload")} Photo`}</div>
      <div class="row-content">
        <div class="row-heading">
          <button class="card-name" type="button" data-action="select-card" aria-label="Select card ${index + 1}">Card ${index + 1} · ${escapeHtml(card.title || "Untitled card")}</button>
          <span class="card-badges">
            ${isCustomStyled ? `<span class="card-custom-badge" title="Card has custom styling">Custom</span>` : ""}
            ${isLocked ? `<span class="card-lock-badge" title="Kept locked when shuffling" aria-label="Locked">${iconMarkup("lock")}</span>` : ""}
          </span>
          <div class="row-actions">
            <button class="g sm card-lock-btn${isLocked ? " is-locked" : ""}" type="button" data-action="toggle-lock" aria-pressed="${isLocked}" aria-label="${isLocked ? `Unlock styling for card ${index + 1}` : `Keep card ${index + 1} styling when shuffling`}" data-tooltip="${isLocked ? "Locked (Keep this one)" : "Keep this one"}">${iconMarkup("lock")}</button>
            <button class="g sm" type="button" data-action="view">${iconMarkup("view")} View</button>
            <button class="danger sm" type="button" data-action="delete"${studioState.count <= 1 ? " disabled" : ""}>${iconMarkup("delete")} Delete</button>
            <details class="card-menu">
              <summary aria-label="More actions for card ${index + 1}" data-tooltip="More card actions"><span data-icon="more"></span></summary>
              <div class="menu-panel">
                <button class="g" type="button" data-action="up"${index === 0 ? " disabled" : ""}>${iconMarkup("moveUp")} Move up</button>
                <button class="g" type="button" data-action="down"${index === studioState.count - 1 ? " disabled" : ""}>${iconMarkup("moveDown")} Move down</button>
                <button class="g" type="button" data-action="duplicate"${studioState.count >= MAX_CARDS ? " disabled" : ""}>${iconMarkup("duplicate")} Duplicate card</button>
                <button class="g" type="button" data-action="surprise">${iconMarkup("surprise")} Surprise this card</button>
                <button class="g" type="button" data-action="toggle-lock">${iconMarkup("lock")} ${isLocked ? "Unlock styling" : "Keep this one"}</button>
                <button class="g" type="button" data-action="reset-styling"${isCustomStyled ? "" : " disabled"}>${iconMarkup("reset")} Reset this card's styling</button>
                <button class="g" type="button" data-action="clear">${iconMarkup("reset")} Reset card</button>
              </div>
            </details>
          </div>
        </div>
        <div class="f card-fields">
          <label class="fld w"><span>Artist / band name</span><input type="text" data-field="title" aria-label="Card ${index + 1} name" placeholder="Artist / band name" value="${escapeHtml(card.title)}"></label>
          <label class="fld w"><span>Genre</span><input type="text" data-field="genre" aria-label="Genre" placeholder="Genre" value="${escapeHtml(genre)}"><output class="field-value" data-field-value="genre"${genre.length > 24 ? "" : " hidden"}>${escapeHtml(genre)}</output></label>
          <label class="fld w"><span>Place</span><input type="text" data-field="loc" aria-label="Place" placeholder="Place" value="${escapeHtml(card.loc)}"></label>
          <label class="fld w"><span>Year</span><input type="text" data-field="year" aria-label="Year" placeholder="Year" value="${escapeHtml(card.year)}"></label>
          <label class="fld w"><span>Abbreviation</span><input type="text" data-field="code" aria-label="Abbreviation" placeholder="Abbreviation" value="${escapeHtml(card.code)}"></label>
          <label class="fld w"><span>Image URL</span><div class="url-row"><input type="url" data-url aria-label="Image URL" placeholder="https://…" value="${escapeHtml(imageUrl)}"><button class="g" type="button" data-action="load-url">${iconMarkup("upload")} Load</button></div><output class="field-value" data-field-value="url"${imageUrl.length > 32 ? "" : " hidden"}>${escapeHtml(imageUrl)}</output></label>
          ${card.corsLimited ? '<span class="cors-tag w" tabindex="0" role="note" aria-label="This host blocks canvas access; SVG export works, raster export may not." data-tooltip="This host blocks canvas access; SVG export works, raster export may not.">CORS-limited image</span>' : ""}
          <div class="c-row w"><input type="color" data-accent aria-label="Accent colour" value="${hslToHex(card)}"> Accent sampled from image when available</div>
          <details class="w adj"><summary><span>Photo &amp; theme options</span><span class="disclosure-icon" data-icon="chevron"></span></summary>
            <label><span>Zoom</span><input type="range" min="100" max="300" value="${Math.round((card.zm || 1) * 100)}" data-adjust="zm"></label>
            <label><span>Horizontal</span><input type="range" min="-100" max="100" value="${card.px || 0}" data-adjust="px"></label>
            <label><span>Vertical</span><input type="range" min="-100" max="100" value="${card.py || 0}" data-adjust="py"></label>
            <button class="g sm" type="button" data-action="reset-photo">Reset photo crop</button>
            <label><span>Theme</span><select data-option="theme" data-lazy-kind="theme" data-populated="0">${compactThemeOpt}</select></label>
            <label><span>Stamp</span><select data-option="sk" data-lazy-kind="stamp" data-populated="0">${compactStampOpt}</select></label>
            <label><span>Stamp text</span><input type="text" data-option="stx" placeholder="Same as sheet" value="${escapeHtml(card.stx || "")}"></label>
            <div class="card-border-row">
              <span>${card.border ? `Border: Custom (${escapeHtml(getBorderStyleMeta(card.border.style ?? studioState.borderStyle).name)})` : "Border: Same as sheet"}</span>
              ${card.border ? `<button class="g sm" type="button" data-action="reset-border">Use sheet border</button>` : ""}
            </div>
            ${card.sk || card.stampStyle ? `<div class="card-border-row"><span>Stamp look: Custom (${escapeHtml(getStampShapeName(card.sk || studioState.stampShape))})</span><button class="g sm" type="button" data-action="reset-stamp-style">Use sheet stamp</button></div>` : ""}
            ${isCustomStyled ? `<div class="card-border-row"><span>Card styling: Custom overrides active</span><button class="g sm" type="button" data-action="reset-styling">Reset this card's styling</button></div>` : ""}
            <div class="card-stamp-pos">
              <div class="card-stamp-header">
                <span>Stamp placement</span>
                <span class="hint" data-stamp-pos-label>Auto</span>
              </div>
              <label data-stamp-target-wrap hidden><span>Edit stamp</span><select data-stamp-target><option value="0">Primary stamp</option><option value="1">Second stamp</option></select></label>
              <div class="card-stamp-dials">
                <div class="card-stamp-dial-wrap">
                  <div class="dial stamp-dial" data-stamp-dial role="slider" tabindex="0" aria-label="Card ${index + 1} stamp angle" aria-valuemin="-180" aria-valuemax="180" aria-valuenow="0">
                    <i data-stamp-needle></i><b></b>
                  </div>
                  <div class="card-stamp-num-col">
                    <label><span>Angle (°)</span><input type="number" min="-180" max="180" step="1" value="0" data-stamp-rot aria-label="Card ${index + 1} stamp angle degrees"></label>
                  </div>
                </div>
                <div class="card-stamp-scale-wrap">
                  <label><span>Scale (%)</span></label>
                  <div class="card-stamp-scale-row">
                    <input type="range" min="40" max="250" step="5" value="100" data-stamp-scale-range aria-label="Card ${index + 1} stamp scale slider">
                    <input type="number" min="40" max="250" step="5" value="100" data-stamp-scale aria-label="Card ${index + 1} stamp scale percent">
                  </div>
                </div>
              </div>
              <div class="card-stamp-actions">
                <button class="g sm" type="button" data-action="reset-stamp">Reset stamp position</button>
                <button class="g sm" type="button" data-action="copy-stamp-page">Copy to page</button>
                <button class="g sm" type="button" data-action="copy-stamp-all">Copy to all cards</button>
              </div>
            </div>
          </details>
        </div>
      </div>`;
    hydrateIcons(row);
    attachColorHexFields(row);
    row.querySelector("details.adj")?.addEventListener("toggle", event => {
      if (event.currentTarget.open) hydrateLazySelects(row);
    });
    const thumb = row.querySelector(".cv");
    if (imgSrc) thumb.style.backgroundImage = `url(${JSON.stringify(String(imgSrc))})`;
    thumb.addEventListener("click", () => {
      selectCard(index);
      pendingPhotoUploadIndex = index;
      ensureSharedPhotoInput().click();
    });
    thumb.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCard(index);
        pendingPhotoUploadIndex = index;
        ensureSharedPhotoInput().click();
      }
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
    row.querySelectorAll("[data-field]").forEach(input => {
      input.addEventListener("input", () => {
        updateCard(index, { [input.dataset.field]: input.value });
        if (input.dataset.field === "title") {
          row.querySelector(".card-name").textContent = `Card ${index + 1} · ${input.value || "Untitled card"}`;
        }
        const output = row.querySelector(`[data-field-value="${input.dataset.field}"]`);
        if (output) {
          output.textContent = input.value;
          output.hidden = input.value.length <= 24;
        }
        if (cardSearchQuery.trim()) applyCardSearchFilter();
        scheduleRender();
      });
      const fieldNames = { title: "name", genre: "genre", loc: "place", year: "year", code: "abbreviation" };
      bindContinuousHistory(input, `change card ${fieldNames[input.dataset.field]}`, `card:${index}:${input.dataset.field}`);
    });
    row.querySelectorAll("[data-adjust]").forEach(input => {
      input.addEventListener("input", () => {
        const field = input.dataset.adjust;
        updateCard(index, { [field]: field === "zm" ? +input.value / 100 : +input.value });
        scheduleRender();
      });
      const labels = { zm: "change photo zoom", px: "change horizontal photo position", py: "change vertical photo position" };
      bindContinuousHistory(input, labels[input.dataset.adjust], `card:${index}:${input.dataset.adjust}`);
    });
    row.querySelectorAll("[data-option]").forEach(input => {
      input.addEventListener("input", () => {
        updateCard(index, { [input.dataset.option]: input.value });
        if (input.dataset.option === "stx" && cardSearchQuery.trim()) applyCardSearchFilter();
        scheduleRender();
      });
      const labels = { theme: "change card theme", sk: "change card stamp", stx: "change card stamp text" };
      bindContinuousHistory(input, labels[input.dataset.option], `card:${index}:${input.dataset.option}`);
    });
    row.querySelector("[data-accent]").addEventListener("input", event => {
      updateCard(index, { ...hexToHS(event.target.value), autoAccent: false });
      scheduleRender();
    });
    bindContinuousHistory(row.querySelector("[data-accent]"), "change card accent colour", `card:${index}:accent`);

    const applyStampEdit = (si, patch) => {
      const st = resolveCardStamp(index, si);
      const current = studioState.cards[index]?.[stampKeyFor(si)];
      const next = sanitizeStampOverride({
        x: current?.x ?? st.nx,
        y: current?.y ?? st.ny,
        r: current?.r ?? st.r,
        scale: current?.scale ?? st.mult,
        ...patch
      });
      updateCard(index, { [stampKeyFor(si)]: next });
      patchLiveStampDom(index, si);
      scheduleRender();
    };

    row.querySelector("[data-stamp-target]")?.addEventListener("change", event => {
      selectedStampIndex = Number(event.target.value) === 1 ? 1 : 0;
      selectCard(index);
    });

    const stampDial = row.querySelector("[data-stamp-dial]");
    if (stampDial) {
      const stampAngleFromEvent = event => {
        const rect = stampDial.getBoundingClientRect();
        return Math.atan2(event.clientX - (rect.left + rect.width / 2), -(event.clientY - (rect.top + rect.height / 2))) * 180 / Math.PI;
      };
      stampDial.addEventListener("pointerdown", event => {
        stampDial.setPointerCapture(event.pointerId);
        stampDial.dataset.dragging = "true";
        const rawAngle = stampAngleFromEvent(event);
        const angle = normalizeAngle(event.shiftKey ? rawAngle : Math.round(rawAngle / 5) * 5);
        applyStampEdit(selectedStampIndex, { r: angle });
        recordContinuous("rotate stamp", `card:${index}:stamp-rot:${selectedStampIndex}`);
      });
      stampDial.addEventListener("pointermove", event => {
        if (!stampDial.dataset.dragging) return;
        const rawAngle = stampAngleFromEvent(event);
        const angle = normalizeAngle(event.shiftKey ? rawAngle : Math.round(rawAngle / 5) * 5);
        applyStampEdit(selectedStampIndex, { r: angle });
        recordContinuous("rotate stamp", `card:${index}:stamp-rot:${selectedStampIndex}`);
      });
      ["pointerup", "pointercancel"].forEach(name => stampDial.addEventListener(name, () => {
        if (!stampDial.dataset.dragging) return;
        delete stampDial.dataset.dragging;
        finishContinuous("rotate stamp", `card:${index}:stamp-rot:${selectedStampIndex}`);
      }));
      stampDial.addEventListener("keydown", event => {
        const step = event.shiftKey ? 15 : 5;
        const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[event.key];
        if (delta !== undefined) {
          event.preventDefault();
          const st = resolveCardStamp(index, selectedStampIndex);
          applyStampEdit(selectedStampIndex, { r: normalizeAngle(st.r + delta) });
          recordContinuous("rotate stamp", `card:${index}:stamp-rot:${selectedStampIndex}`);
        } else if (event.key === "Home") {
          event.preventDefault();
          applyStampEdit(selectedStampIndex, { r: 0 });
          recordContinuous("rotate stamp", `card:${index}:stamp-rot:${selectedStampIndex}`);
        }
      });
    }

    const rotNum = row.querySelector("[data-stamp-rot]");
    if (rotNum) {
      rotNum.addEventListener("input", () => {
        if (rotNum.value === "" || rotNum.value === "-") return;
        applyStampEdit(selectedStampIndex, { r: normalizeAngle(Number(rotNum.value)) });
      });
      bindContinuousHistory(rotNum, "rotate stamp", `card:${index}:stamp-rot`);
    }

    const scaleRange = row.querySelector("[data-stamp-scale-range]");
    const scaleNum = row.querySelector("[data-stamp-scale]");
    if (scaleRange) {
      scaleRange.addEventListener("input", () => {
        applyStampEdit(selectedStampIndex, { scale: clampStampScale(Number(scaleRange.value) / 100) });
      });
      bindContinuousHistory(scaleRange, "scale stamp", `card:${index}:stamp-scale`);
    }
    if (scaleNum) {
      scaleNum.addEventListener("input", () => {
        const val = Number(scaleNum.value);
        if (!Number.isFinite(val) || val < 20) return;
        applyStampEdit(selectedStampIndex, { scale: clampStampScale(val / 100) });
      });
      bindContinuousHistory(scaleNum, "scale stamp", `card:${index}:stamp-scale`);
    }
    row.querySelector("[data-action='load-url']").addEventListener("click", async () => {
      const url = row.querySelector("[data-url]").value.trim();
      await setImage(index, () => processImageUrl(url));
    });
    row.querySelector("[data-url]").addEventListener("input", event => {
      const output = row.querySelector("[data-field-value='url']");
      output.textContent = event.target.value;
      output.hidden = event.target.value.length <= 32;
    });
    row.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", event => {
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === "select-card") {
        selectCard(index, false, true);
        return;
      }
      selectCard(index);
      if (action === "load-url") return;
      if (action === "view") { selectCard(index); openPreview(index); }
      else if (action === "surprise") {
        surpriseCards({ seed: generateSeed(), onlyIndex: index, actionLabel: "surprise card styling" });
      } else if (action === "toggle-lock") {
        toggleCardLock(index);
      } else if (action === "reset-styling") {
        resetSingleCardStyling(index);
      }
      else if (action === "up" && index > 0) moveCard(index, index - 1);
      else if (action === "down" && index < studioState.count - 1) moveCard(index, index + 1);
      else if (action === "duplicate" && studioState.count < MAX_CARDS) {
        const duplicate = { ...studioState.cards[index] };
        cardIds.set(duplicate, ++nextCardId);
        studioState.cards = [...studioState.cards.slice(0, index + 1), duplicate, ...studioState.cards.slice(index + 1)];
        studioState.count++;
        studioState.selectedCard = index + 1;
        recordDiscrete("duplicate card");
        buildRows();
        render();
      } else if (action === "delete" && studioState.count > 1) {
        studioState.cards = studioState.cards.filter((_, cardIndex) => cardIndex !== index);
        studioState.count--;
        studioState.selectedCard = Math.min(index, studioState.count - 1);
        $("count").value = studioState.count;
        recordDiscrete("delete card");
        buildRows();
        render();
        showUndoToast("Card deleted.");
      } else if (action === "clear") {
        studioState.cards = studioState.cards.map((current, cardIndex) =>
          cardIndex === index ? blankCard() : current
        );
        recordDiscrete("clear card");
        buildRows();
        render();
      } else if (action === "reset-photo") {
        updateCard(index, { zm: 1, px: 0, py: 0 });
        recordDiscrete("reset photo crop");
        buildRows();
        render();
      } else if (action === "reset-border") {
        const current = studioState.cards[index];
        if (current && current.border) {
          const { border: _removed, ...rest } = current;
          const next = { ...rest };
          cardIds.set(next, cardIdentity(current));
          studioState.cards = studioState.cards.map((item, cardIndex) => cardIndex === index ? next : item);
          recordDiscrete("reset card border");
          buildRows();
          render();
        }
      } else if (action === "reset-stamp-style") {
        const current = studioState.cards[index];
        if (current && (current.sk || current.stampStyle)) {
          const { stampStyle: _removed, ...rest } = current;
          const next = { ...rest, sk: "" };
          cardIds.set(next, cardIdentity(current));
          studioState.cards = studioState.cards.map((item, cardIndex) => cardIndex === index ? next : item);
          recordDiscrete("reset card stamp");
          buildRows();
          render();
          message(`Reset card #${index + 1} stamp to sheet default.`);
        }
      } else if (action === "reset-stamp") {
        const current = studioState.cards[index];
        if (current && (current.stampPos || current.stamp2Pos)) {
          const { stampPos: _p1, stamp2Pos: _p2, ...rest } = current;
          const next = { ...rest };
          cardIds.set(next, cardIdentity(current));
          studioState.cards = studioState.cards.map((item, cardIndex) => cardIndex === index ? next : item);
          recordDiscrete("reset stamp position");
          buildRows();
          render();
          message(`Reset stamp position for card #${index + 1}.`);
        }
      } else if (action === "copy-stamp-page") {
        const per = currentLayout?.PER || 9;
        const pageStart = Math.floor(index / per) * per;
        const pageEnd = Math.min(studioState.count, pageStart + per);
        const indices = Array.from({ length: pageEnd - pageStart }, (_, k) => pageStart + k);
        copyStampPlacement(index, indices, "copy stamp placement to page");
        message(`Copied stamp placement to page ${Math.floor(index / per) + 1}.`);
      } else if (action === "copy-stamp-all") {
        const indices = Array.from({ length: studioState.count }, (_, k) => k);
        copyStampPlacement(index, indices, "copy stamp placement to all cards");
        message("Copied stamp placement to all cards.");
      }
      button.closest(".card-menu")?.removeAttribute("open");
    }));
    frag.append(row);
    if ((index + 1) % per === 0 || index === activeCards.length - 1) {
      const pageNum = Math.floor(index / per) + 1;
      const pageStart = (pageNum - 1) * per;
      const divider = document.createElement("div");
      divider.className = "rows-page-break";
      divider.dataset.page = String(pageNum - 1);
      divider.setAttribute("role", "separator");
      divider.setAttribute("aria-label", `End of page ${pageNum}`);
      divider.innerHTML = `<span>End of page ${pageNum}</span><span class="rows-page-range">Cards ${pageStart + 1}–${index + 1}</span>`;
      frag.append(divider);
    }
  });
  const emptyNotice = document.createElement("div");
  emptyNotice.id = "card-search-empty";
  emptyNotice.className = "card-search-empty";
  emptyNotice.hidden = true;
  emptyNotice.innerHTML = `<span data-search-empty-msg></span><button class="g sm" type="button" data-action="clear-search">Clear search</button>`;
  frag.append(emptyNotice);
  $("rows").replaceChildren(frag);
  applyCardSearchFilter();
  syncCardStampRow(studioState.selectedCard);
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function setImage(index, loader) {
  const targetId = cardIdentity(studioState.cards[index]);
  try {
    const image = await loader();
    const currentIndex = studioState.cards.findIndex(card => cardIdentity(card) === targetId);
    if (currentIndex < 0) {
      message("That card changed before its image finished loading.");
      return;
    }
    const keepImportedAccent = batchImportInProgress && studioState.cards[currentIndex]?.autoAccent === false;
    const updatedCard = updateCard(currentIndex, keepImportedAccent ? image : { accent: undefined, autoAccent: true, ...image });
    buildRows();
    if (!batchImportInProgress) recordDiscrete("change card image");
    render();
    message(`Image added to card ${currentIndex + 1}${updatedCard.corsLimited ? " (host limits raster export)" : ""}.`);
  } catch (error) {
    message(error instanceof Error ? error.message : "Could not load the image.");
  }
}

function moveCard(from, to) {
  const cards = studioState.cards.slice();
  [cards[from], cards[to]] = [cards[to], cards[from]];
  studioState.cards = cards;
  studioState.selectedCard = to;
  recordDiscrete("move card");
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
}

function setCount(value) {
  studioState.count = Math.max(1, Math.min(MAX_CARDS, Number.parseInt(value, 10) || 1));
  if (studioState.cards.length < studioState.count) {
    const padded = studioState.cards.slice();
    while (padded.length < studioState.count) padded.push(blankCard());
    studioState.cards = padded;
  } else if (studioState.cards.length > studioState.count) {
    studioState.cards = studioState.cards.slice(0, studioState.count);
  }
  studioState.selectedCard = Math.min(studioState.selectedCard, studioState.count - 1);
  $("count").value = studioState.count;
  recordDiscrete("change card count");
  currentLayout = computeLayout($("paper").value, $("csize").value);
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
    const styleOverrides = sanitizeCardStyleOverrides(item, THEMES, STAMPS);
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
      ...styleOverrides,
      theme: styleOverrides.theme || String(item.theme || ""),
      sk: styleOverrides.sk || String(item.stampShape || ""),
      stx: String(item.stampText || ""),
      autoAccent: !accent,
      ...(accent || {})
    };
  });
  studioState.cards = imported;
  studioState.count = imported.length;
  studioState.selectedCard = 0;
  $("count").value = studioState.count;
  if (!Array.isArray(data) && data.settings) applySettings(data.settings);
  buildRows();
  recordDiscrete("import card data");
  render();
  batchImportInProgress = true;
  try {
    for (let i = 0; i < imported.length; i++) {
      const entry = entries[i];
      const photo = photoForJson(entry);
      if (photo.startsWith("http")) {
        await setImage(i, () => processImageUrl(photo));
      } else if (photo.startsWith("data:")) {
        await hydrateDataImage(imported[i]);
      }
    }
  } finally {
    batchImportInProgress = false;
    if (historyReady) history.refresh(captureSnapshot());
  }
  message(`Loaded ${imported.length} card${imported.length === 1 ? "" : "s"}${entries.length > MAX_CARDS ? ` (first ${MAX_CARDS} only)` : ""}.`);
  showUndoToast("Card data imported.");
}

function hydrateDataImage(card) {
  const targetId = cardIdentity(card);
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const cardIndex = studioState.cards.findIndex(current => cardIdentity(current) === targetId);
      if (cardIndex < 0) {
        resolve();
        return;
      }
      const changes = { iw: image.naturalWidth, ih: image.naturalHeight };
      if (card.autoAccent) Object.assign(changes, sampleImageColor(image));
      const next = updateCard(cardIndex, changes);
      if (next.autoAccent) {
        const { autoAccent: _autoAccent, ...cleanCard } = next;
        const id = cardIdentity(next);
        const clean = { ...cleanCard };
        cardIds.set(clean, id);
        studioState.cards = studioState.cards.map((current, index) => index === cardIndex ? clean : current);
      }
      if (historyReady) history.refresh(captureSnapshot());
      resolve();
    };
    image.onerror = () => {
      const cardIndex = studioState.cards.findIndex(current => cardIdentity(current) === targetId);
      if (cardIndex >= 0) {
        const { autoAccent: _autoAccent, ...cleanCard } = studioState.cards[cardIndex];
        const clean = { ...cleanCard };
        cardIds.set(clean, cardIdentity(studioState.cards[cardIndex]));
        studioState.cards = studioState.cards.map((current, index) => index === cardIndex ? clean : current);
        if (historyReady) history.refresh(captureSnapshot());
      }
      resolve();
    };
    image.src = card.img;
  });
}

function setGradientAngle(angle, snap = true) {
  const rounded = snap ? Math.round(angle / 5) * 5 : Math.round(angle);
  studioState.gradientAngle = ((rounded % 360) + 360) % 360;
  $("needle").style.transform = `rotate(${studioState.gradientAngle}deg)`;
  $("dial").setAttribute("aria-valuenow", studioState.gradientAngle);
  $("gav").textContent = studioState.gradientAngle + "°";
  if ($("grad-angle-reset")) {
    const gradientActive = Boolean((THEMES[$("style").value] || THEMES.cream)?.grad);
    $("grad-angle-reset").disabled = !gradientActive || studioState.gradientAngle === 180;
  }
  scheduleRender();
}

function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const result = await persistSession({ v: 1, count: studioState.count, settings: readSettings(), cards: studioState.cards });
    $("sv").textContent = result;
  }, 450);
}

function syncCustomControls() {
  for (const key of CUSTOM_FIELDS) {
    const el = $("ct_" + key);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(studioState.settings.customTheme[key]);
    else el.value = studioState.settings.customTheme[key];
  }
  syncQuickColorsControls();
  syncColorHexFields();
  updateMountStatus();
}

function resetDefaults() {
  studioState.cards = DEFAULT_CARDS.map(card => ({ ...card }));
  studioState.count = studioState.cards.length;
  studioState.selectedCard = 0;
  studioState.quickColors = undefined;
  $("count").value = studioState.count;
  applySettings(SET0);
  syncCustomControls();
  buildRows();
  recordDiscrete("reset all");
  render();
  message("Defaults restored.");
  showUndoToast("Sheet reset.");
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
  studioState.cards = sample.map(([title, genre, loc, year, code, h]) => ({ ...blankCard(), title, genre, loc, year, code, h, s: .75 }));
  studioState.count = studioState.cards.length;
  studioState.selectedCard = 0;
  $("count").value = studioState.count;
  buildRows();
  recordDiscrete("load samples");
  render();
  message("Sample cards loaded.");
  showUndoToast("Sample cards loaded.");
}

function updateSurpriseDialogMeta() {
  const lockedCount = studioState.cards.slice(0, studioState.count).filter(c => c.locked).length;
  const info = $("sp-seed-info");
  if (info) {
    info.textContent = `Seed #${lastSurpriseSeed} · ${lockedCount} locked card${lockedCount === 1 ? "" : "s"}`;
  }
}

function syncSurpriseDialog() {
  const prefs = getSurprisePrefs();
  if ($("sp-colors")) $("sp-colors").checked = prefs.scope.colors;
  if ($("sp-keep-theme")) {
    $("sp-keep-theme").checked = prefs.keepTheme;
    $("sp-keep-theme").disabled = !prefs.scope.colors;
  }
  if ($("sp-border")) $("sp-border").checked = prefs.scope.border;
  if ($("sp-stamps")) $("sp-stamps").checked = prefs.scope.stamps;
  if ($("sp-keep-moved")) {
    $("sp-keep-moved").checked = prefs.keepMovedStamps;
    $("sp-keep-moved").disabled = !prefs.scope.stamps;
  }
  if ($("sp-wear")) $("sp-wear").checked = prefs.scope.wear;
  if ($("sp-font")) $("sp-font").checked = prefs.scope.font;
  if ($("sp-strength")) $("sp-strength").value = String(prefs.strength);
  if ($("sp-strength-val")) $("sp-strength-val").textContent = SURPRISE_STRENGTH_LABELS[prefs.strength] || "Normal";
  updateSurpriseDialogMeta();
}

function readSurpriseDialogIntoPrefs() {
  const prefs = saveSurprisePrefs({
    scope: {
      colors: Boolean($("sp-colors")?.checked),
      border: Boolean($("sp-border")?.checked),
      stamps: Boolean($("sp-stamps")?.checked),
      wear: Boolean($("sp-wear")?.checked),
      font: Boolean($("sp-font")?.checked)
    },
    strength: Number($("sp-strength")?.value ?? 1),
    keepTheme: Boolean($("sp-keep-theme")?.checked),
    keepMovedStamps: Boolean($("sp-keep-moved")?.checked)
  });
  syncSurpriseDialog();
  return prefs;
}

function surpriseCards({ seed = generateSeed(), onlyIndex = null, actionLabel = "surprise styling" } = {}) {
  const prefs = getSurprisePrefs();
  if (!Object.values(prefs.scope).some(Boolean)) {
    message("Tick at least one Surprise option first.");
    if (!$("surprise-dialog")?.open) $("surprise-dialog")?.showModal();
    return;
  }
  lastSurpriseSeed = seed;
  studioState.settings = readSettings();
  const cfg = renderConfig();
  const lay = currentLayout || computeLayout($("paper").value, $("csize").value);
  const previousCards = studioState.cards;
  const res = surpriseCardsBatch({
    cards: previousCards,
    count: studioState.count,
    seed: lastSurpriseSeed,
    cfg,
    prefs,
    themes: THEMES,
    CH: lay.CH,
    CW,
    perPage: lay.PER,
    onlyIndices: onlyIndex !== null ? [onlyIndex] : null
  });
  if (onlyIndex === null && res.surprisedCount === 0) {
    message("All cards are locked. Unlock a card or use 'Surprise this card' in its menu.");
    updateSurpriseDialogMeta();
    return;
  }
  res.cards.forEach((nextCard, idx) => {
    if (previousCards[idx] && nextCard !== previousCards[idx]) {
      cardIds.set(nextCard, cardIdentity(previousCards[idx]));
    }
  });
  studioState.cards = res.cards;
  recordDiscrete(actionLabel);
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
  updateSurpriseDialogMeta();

  if (onlyIndex !== null) {
    const movedNote = res.replacedStampCount > 0 ? " (replaced moved stamp)" : "";
    message(`Surprised card #${onlyIndex + 1}${movedNote} (seed #${lastSurpriseSeed}).`);
    showUndoToast(`Card #${onlyIndex + 1} styling randomised.`);
  } else {
    const parts = [`Surprised ${res.surprisedCount} card${res.surprisedCount === 1 ? "" : "s"}`];
    if (res.skippedLocked > 0) parts.push(`${res.skippedLocked} locked`);
    if (res.replacedStampCount > 0) parts.push(`updated ${res.replacedStampCount} moved stamp${res.replacedStampCount === 1 ? "" : "s"}`);
    const summary = parts.join(" · ");
    message(`${summary} (seed #${lastSurpriseSeed}).`);
    showUndoToast(`${summary}.`);
  }
}

function toggleCardLock(index) {
  const current = studioState.cards[index];
  if (!current) return;
  const nextLocked = !current.locked;
  if (nextLocked) {
    updateCard(index, { locked: true });
  } else {
    const { locked: _removed, ...rest } = current;
    const next = { ...rest };
    cardIds.set(next, cardIdentity(current));
    studioState.cards = studioState.cards.map((card, i) => i === index ? next : card);
  }
  recordDiscrete(nextLocked ? "lock card styling" : "unlock card styling");
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
  updateSurpriseDialogMeta();
  message(nextLocked ? `Card #${index + 1} locked ("Keep this one").` : `Card #${index + 1} unlocked.`);
}

function resetSingleCardStyling(index) {
  const current = studioState.cards[index];
  if (!current || !hasCustomCardStyling(current)) {
    message(`Card #${index + 1} already uses sheet defaults.`);
    return;
  }
  const cleared = clearCardStylingRecord(current);
  cardIds.set(cleared, cardIdentity(current));
  studioState.cards = studioState.cards.map((card, i) => i === index ? cleared : card);
  recordDiscrete("reset card styling");
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
  message(`Reset card #${index + 1} styling to sheet defaults.`);
  showUndoToast(`Card #${index + 1} styling reset.`);
}

function clearAllRandomStyling() {
  let changed = 0;
  studioState.cards = studioState.cards.map((card, idx) => {
    if (idx >= studioState.count || !hasCustomCardStyling(card)) return card;
    changed++;
    const cleared = clearCardStylingRecord(card);
    cardIds.set(cleared, cardIdentity(card));
    return cleared;
  });
  if (!changed) {
    message("All cards already match sheet defaults.");
    return;
  }
  recordDiscrete("clear random styling");
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
  updateSurpriseDialogMeta();
  message(`Cleared custom styling on ${changed} card${changed === 1 ? "" : "s"}.`);
  showUndoToast("Cleared random card styling.");
}

function randomise() {
  const themeKeys = Object.keys(THEMES).filter(key => key !== "custom");
  $("style").value = themeKeys[Math.floor(Math.random() * themeKeys.length)];
  studioState.stampShape = [...SKINDS, "mixed"][Math.floor(Math.random() * (SKINDS.length + 1))];
  studioState.stampStyle = undefined;
  $("wear").value = 15 + Math.floor(Math.random() * 60);
  $("bwear").value = 15 + Math.floor(Math.random() * 60);
  $("ssize").value = 50 + 25 * Math.floor(Math.random() * 9);
  $("tgr").value = Math.floor(Math.random() * 40);
  $("tew").value = Math.floor(Math.random() * 50);
  $("tcr").value = Math.random() > .5 ? Math.floor(Math.random() * 50) : 0;
  $("tsc").value = Math.random() > .5 ? Math.floor(Math.random() * 40) : 0;
  $("gspread").value = 25 + Math.floor(Math.random() * 45);
  studioState.borderStyle = Math.floor(Math.random() * (BORDER_STYLES.length - 1));
  studioState.borderConfig = undefined;
  syncBorderControls();
  syncStampControls();
  setGradientAngle(Math.floor(Math.random() * 24) * 15, false);
  recordDiscrete("randomise styling");
  message("Randomised theme, border, stamp and surface details.");
  showUndoToast("Sheet styling randomised.");
}

function previewSvg(index) {
  const originalIndex = studioState.selectedCard;
  studioState.selectedCard = index;
  const layout = currentLayout;
  const baseConfig = renderConfig(true);
  const page = Math.floor(index / layout.PER);
  const cardMarkup = renderCard(studioState.cards[index], index, {
    ...baseConfig,
    lay: layout,
    one: true,
    drag: false,
    cropMarks: false,
    style: studioState.pageThemes[page] || baseConfig.style,
    themeForce: studioState.pageThemes[page] || ""
  });
  studioState.selectedCard = originalIndex;
  const height = Math.max(204, Math.min(309, Math.round((SIZES[$("csize").value] || SIZES.ticket)[1] * 2.83465 / layout.K * 10) / 10));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${CW + 16} ${height + 16}" width="${(CW + 16) * 4}" height="${(height + 16) * 4}"><defs><style>${FONTCSS}</style></defs><rect x="-8" y="-8" width="${CW + 16}" height="${height + 16}" fill="#fff"/>${cardMarkup}</svg>`;
}

function sheetCardPreviewSvg(index) {
  const source = $("sheets").querySelector(`.sheet [data-ci="${index}"]`);
  if (!source) return previewSvg(index);
  const clone = source.cloneNode(true);
  clone.removeAttribute("class");
  clone.querySelectorAll(".pp, .st-ui, .st-snap-guide").forEach(node => node.remove());
  clone.setAttribute("transform", "translate(8 8) scale(1)");
  const height = currentLayout.CH;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${CW + 16} ${height + 16}" width="${(CW + 16) * 4}" height="${(height + 16) * 4}"><defs><style>${FONTCSS}</style></defs><rect x="-8" y="-8" width="${CW + 16}" height="${height + 16}" fill="#fff"/>${clone.outerHTML}</svg>`;
}

function scopePreviewSvgIds(markup, prefix = "pv-") {
  return markup
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
    .replace(/\burl\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`);
}

function refreshPreview() {
  if (previewIndex < 0 || $("pv").hidden) return;
  $("pvi").innerHTML = scopePreviewSvgIds(sheetCardPreviewSvg(previewIndex));
  $("pvt").textContent = `Card ${previewIndex + 1} of ${studioState.count}`;
}

function openPreview(index) {
  previewIndex = (index + studioState.count) % studioState.count;
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

function updatePreviewZoom(value) {
  previewZoom = Math.max(.5, Math.min(2, Math.round(value * 10) / 10));
  const stage = $("stage");
  const stageStyle = getComputedStyle(stage);
  const availableWidth = stage.clientWidth
    - Number.parseFloat(stageStyle.paddingLeft)
    - Number.parseFloat(stageStyle.paddingRight);
  if (availableWidth > 0) {
    const width = Math.min(availableWidth, 740) * previewZoom;
    $("sheets").style.width = `${width}px`;
    $("sheets").style.setProperty("--preview-sheet-width", `${width}px`);
  }
  $("zoom-value").textContent = `${Math.round(previewZoom * 100)}%`;
}

async function printSheet() {
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const images = [...document.querySelectorAll("#sheets image")];
  await Promise.all(images.map(image => new Promise(resolve => {
    if (typeof image.complete === "boolean" && image.complete) {
      resolve();
      return;
    }
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  }))).catch(() => {});
  window.print();
}

function downloadCardSvg() {
  const markup = sheetCardPreviewSvg(previewIndex);
  triggerDownload(new Blob([markup], { type: "image/svg+xml" }), `card-${previewIndex + 1}.svg`);
}

function bindEvents() {
  $("count").addEventListener("change", event => setCount(event.target.value));
  $("crad").addEventListener("change", scheduleRender);
  $("page-select")?.addEventListener("change", event => {
    studioState.activePage = +event.target.value;
    $("page-theme").value = studioState.pageThemes[studioState.activePage] || "";
    $("page-count-label").textContent = `Page ${studioState.activePage + 1} of ${event.target.options.length}`;
    if (historyReady) history.refresh(captureSnapshot());
    scrollStageToPage(studioState.activePage);
  });
  $("page-theme")?.addEventListener("change", event => {
    studioState.pageThemes = studioState.pageThemes.map((theme, page) =>
      page === studioState.activePage ? event.target.value : theme
    );
    recordDiscrete("change page theme");
    scheduleRender();
  });
  $("duplicate-page")?.addEventListener("click", () => duplicateActivePage(currentLayout.PER));
  $("delete-page")?.addEventListener("click", () => deleteActivePage(currentLayout.PER));
  $("rows").addEventListener("click", event => {
    if (event.target.closest("[data-action='clear-search']")) {
      clearCardSearch(true);
      return;
    }
    const row = event.target.closest(".row");
    if (row) selectCard(+row.dataset.index, false, true);
  });
  $("card-search")?.addEventListener("input", event => {
    cardSearchQuery = event.target.value;
    const clearBtn = $("card-search-clear");
    if (clearBtn) clearBtn.hidden = !cardSearchQuery.length;
    debouncedCardSearch();
  });
  $("card-search")?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (cardSearchQuery || event.target.value) {
        event.preventDefault();
        event.stopPropagation();
        clearCardSearch(true);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      debouncedCardSearch.flush();
      const firstMatch = filterCardIndices(studioState.cards, studioState.count, cardSearchQuery).matchedIndices[0];
      if (firstMatch !== undefined) selectCard(firstMatch, true, true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      debouncedCardSearch.flush();
      const firstVisibleBtn = $("rows")?.querySelector(".row:not([hidden]) [data-action='select-card']");
      firstVisibleBtn?.focus();
    }
  });
  $("card-search-clear")?.addEventListener("click", () => clearCardSearch(true));
  document.querySelectorAll("[data-live]").forEach(input => input.addEventListener("input", scheduleRender));
  ["marks", "bleed", "nfc", "punch", "tpl", "regmarks", "sauto", "design-badge", "design-tear", "design-filter", "design-center", "design-halftone"].forEach(id => $(id).addEventListener("change", scheduleRender));
  $("style").addEventListener("change", () => {
    studioState.quickColors = undefined;
    syncQuickColorsControls({ rebuildStops: true });
    syncThemeDropdown();
    scheduleRender();
  });
  $("theme-trigger")?.addEventListener("click", () => {
    if ($("theme-menu")?.hidden) openThemeMenu();
    else closeThemeMenu();
  });
  $("theme-filter")?.addEventListener("input", event => {
    buildThemeDropdown(event.target.value);
  });
  $("theme-menu-list")?.addEventListener("click", event => {
    const option = event.target.closest?.(".theme-option");
    if (option?.dataset.themeKey) selectThemeKey(option.dataset.themeKey);
  });
  $("theme-menu")?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeThemeMenu(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const options = [...$("theme-menu-list").querySelectorAll(".theme-option")];
      if (!options.length) return;
      event.preventDefault();
      const idx = options.indexOf(document.activeElement);
      const next = idx < 0
        ? (event.key === "ArrowDown" ? 0 : options.length - 1)
        : (idx + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      options[next].focus();
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!$("theme-menu")?.hidden && !event.target.closest?.("#theme-dropdown")) {
      closeThemeMenu();
    }
  });
  $("drag").addEventListener("change", () => {
    if ($("drag").checked && moveStampsMode) {
      moveStampsMode = false;
      message("Drag photos on (turned off Move stamps).");
    }
    render();
  });
  $("move-stamps")?.addEventListener("click", () => {
    moveStampsMode = !moveStampsMode;
    if (moveStampsMode && $("drag").checked) {
      $("drag").checked = false;
      message("Move stamps on (turned off photo drag).");
    } else {
      message(moveStampsMode ? "Move stamps on: drag or use arrow keys on a stamp." : "Move stamps off.");
    }
    render();
  });
  $("reset-all-stamps")?.addEventListener("click", () => {
    let changed = false;
    studioState.cards = studioState.cards.map(card => {
      if (!card.stampPos && !card.stamp2Pos) return card;
      changed = true;
      const { stampPos: _p1, stamp2Pos: _p2, ...rest } = card;
      const next = { ...rest };
      cardIds.set(next, cardIdentity(card));
      return next;
    });
    if (!changed) {
      message("All stamps are already using auto placement.");
      return;
    }
    recordDiscrete("reset all stamps");
    buildRows();
    render();
    showUndoToast("All stamp positions reset.");
  });
  ["ssize", "gspread", "tgr", "tew", "tcr", "tsc"].forEach(id => $(id).addEventListener("input", scheduleRender));
  $("wear").addEventListener("input", () => {
    syncStampControls();
    scheduleRender();
  });
  $("bwear").addEventListener("input", () => {
    syncBorderControls();
    scheduleRender();
  });

  $("stamp-picker")?.addEventListener("click", event => {
    const swatch = event.target.closest("[data-stamp-shape]");
    if (swatch) selectStampShape(swatch.dataset.stampShape);
  });
  $("stamp-picker")?.addEventListener("keydown", event => {
    const buttons = [...$("stamp-picker").querySelectorAll("[data-stamp-shape]")];
    const current = buttons.indexOf(event.target.closest("[data-stamp-shape]"));
    if (current < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 4, ArrowLeft: -1, ArrowUp: -4 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      const nextIndex = (current + step + buttons.length) % buttons.length;
      const nextBtn = buttons[nextIndex];
      nextBtn.focus();
      selectStampShape(nextBtn.dataset.stampShape);
    }
  });

  for (const id of STAMP_CONTROL_IDS) {
    const el = $(id);
    if (!el) continue;
    const handler = () => readStampControlsIntoState(id === "st-wear");
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  }

  $("st-apply-selected")?.addEventListener("click", () => {
    const index = studioState.selectedCard;
    const style = studioState.stampStyle ? { ...studioState.stampStyle } : undefined;
    const current = studioState.cards[index];
    if (!current) return;
    const { stampStyle: _old, ...rest } = current;
    const next = { ...rest, sk: studioState.stampShape, ...(style ? { stampStyle: style } : {}) };
    cardIds.set(next, cardIdentity(current));
    studioState.cards = studioState.cards.map((item, cardIndex) => cardIndex === index ? next : item);
    recordDiscrete("apply stamp to card");
    buildRows();
    render();
    message(`Applied stamp look to card #${index + 1}.`);
  });

  $("st-apply-all")?.addEventListener("click", () => {
    studioState.cards = studioState.cards.map(card => {
      if (!card.sk && !card.stampStyle) return card;
      const { stampStyle: _removed, ...rest } = card;
      const next = { ...rest, sk: "" };
      cardIds.set(next, cardIdentity(card));
      return next;
    });
    recordDiscrete("apply stamp to all cards");
    buildRows();
    render();
    message("Applied stamp look to all cards.");
  });

  $("st-reset-style")?.addEventListener("click", () => {
    studioState.stampStyle = undefined;
    syncStampControls();
    refreshStampSwatches();
    recordDiscrete("reset stamp customisation");
    render();
    message("Reset stamp customisations to defaults.");
  });

  $("st-preset-select")?.addEventListener("change", syncStampPresetButtons);
  $("st-preset-save")?.addEventListener("click", () => {
    const presets = getStampPresets();
    const rawName = $("st-preset-name").value;
    const name = uniqueStampPresetName(rawName || getStampShapeName(studioState.stampShape), presets.map(p => p.name));
    const id = `sp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const stamp = {
      shape: studioState.stampShape,
      ...(studioState.stampStyle ? { style: { ...studioState.stampStyle } } : {}),
      wear: Number($("wear").value)
    };
    const next = [...presets, { id, name, stamp }];
    if (!saveStampPresetsList(next)) {
      message("Could not save stamp preset.");
      return;
    }
    $("st-preset-name").value = "";
    populateStampPresets(id);
    message(`Saved stamp preset "${name}".`);
  });

  $("st-preset-apply")?.addEventListener("click", () => {
    const id = $("st-preset-select").value;
    const preset = getStampPresets().find(p => p.id === id);
    if (!preset) return;
    const shape = String(preset.stamp.shape || "round");
    studioState.stampShape = STAMP_OPTIONS.some(o => o.id === shape) ? shape : "round";
    if (preset.stamp.wear !== undefined) $("wear").value = String(preset.stamp.wear);
    studioState.stampStyle = compactStampStyle(preset.stamp.style);
    syncStampControls();
    refreshStampSwatches();
    recordDiscrete("apply stamp preset");
    render();
    message(`Applied preset "${preset.name}" to sheet.`);
  });

  $("st-preset-apply-card")?.addEventListener("click", () => {
    const id = $("st-preset-select").value;
    const preset = getStampPresets().find(p => p.id === id);
    if (!preset) return;
    const index = studioState.selectedCard;
    const current = studioState.cards[index];
    if (!current) return;
    const shape = String(preset.stamp.shape || "round");
    const style = compactStampStyle(preset.stamp.style);
    const { stampStyle: _old, ...rest } = current;
    const next = { ...rest, sk: shape, ...(style ? { stampStyle: style } : {}) };
    cardIds.set(next, cardIdentity(current));
    studioState.cards = studioState.cards.map((item, cardIndex) => cardIndex === index ? next : item);
    recordDiscrete("apply stamp preset to card");
    buildRows();
    render();
    message(`Applied preset "${preset.name}" to card #${index + 1}.`);
  });

  $("st-preset-delete")?.addEventListener("click", () => {
    const id = $("st-preset-select").value;
    const presets = getStampPresets();
    const preset = presets.find(p => p.id === id);
    if (!preset || !window.confirm(`Delete stamp preset "${preset.name}"?`)) return;
    saveStampPresetsList(presets.filter(p => p.id !== id));
    populateStampPresets();
    message(`Deleted stamp preset "${preset.name}".`);
  });

  $("border-picker")?.addEventListener("click", event => {
    const swatch = event.target.closest("[data-border-style]");
    if (swatch) selectBorderStyle(Number(swatch.dataset.borderStyle));
  });
  $("border-picker")?.addEventListener("keydown", event => {
    const buttons = [...$("border-picker").querySelectorAll("[data-border-style]")];
    const current = buttons.indexOf(event.target.closest("[data-border-style]"));
    if (current < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 4, ArrowLeft: -1, ArrowUp: -4 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      const nextIndex = (current + step + buttons.length) % buttons.length;
      const nextBtn = buttons[nextIndex];
      nextBtn.focus();
      selectBorderStyle(Number(nextBtn.dataset.borderStyle));
    }
  });

  for (const id of BORDER_CONTROL_IDS) {
    const el = $(id);
    if (!el) continue;
    const handler = () => readBorderControlsIntoState(id === "bd-wear");
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  }

  $("bd-apply-selected")?.addEventListener("click", () => {
    const index = studioState.selectedCard;
    const patch = sanitizeBorderPatch({
      style: studioState.borderStyle,
      ...(studioState.borderConfig || {}),
      wear: Number($("bwear").value)
    });
    updateCard(index, { border: patch });
    recordDiscrete("apply border to card");
    buildRows();
    render();
    message(`Applied border to card #${index + 1}.`);
  });

  $("bd-apply-all")?.addEventListener("click", () => {
    studioState.cards = studioState.cards.map(card => {
      if (!card.border) return card;
      const { border: _removed, ...rest } = card;
      const next = { ...rest };
      cardIds.set(next, cardIdentity(card));
      return next;
    });
    recordDiscrete("apply border to all cards");
    buildRows();
    render();
    message("Applied border to all cards.");
  });

  $("bd-reset-style")?.addEventListener("click", () => {
    studioState.borderConfig = undefined;
    syncBorderControls();
    recordDiscrete("reset border customisation");
    render();
    message("Reset border customisations to style defaults.");
  });

  $("bd-preset-select")?.addEventListener("change", syncPresetButtons);
  $("bd-preset-save")?.addEventListener("click", () => {
    const presets = getBorderPresets();
    const rawName = $("bd-preset-name").value;
    const name = uniquePresetName(rawName || getBorderStyleMeta(studioState.borderStyle).name, presets.map(p => p.name));
    const id = `bp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const border = sanitizeBorderPatch({
      style: studioState.borderStyle,
      ...(studioState.borderConfig || {}),
      wear: Number($("bwear").value)
    });
    const next = [...presets, { id, name, border }];
    if (!saveBorderPresetsList(next)) {
      message("Could not save border preset.");
      return;
    }
    $("bd-preset-name").value = "";
    populateBorderPresets(id);
    message(`Saved border preset "${name}".`);
  });

  $("bd-preset-apply")?.addEventListener("click", () => {
    const id = $("bd-preset-select").value;
    const preset = getBorderPresets().find(p => p.id === id);
    if (!preset) return;
    const patch = sanitizeBorderPatch(preset.border) || {};
    studioState.borderStyle = patch.style ?? 0;
    if (patch.wear !== undefined) $("bwear").value = String(patch.wear);
    studioState.borderConfig = compactBorderOverrides(studioState.borderStyle, patch);
    syncBorderControls();
    recordDiscrete("apply border preset");
    render();
    message(`Applied preset "${preset.name}" to sheet.`);
  });

  $("bd-preset-apply-card")?.addEventListener("click", () => {
    const id = $("bd-preset-select").value;
    const preset = getBorderPresets().find(p => p.id === id);
    if (!preset) return;
    const index = studioState.selectedCard;
    updateCard(index, { border: sanitizeBorderPatch(preset.border) });
    recordDiscrete("apply border preset to card");
    buildRows();
    render();
    message(`Applied preset "${preset.name}" to card #${index + 1}.`);
  });

  $("bd-preset-delete")?.addEventListener("click", () => {
    const id = $("bd-preset-select").value;
    const presets = getBorderPresets();
    const preset = presets.find(p => p.id === id);
    if (!preset || !window.confirm(`Delete border preset "${preset.name}"?`)) return;
    saveBorderPresetsList(presets.filter(p => p.id !== id));
    populateBorderPresets();
    message(`Deleted border preset "${preset.name}".`);
  });
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
      const key = input.id.slice(3);
      const val = input.type === "checkbox" ? input.checked : input.value;
      if ($("style").value === "custom") {
        studioState.settings = {
          ...studioState.settings,
          customTheme: {
            ...studioState.settings.customTheme,
            [key]: val
          }
        };
        Object.assign(CUSTOM, studioState.settings.customTheme);
        buildCustom();
      } else {
        studioState.quickColors = {
          ...(studioState.quickColors || {}),
          [key]: val,
          ...(key === "acc" ? { pa: false } : {})
        };
        if (key === "acc" && $("ct_pa")) $("ct_pa").checked = false;
      }
      syncQuickColorsControls({ rebuildStops: false });
      scheduleRender();
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  $("ct_reset")?.addEventListener("click", () => {
    if ($("style").value === "custom") {
      studioState.settings = { ...studioState.settings, customTheme: { ...DEFAULT_CUSTOM } };
      Object.assign(CUSTOM, DEFAULT_CUSTOM);
      buildCustom();
    } else {
      studioState.quickColors = undefined;
    }
    syncQuickColorsControls({ rebuildStops: true });
    recordDiscrete("reset quick colours");
    render();
    message("Reset theme colours to preset defaults.");
  });

  const updateGradStop = (idx, hex) => {
    const clean = toHex6(hex, "");
    if (!clean) return;
    const themeKey = $("style").value || "cream";
    const theme = THEMES[themeKey] || THEMES.cream;
    const currentStops = resolveActiveThemeStops(theme, themeKey === "custom" ? CUSTOM : studioState.quickColors);
    const nextStops = currentStops.slice();
    nextStops[idx] = clean;
    if (themeKey === "custom") {
      studioState.settings = {
        ...studioState.settings,
        customTheme: { ...studioState.settings.customTheme, gradStops: nextStops, gs: nextStops[0] }
      };
      Object.assign(CUSTOM, studioState.settings.customTheme);
      buildCustom();
    } else {
      studioState.quickColors = { ...(studioState.quickColors || {}), gradStops: nextStops };
    }
    syncQuickColorsControls({ rebuildStops: false });
    scheduleRender();
  };

  $("grad-stops-row")?.addEventListener("input", event => {
    const input = event.target.closest?.("input[data-grad-stop]");
    if (!input) return;
    updateGradStop(Number(input.dataset.gradStop), input.value);
    recordContinuous("change gradient colour", `setting:grad-stop:${input.dataset.gradStop}`);
  });
  $("grad-stops-row")?.addEventListener("change", event => {
    const input = event.target.closest?.("input[data-grad-stop]");
    if (!input) return;
    updateGradStop(Number(input.dataset.gradStop), input.value);
    finishContinuous("change gradient colour", `setting:grad-stop:${input.dataset.gradStop}`);
  });
  $("grad-stop-add")?.addEventListener("click", () => {
    const themeKey = $("style").value || "cream";
    const theme = THEMES[themeKey] || THEMES.cream;
    const stops = resolveActiveThemeStops(theme, themeKey === "custom" ? CUSTOM : studioState.quickColors);
    if (stops.length >= 4) return;
    const mid = blendHex(stops.at(-2) || stops[0], stops.at(-1), 0.5);
    const nextStops = [...stops.slice(0, -1), mid, stops.at(-1)];
    if (themeKey === "custom") {
      studioState.settings = { ...studioState.settings, customTheme: { ...studioState.settings.customTheme, gradStops: nextStops } };
      Object.assign(CUSTOM, studioState.settings.customTheme);
      buildCustom();
    } else {
      studioState.quickColors = { ...(studioState.quickColors || {}), gradStops: nextStops };
    }
    syncQuickColorsControls({ rebuildStops: true });
    recordDiscrete("add gradient colour");
    render();
  });
  $("grad-stop-remove")?.addEventListener("click", () => {
    const themeKey = $("style").value || "cream";
    const theme = THEMES[themeKey] || THEMES.cream;
    const stops = resolveActiveThemeStops(theme, themeKey === "custom" ? CUSTOM : studioState.quickColors);
    if (stops.length <= 2) return;
    const nextStops = [...stops.slice(0, -2), stops.at(-1)];
    if (themeKey === "custom") {
      studioState.settings = { ...studioState.settings, customTheme: { ...studioState.settings.customTheme, gradStops: nextStops } };
      Object.assign(CUSTOM, studioState.settings.customTheme);
      buildCustom();
    } else {
      studioState.quickColors = { ...(studioState.quickColors || {}), gradStops: nextStops };
    }
    syncQuickColorsControls({ rebuildStops: true });
    recordDiscrete("remove gradient colour");
    render();
  });

  $("prev-style").addEventListener("click", () => cycleTheme(-1));
  $("next-style").addEventListener("click", () => cycleTheme(1));
  $("print").addEventListener("click", () => {
    printSheet().catch(() => window.print());
  });
  $("mobile-print").addEventListener("click", () => $("print").click());
  $("mobile-export").addEventListener("click", () => $("svg").click());
  $("svg").addEventListener("click", () => exportAllSvgs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("png").addEventListener("click", () => exportAllPngs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("pdf").addEventListener("click", () => exportPdf([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("cut").addEventListener("click", () => {
    triggerDownload(new Blob([cutSvg(currentLayout, $("crad").value, $("regmarks").checked)], { type: "image/svg+xml" }), "cutter-template.svg");
    message("Cutter SVG downloaded (red = cut, blue = punch).");
  });
  $("rnd").addEventListener("click", randomise);
  $("surprise-all")?.addEventListener("click", () => surpriseCards({ seed: generateSeed(), actionLabel: "surprise styling" }));
  $("surprise-tune")?.addEventListener("click", () => {
    syncSurpriseDialog();
    $("surprise-dialog")?.showModal();
    $("surprise-tune")?.setAttribute("aria-expanded", "true");
  });
  $("surprise-dialog")?.addEventListener("close", () => {
    $("surprise-tune")?.setAttribute("aria-expanded", "false");
  });
  $("surprise-dialog")?.addEventListener("click", event => {
    if (event.target === $("surprise-dialog")) $("surprise-dialog").close();
  });
  ["sp-colors", "sp-keep-theme", "sp-border", "sp-stamps", "sp-keep-moved", "sp-wear", "sp-font", "sp-strength"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", readSurpriseDialogIntoPrefs);
    el.addEventListener("change", readSurpriseDialogIntoPrefs);
  });
  $("sp-apply-all")?.addEventListener("click", () => {
    readSurpriseDialogIntoPrefs();
    surpriseCards({ seed: generateSeed(), actionLabel: "surprise styling" });
    $("surprise-dialog")?.close();
  });
  $("sp-reshuffle")?.addEventListener("click", () => {
    readSurpriseDialogIntoPrefs();
    surpriseCards({ seed: generateSeed(), actionLabel: "shuffle card styling" });
  });
  $("sp-clear-all")?.addEventListener("click", () => {
    clearAllRandomStyling();
  });
  $("smp").addEventListener("click", loadSamples);
  $("rst").addEventListener("click", async () => { await clearSession(); resetDefaults(); });
  $("exp").addEventListener("click", () => exportProjectJson(readSettings(), studioState.cards, studioState.count));
  $("data-open").addEventListener("click", () => $("data-dialog").showModal());
  document.querySelectorAll(".action-menu").forEach(menu => {
    menu.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { menu.open = false; }));
  });
  document.querySelectorAll("[data-mobile-view]").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.mobileView;
    $("app").dataset.mobileView = view;
    document.body.dataset.mobileView = view;
    document.querySelectorAll("[data-mobile-view]").forEach(toggle => {
      toggle.setAttribute("aria-pressed", String(toggle === button));
    });
    updatePreviewZoom(previewZoom);
  }));
  $("zoom-out").addEventListener("click", () => updatePreviewZoom(previewZoom - .1));
  $("zoom-in").addEventListener("click", () => updatePreviewZoom(previewZoom + .1));
  $("zoom-fit").addEventListener("click", () => updatePreviewZoom(1));
  window.addEventListener("resize", () => updatePreviewZoom(previewZoom));
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
    getCardRowEl(index)?.querySelector("[data-field='title']")?.focus({ preventScroll: true });
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
    if (event.target.closest(".pp, .st-ui")) return;
    const cardElement = event.target.closest("[data-ci]");
    if (cardElement) openPreview(+cardElement.dataset.ci);
  });
  document.addEventListener("keydown", event => {
    if ($("pv").hidden) return;
    if (event.key === "Escape") closePreview();
    else if (event.key === "ArrowLeft") openPreview(previewIndex - 1);
    else if (event.key === "ArrowRight") openPreview(previewIndex + 1);
  });
  document.addEventListener("keydown", event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextEditingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === "z" && event.shiftKey && history.canRedo) {
      event.preventDefault();
      redo();
    } else if (key === "y" && !event.shiftKey && history.canRedo) {
      event.preventDefault();
      redo();
    } else if (key === "z" && !event.shiftKey && history.canUndo) {
      event.preventDefault();
      undo();
    }
  });
  $("undo").addEventListener("click", undo);
  $("redo").addEventListener("click", redo);
  $("undo-toast-action").addEventListener("click", undo);
  bindHistoryControlEvents();

  const dial = $("dial");
  const angleFromEvent = event => {
    const rect = dial.getBoundingClientRect();
    return Math.atan2(event.clientX - (rect.left + rect.width / 2), -(event.clientY - (rect.top + rect.height / 2))) * 180 / Math.PI;
  };
  dial.addEventListener("pointerdown", event => {
    if (dial.getAttribute("aria-disabled") === "true") return;
    dial.setPointerCapture(event.pointerId);
    dial.dataset.dragging = "true";
    setGradientAngle(angleFromEvent(event), !event.shiftKey);
    recordContinuous("change gradient angle", "setting:gradient-angle");
  });
  dial.addEventListener("pointermove", event => {
    if (dial.dataset.dragging) {
      setGradientAngle(angleFromEvent(event), !event.shiftKey);
      recordContinuous("change gradient angle", "setting:gradient-angle");
    }
  });
  ["pointerup", "pointercancel"].forEach(name => dial.addEventListener(name, () => {
    delete dial.dataset.dragging;
    finishContinuous("change gradient angle", "setting:gradient-angle");
  }));
  dial.addEventListener("keydown", event => {
    if (dial.getAttribute("aria-disabled") === "true") return;
    const step = event.shiftKey ? 15 : 5;
    const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      setGradientAngle(studioState.gradientAngle + delta, false);
      recordContinuous("change gradient angle", "setting:gradient-angle");
    } else if (event.key === "Home") {
      event.preventDefault();
      setGradientAngle(180, false);
      recordContinuous("change gradient angle", "setting:gradient-angle");
    }
  });
  $("grad-angle-reset")?.addEventListener("click", () => {
    setGradientAngle(180, false);
    recordDiscrete("reset gradient angle");
  });

  $("sheets").addEventListener("pointerdown", event => {
    const rotTarget = event.target.closest(".st-rot-hit");
    if (rotTarget && moveStampsMode) {
      event.preventDefault();
      const index = Number(rotTarget.dataset.ci);
      let si = Number(rotTarget.dataset.si) === 1 ? 1 : 0;
      const cardGroup = rotTarget.closest("g[data-ci]:not(.st-ui)");
      const ctm = cardGroup.getScreenCTM();
      const st = resolveCardStamp(index, si);
      const pt = new DOMPoint(st.x, st.y).matrixTransform(ctm);
      const uiGroup = rotTarget.closest(".st-ui");
      const knobPt = new DOMPoint(0, Number(rotTarget.getAttribute("cy")) || -32).matrixTransform(uiGroup.getScreenCTM());
      const dKnob = Math.hypot(event.clientX - knobPt.x, event.clientY - knobPt.y);
      const dCenter = Math.hypot(event.clientX - pt.x, event.clientY - pt.y);
      if (dCenter < dKnob) {
        if ($("gs2")?.value.trim()) {
          const s0 = resolveCardStamp(index, 0);
          const s1 = resolveCardStamp(index, 1);
          const p0 = new DOMPoint(s0.x, s0.y).matrixTransform(ctm);
          const p1 = new DOMPoint(s1.x, s1.y).matrixTransform(ctm);
          si = Math.hypot(event.clientX - p1.x, event.clientY - p1.y) < Math.hypot(event.clientX - p0.x, event.clientY - p0.y) ? 1 : 0;
        }
        selectedStampIndex = si;
        selectCard(index);
        const targetSt = resolveCardStamp(index, si);
        rotTarget.setPointerCapture?.(event.pointerId);
        stampDragState = {
          mode: "move",
          index,
          stampIndex: si,
          startX: event.clientX,
          startY: event.clientY,
          startNx: targetSt.nx,
          startNy: targetSt.ny,
          cardScale: ctm.a,
          moved: false
        };
        return;
      }
      selectedStampIndex = si;
      selectCard(index);
      rotTarget.setPointerCapture?.(event.pointerId);
      stampDragState = { mode: "rotate", index, stampIndex: si, cx: pt.x, cy: pt.y, moved: false };
      return;
    }

    const stTarget = event.target.closest(".st-hit");
    if (stTarget && moveStampsMode) {
      event.preventDefault();
      const index = Number(stTarget.dataset.ci);
      const cardGroup = stTarget.closest("g[data-ci]:not(.st-ui)");
      const ctm = cardGroup.getScreenCTM();
      let si = Number(stTarget.dataset.si) === 1 ? 1 : 0;
      if ($("gs2")?.value.trim()) {
        const s0 = resolveCardStamp(index, 0);
        const s1 = resolveCardStamp(index, 1);
        const p0 = new DOMPoint(s0.x, s0.y).matrixTransform(ctm);
        const p1 = new DOMPoint(s1.x, s1.y).matrixTransform(ctm);
        si = Math.hypot(event.clientX - p1.x, event.clientY - p1.y) < Math.hypot(event.clientX - p0.x, event.clientY - p0.y) ? 1 : 0;
      }
      selectedStampIndex = si;
      selectCard(index);
      const st = resolveCardStamp(index, si);
      stTarget.setPointerCapture?.(event.pointerId);
      stampDragState = {
        mode: "move",
        index,
        stampIndex: si,
        startX: event.clientX,
        startY: event.clientY,
        startNx: st.nx,
        startNy: st.ny,
        cardScale: ctm.a,
        moved: false
      };
      return;
    }

    const target = event.target.closest(".pp");
    if (!target) return;
    const index = +target.dataset.ci, card = studioState.cards[index];
    if (!card?.img || !card.iw) return;
    event.preventDefault();
    dragState = { index, x: event.clientX, y: event.clientY, px: card.px || 0, py: card.py || 0, scale: target.ownerSVGElement.getScreenCTM().a };
  });
  window.addEventListener("pointermove", event => {
    if (stampDragState) {
      const { mode, index, stampIndex: si } = stampDragState;
      const st = resolveCardStamp(index, si);
      const current = studioState.cards[index]?.[stampKeyFor(si)];
      if (mode === "rotate") {
        const raw = Math.atan2(event.clientX - stampDragState.cx, -(event.clientY - stampDragState.cy)) * 180 / Math.PI;
        const angle = normalizeAngle(event.shiftKey ? Math.round(raw / 15) * 15 : raw);
        const next = sanitizeStampOverride({
          x: current?.x ?? st.nx,
          y: current?.y ?? st.ny,
          r: angle,
          scale: current?.scale ?? st.mult
        });
        updateCard(index, { [stampKeyFor(si)]: next });
        patchLiveStampDom(index, si);
        stampDragState.moved = true;
      } else {
        if (!stampDragState.moved && Math.hypot(event.clientX - stampDragState.startX, event.clientY - stampDragState.startY) < 2) return;
        const dx = (event.clientX - stampDragState.startX) / stampDragState.cardScale;
        const dy = (event.clientY - stampDragState.startY) / stampDragState.cardScale;
        const CH = currentLayout?.CH || 239;
        const bounds = { CW, CH, effScale: st.scale };
        const raw = clampStampNorm(stampDragState.startNx + dx / CW, stampDragState.startNy + dy / CH, bounds);
        const snapped = snapStampNorm(raw.nx, raw.ny, {
          CW,
          CH,
          effScale: st.scale,
          snapEnabled: $("stamp-snap")?.checked ?? true,
          bypass: event.altKey || event.shiftKey
        });
        const next = sanitizeStampOverride({
          x: snapped.nx,
          y: snapped.ny,
          r: current?.r ?? st.r,
          scale: current?.scale ?? st.mult
        }, bounds);
        updateCard(index, { [stampKeyFor(si)]: next });
        patchLiveStampDom(index, si, snapped);
        stampDragState.moved = true;
      }
      return;
    }

    if (!dragState) return;
    const card = studioState.cards[dragState.index], box = fitBox(card, currentLayout.CH);
    if (!box) return;
    const dx = (event.clientX - dragState.x) / dragState.scale;
    const dy = (event.clientY - dragState.y) / dragState.scale;
    const px = box.mx > 0 ? Math.max(-100, Math.min(100, dragState.px + dx / box.mx * 100)) : 0;
    const py = box.my > 0 ? Math.max(-100, Math.min(100, dragState.py + dy / box.my * 100)) : 0;
    updateCard(dragState.index, { px, py });
    recordContinuous("reposition card photo", `card:${dragState.index}:photo-position`);
    const image = $("photo" + dragState.index);
    if (image) {
      const photoHeight = 136 + currentLayout.CH - 239;
      image.setAttribute("x", (17 + 68 - box.w / 2 + px / 100 * box.mx).toFixed(2));
      image.setAttribute("y", (16 + photoHeight / 2 - box.h / 2 + py / 100 * box.my).toFixed(2));
    }
    const row = getCardRowEl(dragState.index);
    if (row) {
      row.querySelector("[data-adjust='px']").value = px;
      row.querySelector("[data-adjust='py']").value = py;
    }
  });
  ["pointerup", "pointercancel"].forEach(name => window.addEventListener(name, () => {
    if (stampDragState) {
      const { mode, moved } = stampDragState;
      stampDragState = null;
      $("sheets")?.querySelectorAll(".st-snap-guide").forEach(node => node.remove());
      if (moved) {
        recordDiscrete(mode === "rotate" ? "rotate stamp" : "move stamp");
        render();
      }
    }
    if (!dragState) return;
    finishContinuous("reposition card photo", `card:${dragState.index}:photo-position`);
    dragState = null;
    render();
  }));
  $("sheets").addEventListener("keydown", event => {
    const target = event.target.closest(".st-hit");
    if (!target || !moveStampsMode) return;
    const step = event.shiftKey ? 10 : 2;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    const index = Number(target.dataset.ci);
    const si = Number(target.dataset.si) === 1 ? 1 : 0;
    selectedStampIndex = si;
    const CH = currentLayout?.CH || 239;
    const st = resolveCardStamp(index, si);
    const current = studioState.cards[index]?.[stampKeyFor(si)];
    const bounds = { CW, CH, effScale: st.scale };
    const clamped = clampStampNorm(st.nx + delta[0] / CW, st.ny + delta[1] / CH, bounds);
    const next = sanitizeStampOverride({
      x: clamped.nx,
      y: clamped.ny,
      r: current?.r ?? st.r,
      scale: current?.scale ?? st.mult
    }, bounds);
    updateCard(index, { [stampKeyFor(si)]: next });
    patchLiveStampDom(index, si);
    const resetAllStampsBtn = $("reset-all-stamps");
    if (resetAllStampsBtn) resetAllStampsBtn.hidden = false;
    recordContinuous("nudge stamp", `card:${index}:stamp-nudge:${si}`);
    saveSoon();
  });
  $("sheets").addEventListener("focusout", event => {
    const target = event.target.closest(".st-hit");
    if (!target) return;
    const index = Number(target.dataset.ci);
    const si = Number(target.dataset.si) === 1 ? 1 : 0;
    finishContinuous("nudge stamp", `card:${index}:stamp-nudge:${si}`);
  });
}

function cycleTheme(direction) {
  const select = $("style");
  const options = [...select.options];
  const current = options.findIndex(option => option.value === select.value);
  select.value = options[(current + direction + options.length) % options.length].value;
  studioState.quickColors = undefined;
  syncQuickColorsControls({ rebuildStops: true });
  syncThemeDropdown();
  recordDiscrete("change theme");
  render();
}

function syncPageTools(pageCount) {
  const select = $("page-select");
  const themeSelect = $("page-theme");
  if (!select || !themeSelect) return;
  while (studioState.pageThemes.length < pageCount) studioState.pageThemes = [...studioState.pageThemes, ""];
  if (studioState.pageThemes.length > pageCount) studioState.pageThemes = studioState.pageThemes.slice(0, pageCount);
  studioState.activePage = Math.min(studioState.activePage, pageCount - 1);
  select.innerHTML = Array.from({ length: pageCount }, (_, page) =>
    `<option value="${page}"${page === studioState.activePage ? " selected" : ""}>Page ${page + 1}</option>`
  ).join("");
  $("page-count-label").textContent = `Page ${studioState.activePage + 1} of ${pageCount}`;
  if (!themeSelect.options.length || themeSelect.options.length === 1) {
    themeSelect.innerHTML = `<option value="">Use global</option>${getGroupedThemes().map(([lbl, entries]) =>
      `<optgroup label="${escapeHtml(lbl)}">${entries.map(([key, theme]) => `<option value="${key}">${escapeHtml(theme.n)}</option>`).join("")}</optgroup>`
    ).join("")}`;
  }
  themeSelect.value = studioState.pageThemes[studioState.activePage] || "";
  const deletePageBtn = $("delete-page");
  if (deletePageBtn) {
    deletePageBtn.disabled = pageCount <= 1;
    deletePageBtn.setAttribute(
      "aria-label",
      pageCount <= 1 ? "Need at least 2 pages to delete a page" : `Delete page ${studioState.activePage + 1}`
    );
  }
}

function deleteActivePage(perPage) {
  const pageCount = Math.ceil(studioState.count / perPage);
  if (pageCount <= 1) {
    message("Need at least 2 pages to delete a page.");
    return;
  }
  const targetPage = studioState.activePage;
  const start = targetPage * perPage;
  const end = Math.min(studioState.count, start + perPage);
  const removedCount = end - start;
  if (removedCount <= 0 || studioState.count - removedCount < 1) return;

  const remainingActive = [
    ...studioState.cards.slice(0, start),
    ...studioState.cards.slice(end, studioState.count)
  ];
  const trailingBuffer = studioState.cards.slice(studioState.count);
  studioState.cards = [...remainingActive, ...trailingBuffer];
  studioState.count = remainingActive.length;
  studioState.pageThemes = [
    ...studioState.pageThemes.slice(0, targetPage),
    ...studioState.pageThemes.slice(targetPage + 1)
  ];
  const nextPageCount = Math.ceil(studioState.count / perPage);
  studioState.activePage = Math.max(0, Math.min(targetPage, nextPageCount - 1));
  studioState.selectedCard = Math.max(0, Math.min(studioState.selectedCard, studioState.count - 1));
  $("count").value = studioState.count;
  buildRows();
  recordDiscrete("delete page");
  render();
  message(`Deleted page ${targetPage + 1} (${removedCount} card${removedCount === 1 ? "" : "s"}).`);
  showUndoToast(`Deleted page ${targetPage + 1}.`);
}

function duplicateActivePage(perPage) {
  const start = studioState.activePage * perPage;
  const end = Math.min(studioState.cards.length, start + perPage);
  if (start >= studioState.cards.length) return;
  const sourcePage = studioState.activePage + 1;
  const pageCards = studioState.cards.slice(start, end).map(card => {
    const duplicate = { ...card };
    cardIds.set(duplicate, ++nextCardId);
    return duplicate;
  });
  if (studioState.cards.length + pageCards.length > MAX_CARDS) {
    message(`That would exceed the ${MAX_CARDS}-card limit. Remove or duplicate fewer cards first.`);
    return;
  }
  const insertAt = Math.min(studioState.cards.length, end);
  studioState.cards = [...studioState.cards.slice(0, insertAt), ...pageCards, ...studioState.cards.slice(insertAt)];
  studioState.count = Math.min(MAX_CARDS, studioState.cards.length);
  studioState.cards = studioState.cards.slice(0, studioState.count);
  studioState.pageThemes = [
    ...studioState.pageThemes.slice(0, studioState.activePage + 1),
    studioState.pageThemes[studioState.activePage] || "",
    ...studioState.pageThemes.slice(studioState.activePage + 1)
  ];
  studioState.activePage++;
  $("count").value = studioState.count;
  buildRows();
  recordDiscrete("duplicate page");
  render();
  message(`Duplicated page ${sourcePage} with ${pageCards.length} card${pageCards.length === 1 ? "" : "s"}.`);
}

async function init() {
  injectFonts();
  hydrateIcons();
  bindTapTooltips();
  attachColorHexFields();
  populateThemeSelect($("style"));
  buildThemeDropdown();
  syncThemeDropdown();
  buildBorderPicker();
  populateBorderPresets();
  syncBorderControls();
  buildStampPicker();
  populateStampPresets();
  syncStampControls();
  syncCustomControls();
  updatePreviewZoom(1);
  const printStyle = document.createElement("style");
  printStyle.id = "print-page-style";
  document.head.append(printStyle);
  bindEvents();
  const saved = await loadSession();
  if (saved && Array.isArray(saved.cards) && saved.cards.length) {
    studioState.cards = saved.cards.slice(0, MAX_CARDS).map(card => ({ ...blankCard(), ...card }));
    studioState.count = Math.max(1, Math.min(MAX_CARDS, saved.count || studioState.cards.length));
    while (studioState.cards.length < studioState.count) studioState.cards = [...studioState.cards, blankCard()];
    $("count").value = studioState.count;
    applySettings(saved.settings || {});
    message("Restored your saved sheet.");
  }
  currentLayout = computeLayout($("paper").value, $("csize").value);
  buildRows();
  render();
  historyReady = true;
  history.initialize(captureSnapshot());
}

init().catch(error => {
  console.error("Could not initialize Ticket Card Studio:", error);
  message("Could not restore the studio session. Reload the page to try again.");
});

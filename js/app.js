import { DEFAULT_CARDS, SET0, VISITING_SAMPLE_CARDS, blankCard, loadSession, persistSession, clearSession } from "./storage.js?v=phase10j";
import { BUILTIN_THEMES, CUSTOM, DEFAULT_CUSTOM, THEMES, buildCustom, getGroupedThemes, populateThemeSelect, renderThemeThumbSvg } from "./themes.js?v=phase10j";
import { processImageFile, processImageUrl, sampleImageColor, hslToHex, hexToHS } from "./image-utils.js?v=phase10j";
import { CW, SIZES, STAMPS, computeLayout, fitBox, getCardPhotoRect, isVisitingSize, renderCard, renderCardBack, tplSvg, cutSvg, regMarksSvg, abbr, hueOf } from "./svg-engine.js?v=phase10j";
import { exportAllSvgs, exportAllPngs, exportPdf, exportProjectJson, serializeSheetSvg, triggerDownload, rasterizeSvg } from "./export.js?v=phase10j";
import { FONTCSS, injectFonts } from "./fonts.js?v=phase10j";
import { History } from "./history.mjs?v=phase10j";
import { bindTapTooltips, hydrateIcons, iconMarkup } from "./icons.mjs?v=phase10m";
import { attachColorHexFields, syncColorHexFields } from "./color-controls.mjs?v=phase10j";
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
} from "./borders.mjs?v=phase10j";
import {
  EXTRA_STAMP_MAX,
  SKINDS,
  STAMP_OPTIONS,
  clampStampNorm,
  clampStampScale,
  compactStampStyle,
  getStampPresets,
  getStampShapeName,
  hasStampStyleOverrides,
  normalizeAngle,
  normalizeExtraStamp,
  renderStampSwatchSvg,
  resolveStampStyle,
  resolveStampTransform,
  sanitizeExtraStamps,
  sanitizeStampOverride,
  sanitizeStampStyle,
  saveStampPresetsList,
  snapStampNorm,
  uniqueStampPresetName
} from "./stamps.mjs?v=phase10j";
import {
  MAX_CARDS_LIMIT,
  blendHex,
  clearCardStylingRecord,
  hasCustomCardStyling,
  hslObjectToHex,
  normalizeHex,
  sanitizeCardStyleOverrides
} from "./card-styles.mjs?v=phase10j";
import {
  generateSeed,
  getSurprisePrefs,
  saveSurprisePrefs,
  surpriseCardsBatch
} from "./randomiser.mjs?v=phase10j";
import {
  cardSearchHaystack,
  debounce,
  filterCardIndices,
  formatSearchCount
} from "./search.mjs?v=phase10j";

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
  style: "style", titleFont: "tfont", titleScale: "title-size",
  subFont: "sfont", subScale: "sub-size",
  doors: "gdoors", side: "gside", leftMargin: "gleft", admitText: "gadmit", passText: "gpass",
  stamp: "gstamp", stampYear: "gsyear", stampSize: "ssize",
  stampColor: "scol", stampWear: "wear", borderWear: "bwear",
  gradientSpread: "gspread", gradMode: "grad-mode", paper: "paper", cardSize: "csize",
  cutterCorners: "crad", bleedMm: "bleed-mm",
  grain: "tgr", edgeWear: "tew", scuffs: "tsc", scuffRotation: "tsc-rot",
  cornerHardware: "corner-hw",
  yearBadge: "design-badge", tearStyle: "design-tear", photoFilter: "design-filter",
  nfcStyle: "nfc-platform", nfcScale: "nfc-scale",
  cardOrientation: "corient", vcBadge: "vc-badge",
  cardBackLogoColorMode: "card-back-logo-mode", cardBackLogoColor: "card-back-logo-color"
};
const CHECK_FIELDS = {
  cropMarks: "marks", bleed: "bleed", cardBack: "card-back", nfc: "nfc", cutTemplate: "tpl",
  stampAuto: "sauto", regMarks: "regmarks", punchHole: "punch",
  centerTitle: "design-center", yearBadgeWashed: "design-badge-washed",
  tearNotches: "design-notches", halftone: "design-halftone"
};
const CUSTOM_FIELDS = ["bg", "ink", "acc", "tape", "pa", "grad"];

const initialCards = DEFAULT_CARDS.map(c => ({ ...c }));
const studioState = {
  cards: initialCards,
  count: initialCards.length,
  selectedCard: 0,
  activePage: 0,
  pageThemes: [],
  gradientAngle: SET0.gradientAngle,
  gradStopOffsets: [],
  borderStyle: SET0.borderStyle,
  borderConfig: undefined,
  stampShape: SET0.stampShape,
  stampStyle: undefined,
  extraStamps: [],
  quickColors: undefined,
  settings: { customTheme: { ...CUSTOM } }
};
let lastSwatchThemeKey = "";
let lastStampSwatchKey = "";
let lastBuiltRowsPerPage = 0;
let lastBuiltLayoutKind = "";
const cardIds = new WeakMap();
let nextCardId = 0;
let currentLayout;
let renderFrame = 0;
let saveTimer;
let dragState = null;
let pinchState = null;
let stampDragState = null;
const activePpPointers = new Map();
const photoZoomWheelTimers = new Map();
let dragPhotoMode = false;
let moveStampsMode = false;
let selectedStampIndex = 0;
let activeGradientStopIndex = 0;
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
    const el = $(id);
    if (!el) continue;
    const value = el.value;
    settings[key] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  for (const [key, id] of Object.entries(CHECK_FIELDS)) {
    const el = $(id);
    if (el) settings[key] = el.checked;
  }
  settings.gradientAngle = studioState.gradientAngle;
  if (Array.isArray(studioState.gradStopOffsets) && studioState.gradStopOffsets.length >= 2) {
    settings.gradStopOffsets = studioState.gradStopOffsets.slice();
  }
  settings.borderStyle = studioState.borderStyle;
  if (studioState.borderConfig) settings.border = { ...studioState.borderConfig };
  settings.stampShape = studioState.stampShape;
  if (studioState.stampStyle) settings.stampStyle = { ...studioState.stampStyle };
  settings.extraStamps = sanitizeExtraStamps(studioState.extraStamps);
  settings.customTheme = { ...studioState.settings.customTheme };
  if (studioState.quickColors) {
    settings.quickColors = {
      ...studioState.quickColors,
      ...(Array.isArray(studioState.quickColors.gradStops) ? { gradStops: studioState.quickColors.gradStops.slice() } : {})
    };
  }
  settings.pageThemes = readPageThemes();
  settings.photoMounts = [...document.querySelectorAll("[data-quick-mount]:checked")].map(input => Number(input.value)).slice(0, 2);

  if ($("title-size-value")) $("title-size-value").textContent = `${settings.titleScale}%`;
  if ($("title-size")) $("title-size").setAttribute("aria-valuetext", `${settings.titleScale}%`);
  if ($("sub-size-val")) $("sub-size-val").textContent = `${settings.subScale ?? 100}%`;
  const bleedMm = settings.bleedMm ?? 3;
  if ($("bleed-mm-val")) $("bleed-mm-val").textContent = `${Number(bleedMm).toFixed(1)} mm`;
  if ($("bleed-mm")) $("bleed-mm").disabled = !settings.bleed;
  $("bleed-mm-wrap")?.classList.toggle("is-disabled", !settings.bleed);
  if ($("tgr-val")) $("tgr-val").textContent = `${settings.grain ?? 15}%`;
  if ($("tew-val")) $("tew-val").textContent = `${settings.edgeWear ?? 0}%`;
  if ($("tsc-val")) $("tsc-val").textContent = `${settings.scuffs ?? 0}%`;
  if ($("tsc-rot-val")) $("tsc-rot-val").textContent = `${settings.scuffRotation ?? 0}°`;

  const nfcScaleVal = settings.nfcScale ?? 100;
  if ($("nfc-scale-val")) $("nfc-scale-val").textContent = `${nfcScaleVal}%`;
  if ($("nfc-scale")) {
    $("nfc-scale").setAttribute("aria-valuetext", `${nfcScaleVal}%`);
    $("nfc-scale").disabled = !settings.nfc;
  }
  if ($("nfc-platform")) $("nfc-platform").disabled = !settings.nfc;
  $("nfc-controls-wrap")?.classList.toggle("is-disabled", !settings.nfc);
  settings.nfcStyle = settings.nfcStyle || "ytmusic";
  settings.nfcWithYt = settings.nfcStyle === "ytmusic";
  settings.cardOrientation = settings.cardOrientation === "portrait" ? "portrait" : "landscape";
  settings.vcBadge = settings.vcBadge || "qr-nfc";
  studioState.settings = settings;
  return settings;
}

function layoutFromControls() {
  return computeLayout($("paper")?.value || "a4", $("csize")?.value || "ticket", $("corient")?.value || "landscape");
}

function syncCardBackControls() {
  const wrap = $("card-back-logo-wrap");
  if (!wrap) return;
  const enabled = Boolean($("card-back")?.checked);
  const mode = $("card-back-logo-mode")?.value || "theme";
  wrap.hidden = false;
  wrap.classList.toggle("is-disabled", !enabled);
  const customWrap = $("card-back-logo-color-wrap");
  if (customWrap) customWrap.hidden = mode !== "custom";
  wrap.querySelectorAll("select, input, button").forEach(el => {
    el.disabled = !enabled;
  });
  const activeEl = document.activeElement;
  if (!activeEl?.classList?.contains("color-hex") || !wrap.contains(activeEl)) {
    syncColorHexFields(wrap);
  }
}

function syncVisitingControlsUi() {
  const visiting = isVisitingSize($("csize")?.value);
  if ($("corient-wrap")) $("corient-wrap").hidden = !visiting;
  if ($("vc-badge-wrap")) $("vc-badge-wrap").hidden = !visiting;
  syncCardBackControls();
}

function applySettings(settings = {}) {
  const allThemes = { ...THEMES, ...BUILTIN_THEMES };
  const normalizedSettings = { ...settings };
  if (!normalizedSettings.nfcStyle && normalizedSettings.nfcWithYt !== undefined) {
    normalizedSettings.nfcStyle = normalizedSettings.nfcWithYt ? "ytmusic" : "nfc";
  }
  for (const [key, id] of Object.entries(SETTINGS_FIELDS)) {
    if (normalizedSettings[key] === undefined) continue;
    const value = String(normalizedSettings[key]);
    const element = $(id);
    if (!element) continue;
    if (element.tagName !== "SELECT" || [...element.options].some(option => option.value === value)) element.value = value;
  }
  for (const [key, id] of Object.entries(CHECK_FIELDS)) {
    const el = $(id);
    if (el && typeof normalizedSettings[key] === "boolean") el.checked = normalizedSettings[key];
  }
  if (Array.isArray(normalizedSettings.photoMounts)) {
    const savedMounts = normalizedSettings.photoMounts.slice(0, 2).map(Number);
    const selectedMounts = savedMounts.includes(3) ? [3] : savedMounts;
    document.querySelectorAll("[data-quick-mount]").forEach(input => {
      input.checked = selectedMounts.includes(Number(input.value));
    });
    updateMountStatus();
  }
  if (normalizedSettings.customTheme && typeof normalizedSettings.customTheme === "object") {
    studioState.settings = {
      ...studioState.settings,
      customTheme: { ...normalizedSettings.customTheme }
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
  if (normalizedSettings.gradientAngle !== undefined && Number.isFinite(+normalizedSettings.gradientAngle)) {
    studioState.gradientAngle = ((+normalizedSettings.gradientAngle % 360) + 360) % 360;
  }
  studioState.gradStopOffsets = Array.isArray(normalizedSettings.gradStopOffsets)
    ? normalizedSettings.gradStopOffsets.map(n => Math.max(0, Math.min(100, Math.round(Number(n) || 0))))
    : [];
  if (normalizedSettings.borderStyle !== undefined) {
    const styleId = Number.parseInt(normalizedSettings.borderStyle, 10);
    studioState.borderStyle = Number.isInteger(styleId) && styleId >= 0 && styleId < BORDER_STYLES.length ? styleId : 0;
  }
  studioState.borderConfig = normalizedSettings.border && typeof normalizedSettings.border === "object"
    ? compactBorderOverrides(studioState.borderStyle, normalizedSettings.border)
    : undefined;
  if (normalizedSettings.stampShape !== undefined) {
    const shapeId = String(normalizedSettings.stampShape || "round");
    studioState.stampShape = STAMP_OPTIONS.some(o => o.id === shapeId) ? shapeId : "round";
  }
  studioState.stampStyle = normalizedSettings.stampStyle && typeof normalizedSettings.stampStyle === "object"
    ? compactStampStyle(normalizedSettings.stampStyle)
    : undefined;
  if (Array.isArray(normalizedSettings.extraStamps)) {
    studioState.extraStamps = sanitizeExtraStamps(normalizedSettings.extraStamps);
  } else if (typeof normalizedSettings.stamp2 === "string" && normalizedSettings.stamp2.trim()) {
    studioState.extraStamps = sanitizeExtraStamps([{
      id: "xs_1",
      text: normalizedSettings.stamp2.trim(),
      shape: "rect",
      fillMode: "inherit",
      autoColor: true,
      scale: 85,
      r: 0
    }]);
  } else {
    studioState.extraStamps = [];
  }
  if (Array.isArray(normalizedSettings.pageThemes)) studioState.pageThemes = normalizedSettings.pageThemes.map(theme => String(theme || ""));
  studioState.quickColors = normalizedSettings.quickColors && typeof normalizedSettings.quickColors === "object"
    ? {
      ...normalizedSettings.quickColors,
      ...(Array.isArray(normalizedSettings.quickColors.gradStops) ? { gradStops: normalizedSettings.quickColors.gradStops.slice() } : {})
    }
    : undefined;
  $("needle").style.transform = `rotate(${studioState.gradientAngle}deg)`;
  $("dial").setAttribute("aria-valuenow", studioState.gradientAngle);
  $("gav").textContent = studioState.gradientAngle + "°";
  if (normalizedSettings.style && !allThemes[normalizedSettings.style]) {
    const found = Object.keys(THEMES).find(key => THEMES[key].n.toLowerCase() === String(normalizedSettings.style).toLowerCase());
    if (found) $("style").value = found;
  }
  syncBorderControls();
  syncStampControls();
  syncQuickColorsControls({ rebuildStops: true });
  syncThemeDropdown();
  renderGlobalExtraStampsEditor();
  syncVisitingControlsUi();
  studioState.settings = readSettings();
  syncColorHexFields();
}

function renderConfig(one = false, interactive = false) {
  const settings = studioState.settings;
  return {
    lay: currentLayout,
    style: settings.style,
    one,
    interactive,
    bleed: settings.bleed,
    bleedMm: settings.bleedMm ?? 3,
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
    extraStamps: settings.extraStamps,
    titleFont: settings.titleFont,
    titleScale: settings.titleScale / 100,
    subFont: settings.subFont || "mont",
    subScale: settings.subScale ?? 100,
    gradMode: settings.gradMode || "",
    gradStopOffsets: settings.gradStopOffsets,
    gradientAngle: settings.gradientAngle,
    gradientSpread: settings.gradientSpread,
    grain: settings.grain,
    edgeWear: settings.edgeWear,
    scuffs: settings.scuffs,
    scuffRotation: settings.scuffRotation ?? 0,
    nfc: settings.nfc,
    nfcStyle: settings.nfcStyle || "ytmusic",
    nfcWithYt: settings.nfcWithYt !== false,
    nfcScale: settings.nfcScale ?? 100,
    vcBadge: settings.vcBadge || "qr-nfc",
    cardBack: Boolean(settings.cardBack),
    cardBackLogoColorMode: settings.cardBackLogoColorMode || "theme",
    cardBackLogoColor: settings.cardBackLogoColor || "#1b1a19",
    punchHole: settings.punchHole,
    borderStyle: settings.borderStyle,
    border: settings.border,
    borderScope: one ? "pv" : "",
    quickColors: settings.quickColors,
    yearBadge: settings.yearBadge,
    yearBadgeWashed: Boolean(settings.yearBadgeWashed),
    tearStyle: settings.tearStyle,
    tearNotches: Boolean(settings.tearNotches),
    photoFilter: settings.photoFilter,
    photoMounts: settings.photoMounts,
    centerTitle: settings.centerTitle,
    halftone: settings.halftone,
    cornerHardware: settings.cornerHardware || "none",
    pageThemes: settings.pageThemes,
    doors: settings.doors,
    side: settings.side,
    leftMargin: settings.leftMargin ?? "",
    admitText: settings.admitText ?? "★ ADMIT ONE",
    passText: settings.passText ?? "",
    drag: Boolean(dragPhotoMode && one && interactive),
    moveStamps: moveStampsMode && (!one || interactive),
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
  const effectiveGradEnabled = Boolean(theme.grad || qc.grad);
  if ($("ct_grad")) $("ct_grad").checked = effectiveGradEnabled;

  const legend = $("quick-colours-legend");
  if (legend) {
    legend.textContent = isCustomTheme
      ? "Color options · My theme"
      : (studioState.quickColors ? `Color options · ${theme.n} (customised)` : `Color options · ${theme.n}`);
  }
  if ($("ct_reset")) {
    const customDirty = isCustomTheme && JSON.stringify(studioState.settings.customTheme) !== JSON.stringify(DEFAULT_CUSTOM);
    $("ct_reset").disabled = !(isCustomTheme ? customDirty : Boolean(studioState.quickColors));
  }

  if ($("single-theme-select") && !theme.grad) $("single-theme-select").value = themeKey;
  if ($("grad-theme-select") && theme.grad) $("grad-theme-select").value = themeKey;

  const gradBlock = $("grad-stops-block");
  const gradRow = $("grad-stops-row");
  if (gradBlock && gradRow) {
    const showGradStops = effectiveGradEnabled;
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
      syncGradSliderBar(stops);
    } else if (gradRow.children.length) {
      gradRow.replaceChildren();
    }
  }

  const quickScope = $("ct_bg")?.closest("[data-crumb-panel], .studio-tab-panel");
  if (quickScope) syncColorHexFields(quickScope);
}

function resolveEffectiveGradOffsets(count) {
  const saved = studioState.gradStopOffsets;
  if (Array.isArray(saved) && saved.length === count) return saved.slice();
  return Array.from({ length: count }, (_, idx) => Math.round((idx / Math.max(1, count - 1)) * 100));
}

function syncGradSliderBar(stops = null) {
  const bar = $("grad-slider-bar");
  if (!bar) return;
  const themeKey = $("style")?.value || "cream";
  const theme = THEMES[themeKey] || THEMES.cream;
  const activeStops = Array.isArray(stops) && stops.length >= 2
    ? stops
    : resolveActiveThemeStops(theme, themeKey === "custom" ? CUSTOM : studioState.quickColors);
  const offsets = resolveEffectiveGradOffsets(activeStops.length);
  const cssStops = activeStops.map((hex, idx) => `${hex} ${offsets[idx]}%`).join(", ");
  bar.style.background = `linear-gradient(90deg, ${cssStops})`;
  bar.replaceChildren();
  activeStops.forEach((hex, idx) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = `grad-stop-thumb${idx === activeGradientStopIndex ? " is-active" : ""}`;
    thumb.dataset.gradThumb = String(idx);
    thumb.style.left = `${offsets[idx]}%`;
    thumb.style.backgroundColor = hex;
    thumb.setAttribute("aria-label", `Gradient stop ${idx + 1} (${offsets[idx]}%)`);
    bar.append(thumb);
  });
}

function populateFilteredThemeSelects() {
  const singleSel = $("single-theme-select");
  const gradSel = $("grad-theme-select");
  const grouped = getGroupedThemes();
  if (singleSel) {
    singleSel.innerHTML = `<option value="">Choose a single-colour theme…</option>` + grouped
      .map(([lbl, entries]) => {
        const items = entries.filter(([, t]) => !t.grad);
        return items.length ? `<optgroup label="${escapeHtml(lbl)}">${items.map(([k, v]) => `<option value="${k}">${escapeHtml(v.n)}</option>`).join("")}</optgroup>` : "";
      }).join("");
  }
  if (gradSel) {
    gradSel.innerHTML = `<option value="">Choose a gradient theme…</option>` + grouped
      .map(([lbl, entries]) => {
        const items = entries.filter(([, t]) => Boolean(t.grad));
        return items.length ? `<optgroup label="${escapeHtml(lbl)}">${items.map(([k, v]) => `<option value="${k}">${escapeHtml(v.n)}</option>`).join("")}</optgroup>` : "";
      }).join("");
  }
}

function renderExtraStampsEditor({ containerId, getList, setList, labelPrefix = "Extra stamp" }) {
  const container = $(containerId);
  if (!container) return;
  const list = getList() || [];
  container.replaceChildren();
  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No extra stamps yet. Click “+ Add stamp” to add a VIP or custom badge.";
    container.append(empty);
    return;
  }
  const shapeOptsHtml = SKINDS.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(STAMPS[k]?.name || k)}</option>`).join("");
  list.forEach((rawItem, idx) => {
    const item = normalizeExtraStamp(rawItem, idx);
    const cardEl = document.createElement("div");
    cardEl.className = "extra-stamp-card";
    cardEl.innerHTML = `
      <div class="extra-stamp-head">
        <input type="text" data-xs-field="text" placeholder="Stamp label (e.g. VIP)" value="${escapeHtml(item.text || "")}" aria-label="${labelPrefix} ${idx + 1} text">
        <button class="danger sm" type="button" data-xs-remove="${idx}" aria-label="Remove ${labelPrefix} ${idx + 1}" title="Remove stamp">${iconMarkup("close")}</button>
      </div>
      <div class="extra-stamp-grid">
        <label class="fld"><span>Shape</span><select data-xs-field="shape">${shapeOptsHtml}</select></label>
        <label class="fld"><span>Ink style</span><select data-xs-field="fillMode"><option value="inherit">Inherit main</option><option value="outline">Outline</option><option value="tinted">Tinted wash</option><option value="solid">Solid badge</option></select></label>
        <label class="fld"><span>Year (opt)</span><input type="text" data-xs-field="year" placeholder="Blank" value="${escapeHtml(item.year || "")}"></label>
        <label class="fld"><span class="lbl-row"><span>Size</span><output data-xs-out="scale">${item.scale}%</output></span><input type="range" data-xs-field="scale" min="40" max="200" step="5" value="${item.scale}"></label>
        <label class="fld"><span class="lbl-row"><span>Angle</span><output data-xs-out="r">${Math.round(item.r || 0)}°</output></span><input type="range" data-xs-field="r" min="-180" max="180" step="5" value="${Math.round(item.r || 0)}"></label>
        <label class="fld"><span>Custom hex</span><input type="color" data-xs-field="color" value="${escapeHtml(item.color || "#d9322f")}"${item.autoColor ? " disabled" : ""}></label>
        <label class="switch-row" style="grid-column:1 / -1">
          <input type="checkbox" role="switch" class="switch-input" data-xs-field="autoColor"${item.autoColor ? " checked" : ""}>
          <span class="switch-track" aria-hidden="true"></span>
          <span class="switch-text">Use card accent colour</span>
        </label>
      </div>`;
    cardEl.querySelector("[data-xs-field='shape']").value = item.shape;
    cardEl.querySelector("[data-xs-field='fillMode']").value = item.fillMode;
    hydrateIcons(cardEl);
    attachColorHexFields(cardEl);

    cardEl.querySelector("[data-xs-remove]").addEventListener("click", () => {
      const next = getList().filter((_, i) => i !== idx);
      setList(next, `remove ${labelPrefix.toLowerCase()}`, true);
    });
    cardEl.querySelectorAll("[data-xs-field]").forEach(ctrl => {
      const field = ctrl.dataset.xsField;
      const updateItem = (commit = false) => {
        const curList = getList().slice();
        const cur = normalizeExtraStamp(curList[idx] || {}, idx);
        const val = ctrl.type === "checkbox"
          ? ctrl.checked
          : (field === "scale" || field === "r" ? Number(ctrl.value) : ctrl.value);
        cur[field] = val;
        if (field === "color") cur.autoColor = false;
        curList[idx] = normalizeExtraStamp(cur, idx);
        if (field === "scale") cardEl.querySelector("[data-xs-out='scale']").textContent = `${curList[idx].scale}%`;
        if (field === "r") cardEl.querySelector("[data-xs-out='r']").textContent = `${Math.round(curList[idx].r)}°`;
        if (field === "autoColor") {
          const colorIn = cardEl.querySelector("[data-xs-field='color']");
          if (colorIn) colorIn.disabled = Boolean(curList[idx].autoColor);
        }
        setList(curList, `edit ${labelPrefix.toLowerCase()} ${field}`, commit);
      };
      ctrl.addEventListener("input", () => updateItem(false));
      ctrl.addEventListener("change", () => updateItem(true));
    });
    container.append(cardEl);
  });
}

function renderGlobalExtraStampsEditor() {
  renderExtraStampsEditor({
    containerId: "extra-stamps-list",
    getList: () => studioState.extraStamps,
    setList: (next, label, discrete) => {
      studioState.extraStamps = sanitizeExtraStamps(next);
      if (discrete) {
        renderGlobalExtraStampsEditor();
        recordDiscrete(label);
        render();
      } else {
        scheduleRender();
      }
    },
    labelPrefix: "Extra stamp"
  });
  if ($("extra-stamp-add")) $("extra-stamp-add").disabled = (studioState.extraStamps?.length || 0) >= EXTRA_STAMP_MAX;
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
    subFont: "change subtitle font",
    subScale: "change subtitle size",
    doors: "change doors text",
    side: "change right margin text",
    leftMargin: "change left margin text",
    admitText: "change top-left badge text",
    passText: "change pass badge text",
    stamp: "change stamp text",
    stampYear: "change stamp year",
    stampSize: "change stamp size",
    stampColor: "change stamp colour",
    stampWear: "change stamp wear",
    borderWear: "change border wear",
    gradientSpread: "change gradient spread",
    gradMode: "change gradient style",
    paper: "change paper size",
    cardSize: "change card size",
    cardOrientation: "change card orientation",
    vcBadge: "change visiting card badge",
    cutterCorners: "change cutter corner radius",
    grain: "change paper grain",
    edgeWear: "change vignette",
    scuffs: "change surface scuffs",
    scuffRotation: "change scuff rotation",
    yearBadge: "change year badge",
    yearBadgeWashed: "toggle washed year badge",
    tearStyle: "change tear line",
    tearNotches: "toggle tear line notches",
    photoFilter: "change photo filter",
    cropMarks: "toggle crop marks",
    bleed: "toggle bleed",
    bleedMm: "change bleed size",
    cardBack: "toggle mirrored card backs",
    cardBackLogoColorMode: "change card back border & stamp colour",
    cardBackLogoColor: "change card back custom colour",
    nfc: "toggle NFC badge",
    nfcStyle: "change NFC platform logo",
    nfcScale: "change NFC badge size",
    cutTemplate: "toggle cut template",
    stampAuto: "toggle stamp accent",
    regMarks: "toggle registration marks",
    punchHole: "toggle punch hole",
    centerTitle: "toggle centered title",
    halftone: "toggle photo halftone",
    cornerHardware: "change border hardware"
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
  const borderScope = $("border-controls-grid");
  if (borderScope && (!activeEl?.classList?.contains("color-hex") || !borderScope.contains(activeEl))) {
    syncColorHexFields(borderScope);
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

function applyMountCheckboxRule(inputs, changedInput) {
  if (changedInput.value === "3" && changedInput.checked) {
    inputs.forEach(other => {
      if (other !== changedInput) other.checked = false;
    });
  } else if (changedInput.checked) {
    const none = inputs.find(el => el.value === "3");
    if (none) none.checked = false;
  }
  const checked = inputs.filter(el => el.checked);
  if (checked.length > 2) {
    changedInput.checked = false;
    message("Choose no more than 2 photo mounts.");
    return null;
  }
  return checked.map(el => Number(el.value));
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

function cardHasExtraStamp(index) {
  const card = studioState.cards[index];
  const cardExtra = Array.isArray(card?.extraStamps) && card.extraStamps.length ? card.extraStamps : null;
  const src = cardExtra || studioState.extraStamps || [];
  return Boolean(src.some(x => String(x?.text || "").trim()) || String(card?.stamp2 || "").trim());
}

function syncCardStampRow(index) {
  const row = getCardRowEl(index);
  if (!row) return;
  const box = row.querySelector(".card-stamp-pos");
  if (!box) return;
  const hasSecond = cardHasExtraStamp(index);
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
  const tx = `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)}) scale(${Number(st.scale.toFixed(3))})`;
  const uiTx = `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)})`;
  const vText = `${Math.round(st.nx * 100)}% across, ${Math.round(st.ny * 100)}% down, ${Math.round(st.r)} degrees`;
  const patchRoot = (root, prefix = "") => {
    if (!root) return;
    const stampEl = $(`${prefix}st${si}-${index}`);
    if (stampEl) stampEl.setAttribute("transform", tx);
    const uiEl = root.querySelector(`.st-ui[data-ci="${index}"][data-si="${si}"]`);
    if (uiEl) {
      uiEl.setAttribute("transform", uiTx);
      const hit = uiEl.querySelector(".st-hit");
      if (hit) hit.setAttribute("aria-valuetext", vText);
    }
    updateSnapGuides(root.querySelector(`g[data-ci="${index}"]:not(.st-ui)`), snapInfo);
  };
  patchRoot($("sheets"), "");
  if (!$("pv")?.hidden && previewIndex === index) {
    patchRoot($("pvi"), "pv-");
    const rotDeg = Math.round(st.r || 0);
    const scalePct = Math.round((st.mult || 1) * 100);
    if ($("pv-srot") && document.activeElement !== $("pv-srot")) $("pv-srot").value = String(rotDeg);
    if ($("pv-srot-val")) $("pv-srot-val").textContent = `${rotDeg}°`;
    if ($("pv-sscale") && document.activeElement !== $("pv-sscale")) $("pv-sscale").value = String(scalePct);
    if ($("pv-sscale-val")) $("pv-sscale-val").textContent = `${scalePct}%`;
  }
  syncCardStampRow(index);
}

function getCardPhotoGeometry(index) {
  const card = studioState.cards[index];
  const CH = currentLayout?.CH || 239;
  const page = Math.floor(index / (currentLayout?.PER || 9));
  const themeKey = card?.theme || studioState.pageThemes[page] || studioState.settings?.style || "cream";
  const isVisiting = Boolean(currentLayout?.isVisiting);
  const orientation = currentLayout?.orientation || "landscape";
  const isPolaroid = !isVisiting && Boolean((THEMES[themeKey] || THEMES.cream)?.polaroid) && !studioState.settings?.minimalLayout;
  const { PX, PY, PS, PH } = getCardPhotoRect({ isPolaroid, isVisiting, orientation, CH });
  return { CH, isPolaroid, isVisiting, PX, PY, PS, PH };
}

function patchLivePhotoDom(index, px, py, box, isPolaroid = false, updateSize = false) {
  const { PX, PY, PS, PH } = getCardPhotoGeometry(index);
  const PMY = PY + PH / 2;
  const nextX = (PX + PS / 2 - box.w / 2 + px / 100 * box.mx).toFixed(2);
  const nextY = (PMY - box.h / 2 + py / 100 * box.my).toFixed(2);
  [$("photo" + index), $("pv-photo" + index)].forEach(image => {
    if (!image) return;
    image.setAttribute("x", nextX);
    image.setAttribute("y", nextY);
    if (updateSize) {
      image.setAttribute("width", box.w.toFixed(2));
      image.setAttribute("height", box.h.toFixed(2));
    }
  });
  const card = studioState.cards[index];
  const zmPct = Math.round((card?.zm || 1) * 100);
  const row = getCardRowEl(index);
  if (row) {
    if (updateSize) row.querySelector("[data-adjust='zm']").value = zmPct;
    row.querySelector("[data-adjust='px']").value = px;
    row.querySelector("[data-adjust='py']").value = py;
  }
  if (!$("pv")?.hidden && previewIndex === index) {
    const pxR = Math.round(px);
    const pyR = Math.round(py);
    if (updateSize) {
      if ($("pv-zm") && document.activeElement !== $("pv-zm")) $("pv-zm").value = String(zmPct);
      if ($("pv-zm-val")) $("pv-zm-val").textContent = `${zmPct}%`;
    }
    if ($("pv-px") && document.activeElement !== $("pv-px")) $("pv-px").value = String(pxR);
    if ($("pv-py") && document.activeElement !== $("pv-py")) $("pv-py").value = String(pyR);
    if ($("pv-px-val")) $("pv-px-val").textContent = String(pxR);
    if ($("pv-py-val")) $("pv-py-val").textContent = String(pyR);
  }
}

function copyStampPlacement(sourceIndex, targetIndices, label) {
  const src = studioState.cards[sourceIndex];
  if (!src) return;
  const st0 = resolveCardStamp(sourceIndex, 0);
  const stampPos = src.stampPos
    ? sanitizeStampOverride(src.stampPos)
    : sanitizeStampOverride({ x: st0.nx, y: st0.ny, r: st0.r, scale: 1 });
  const hasSecond = cardHasExtraStamp(sourceIndex);
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
  syncVisitingControlsUi();
  const active = THEMES[$("style").value] || THEMES.cream;
  currentLayout = layoutFromControls();
  const desiredKind = currentLayout.isVisiting ? "visiting" : "standard";
  if ((lastBuiltRowsPerPage && currentLayout.PER !== lastBuiltRowsPerPage) || (lastBuiltLayoutKind && desiredKind !== lastBuiltLayoutKind)) {
    buildRows();
  }
  const cfg = renderConfig();
  const activeCards = studioState.cards.slice(0, studioState.count);
  studioState.selectedCard = Math.max(0, Math.min(studioState.count - 1, studioState.selectedCard));
  const pages = Math.ceil(activeCards.length / currentLayout.PER);
  const width = (currentLayout.W / 2.83465).toFixed(2) + "mm";
  const height = (currentLayout.H / 2.83465).toFixed(2) + "mm";
  const svgPages = [];
  for (let page = 0; page < pages; page++) {
    const pageCards = activeCards.slice(page * currentLayout.PER, (page + 1) * currentLayout.PER);
    const pageTheme = (cfg.pageThemes?.[page] || "");
    const pageCfg = { ...cfg, style: pageTheme || cfg.style, themeForce: pageTheme || "" };
    const frontName = `ticket-cards-p${page + 1}${cfg.cardBack ? "-front" : ""}`;
    svgPages.push(
      `<svg class="sheet" data-name="${frontName}" data-page="${page}" width="${width}" height="${height}" viewBox="0 0 ${currentLayout.W} ${currentLayout.H}" xmlns="http://www.w3.org/2000/svg"><rect width="${currentLayout.W}" height="${currentLayout.H}" fill="#fff"/>${regMarksSvg(currentLayout.W, currentLayout.H, cfg.regMarks)}${pageCards.map((card, i) => renderCard(card, page * currentLayout.PER + i, pageCfg)).join("")}</svg>`
    );
    if (cfg.cardBack) {
      svgPages.push(
        `<svg class="sheet sheet-back" data-name="ticket-cards-p${page + 1}-back" data-page="${page}-back" width="${width}" height="${height}" viewBox="0 0 ${currentLayout.W} ${currentLayout.H}" xmlns="http://www.w3.org/2000/svg"><rect width="${currentLayout.W}" height="${currentLayout.H}" fill="#fff"/>${regMarksSvg(currentLayout.W, currentLayout.H, cfg.regMarks)}${pageCards.map((_, i) => renderCardBack(page * currentLayout.PER + i, pageCfg)).join("")}</svg>`
      );
    }
  }
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
      .topbar, .panel, .page-tools, .sidebar-edge-handle, #pv, h1, p.subtitle { display: none !important; }
      .app[data-mobile-view] .stage { display: block !important; }
      .mobile-view-toggle, .mobile-actionbar { display: none !important; }
      .sheet { width: ${paperWidth} !important; height: ${paperHeight} !important; }
    }`;
  }
  const totalSheetPages = pages * (cfg.cardBack ? 2 : 1) + ($("tpl").checked ? 1 : 0);
  $("pg").textContent = `${totalSheetPages} page${totalSheetPages === 1 ? "" : "s"} · ${currentLayout.PER}/page`;
  const paperName = $("paper").value === "letter" ? "US Letter" : "A4";
  const sizeNote = currentLayout.isVisiting ? ` (${currentLayout.physW}×${currentLayout.physH} mm)` : "";
  const backNote = cfg.cardBack ? " ×2 with mirrored backs" : "";
  $("sub-info").textContent = `${studioState.count} cards across ${pages} ${paperName} page${pages === 1 ? "" : "s"}${backNote} · ${currentLayout.PER}/page${sizeNote}`;
  $("card-count-lbl").textContent = studioState.count;
  $("ssv").textContent = cfg.stampSize + "%";
  $("gsv").textContent = cfg.gradientSpread + "%";
  const gradientEnabled = Boolean(active.grad || studioState.quickColors?.grad);
  $("dial").setAttribute("aria-disabled", String(!gradientEnabled));
  $("dial").tabIndex = gradientEnabled ? 0 : -1;
  $("dial").classList.toggle("disabled", !gradientEnabled);
  if ($("grad-angle-reset")) {
    $("grad-angle-reset").disabled = !gradientEnabled || studioState.gradientAngle === 180;
  }
  const activeGradMode = cfg.gradMode || active.gradType || "";
  $("gradient-hint").textContent = gradientEnabled
    ? (activeGradMode === "radial" ? "Drag dial to shift spotlight; drag stops on bar above." : "Drag dial, style or stop handles on the gradient bar.")
    : "Enable gradient or choose a gradient theme to customise stops and angle.";
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
  const resetAllCardsBtn = $("reset-all-cards");
  if (resetAllCardsBtn) {
    const customCount = activeCards.filter(hasCustomCardStyling).length;
    resetAllCardsBtn.disabled = customCount === 0;
    resetAllCardsBtn.classList.toggle("has-custom", customCount > 0);
    resetAllCardsBtn.innerHTML = `${iconMarkup("reset")} ${customCount ? `Reset cards (${customCount})` : "Reset cards"}`;
    resetAllCardsBtn.title = customCount
      ? `Reset custom & Surprise me styling on ${customCount} card${customCount === 1 ? "" : "s"}`
      : "All cards currently match sheet defaults";
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

let programmaticScrollTarget = null;
let programmaticScrollTimer = 0;
let stageScrollRaf = 0;

function parseSheetPageIndex(sheetEl) {
  const raw = sheetEl?.dataset?.page;
  if (!raw) return null;
  const page = Number.parseInt(raw, 10);
  return Number.isInteger(page) && page >= 0 ? page : null;
}

function markActiveSheetClass(activePage) {
  $("sheets")?.querySelectorAll("svg.sheet").forEach(sheet => {
    const p = parseSheetPageIndex(sheet);
    sheet.classList.toggle("is-active-page", p !== null && p === activePage);
  });
}

function detectVisibleStagePage() {
  const stage = $("stage");
  const sheetsWrap = $("sheets");
  if (!stage || !sheetsWrap) return null;
  const sheets = [...sheetsWrap.querySelectorAll("svg.sheet[data-page]")];
  if (!sheets.length) return null;

  const toolsH = $("page-tools")?.offsetHeight || 0;
  const stageScrollable = stage.scrollHeight > stage.clientHeight + 2;
  let viewTop, viewBottom, atTop, atBottom;
  if (stageScrollable) {
    const stageRect = stage.getBoundingClientRect();
    viewTop = stageRect.top + toolsH;
    viewBottom = stageRect.bottom;
    atTop = stage.scrollTop <= 4;
    atBottom = stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 4;
  } else {
    const toolsRect = $("page-tools")?.getBoundingClientRect();
    viewTop = Math.max(0, toolsRect ? toolsRect.bottom : 0);
    viewBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    atTop = (window.scrollY || 0) <= 4;
    const docH = document.documentElement.scrollHeight || 0;
    atBottom = (window.scrollY || 0) + (window.innerHeight || 0) >= docH - 4;
  }

  const pageScores = new Map();
  let highestVisiblePage = -1;
  for (const sheet of sheets) {
    const pageIdx = parseSheetPageIndex(sheet);
    if (pageIdx === null) continue;
    const rect = sheet.getBoundingClientRect();
    if (rect.height <= 0) continue;
    const overlap = Math.max(0, Math.min(rect.bottom, viewBottom) - Math.max(rect.top, viewTop));
    if (overlap > 0) {
      if (overlap > 40 && pageIdx > highestVisiblePage) highestVisiblePage = pageIdx;
      const prev = pageScores.get(pageIdx) || 0;
      if (overlap > prev) pageScores.set(pageIdx, overlap);
    }
  }
  if (!pageScores.size) return null;
  if (atTop && pageScores.has(0)) return 0;
  if (atBottom && highestVisiblePage >= 0) return highestVisiblePage;

  let bestPage = null;
  let bestScore = -1;
  for (const [pageIdx, overlap] of pageScores.entries()) {
    if (overlap > bestScore) {
      bestScore = overlap;
      bestPage = pageIdx;
    }
  }
  return bestPage;
}

function clearProgrammaticScrollGuard() {
  programmaticScrollTarget = null;
  if (programmaticScrollTimer) {
    clearTimeout(programmaticScrollTimer);
    programmaticScrollTimer = 0;
  }
}

function scheduleStagePageSync() {
  if (stageScrollRaf) return;
  stageScrollRaf = window.requestAnimationFrame(() => {
    stageScrollRaf = 0;
    const detected = detectVisibleStagePage();
    if (detected === null) return;
    if (programmaticScrollTarget !== null) {
      if (detected === programmaticScrollTarget) {
        clearProgrammaticScrollGuard();
      } else {
        return;
      }
    }
    if (detected !== studioState.activePage) {
      const per = currentLayout?.PER || layoutFromControls().PER || 9;
      const pageCount = Math.max(1, Math.ceil(studioState.count / per));
      studioState.activePage = Math.max(0, Math.min(pageCount - 1, detected));
      syncPageTools(pageCount);
      if (historyReady) history.refresh(captureSnapshot());
    }
  });
}

function scrollStageToPage(targetPage) {
  const stage = $("stage");
  const sheetEl = $("sheets")?.querySelector(`svg.sheet[data-page="${targetPage}"]`);
  if (!stage || !sheetEl) return;
  clearProgrammaticScrollGuard();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reducedMotion) {
    programmaticScrollTarget = targetPage;
    programmaticScrollTimer = window.setTimeout(clearProgrammaticScrollGuard, 700);
  }
  const behavior = reducedMotion ? "auto" : "smooth";
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
  const per = currentLayout?.PER || layoutFromControls().PER || 9;
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

let activeStudioTab = "page";
let controlSearchEntries = null;
let pvControlSearchEntries = null;
let flashControlTimer = 0;

function switchCrumb(tabKey, crumbKey) {
  const bar = document.querySelector(`[data-crumb-bar="${tabKey}"]`);
  const panel = document.querySelector(`[data-tab-panel="${tabKey}"]`);
  if (!bar || !panel || !crumbKey) return;
  const targetPanel = panel.querySelector(`[data-crumb-panel="${tabKey}:${crumbKey}"]`);
  if (!targetPanel) return;
  bar.querySelectorAll(`[data-crumb-for="${tabKey}"]`).forEach(btn => {
    const selected = btn.dataset.crumb === crumbKey;
    btn.setAttribute("aria-selected", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  panel.querySelectorAll(`[data-crumb-panel^="${tabKey}:"]`).forEach(cp => {
    cp.hidden = cp.dataset.crumbPanel !== `${tabKey}:${crumbKey}`;
  });
  const activeLbl = bar.querySelector(`[data-crumb-active-label="${tabKey}"]`);
  if (activeLbl) activeLbl.textContent = targetPanel.dataset.crumbLabel || crumbKey;
}

function switchStudioTab(tabKey) {
  const tabsWrap = $("studio-tabs");
  if (!tabsWrap) return;
  const targetBtn = tabsWrap.querySelector(`[data-tab="${tabKey}"]`);
  if (!targetBtn) return;
  activeStudioTab = tabKey;
  tabsWrap.querySelectorAll("[data-tab]").forEach(btn => {
    const selected = btn.dataset.tab === tabKey;
    btn.setAttribute("aria-selected", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll("[data-tab-panel]").forEach(panel => {
    panel.hidden = panel.dataset.tabPanel !== tabKey;
  });
}

function switchPvTab(tabKey) {
  const tabsWrap = $("pv-tabs");
  if (!tabsWrap) return;
  const targetBtn = tabsWrap.querySelector(`[data-pv-tab="${tabKey}"]`);
  if (!targetBtn) return;
  tabsWrap.querySelectorAll("[data-pv-tab]").forEach(btn => {
    const selected = btn.dataset.pvTab === tabKey;
    btn.setAttribute("aria-selected", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll("[data-pv-panel]").forEach(panel => {
    panel.hidden = panel.dataset.pvPanel !== tabKey;
  });
}

function buildControlSearchIndex() {
  if (controlSearchEntries) return controlSearchEntries;
  const entries = [];
  const seen = new Set();
  document.querySelectorAll("[data-tab-panel]").forEach(panel => {
    const tabKey = panel.dataset.tabPanel;
    const tabBtn = $("studio-tabs")?.querySelector(`[data-tab="${tabKey}"]`);
    const tabLabel = tabBtn ? tabBtn.textContent.trim() : tabKey;
    const controls = panel.querySelectorAll(
      "input[id], select[id], button[id], .dial[id], #border-picker, #stamp-picker, #grad-slider-bar, #extra-stamps-list"
    );
    controls.forEach(ctrl => {
      if (ctrl.classList.contains("color-hex")) return;
      if (ctrl.tagName === "SELECT" && ctrl.classList.contains("sr-only")) return;
      if (ctrl.classList.contains("crumb-btn")) return;
      const box = ctrl.closest("label.fld, label.switch-row, label.chk, label.swatch-control, fieldset, .gctl, .border-picker-block, .grad-slider-wrap, .cards-header") || ctrl;
      if (ctrl.id && seen.has(ctrl.id)) return;
      if (ctrl.id) seen.add(ctrl.id);
      const crumbPanel = ctrl.closest("[data-crumb-panel]");
      let crumbKey = "";
      let crumbLabel = "";
      if (crumbPanel?.dataset?.crumbPanel) {
        const parts = crumbPanel.dataset.crumbPanel.split(":");
        crumbKey = parts[1] || "";
        crumbLabel = crumbPanel.dataset.crumbLabel || crumbKey;
      }
      const labelNode =
        box.querySelector(":scope > .lbl-row > span:first-child")
        || box.querySelector(":scope > .switch-text")
        || box.querySelector(":scope > span:first-child:not(.lbl-row)")
        || box.querySelector(":scope > legend, :scope > h2");
      const rawText = (
        labelNode?.textContent
        || ctrl.getAttribute("aria-label")
        || ctrl.textContent
        || box.textContent
        || ""
      ).replace(/\s+/g, " ").trim();
      if (!rawText) return;
      const trailLabel = crumbLabel ? `${tabLabel} › ${crumbLabel}` : tabLabel;
      const kwParts = [rawText, tabLabel, crumbLabel];
      let cur = ctrl;
      while (cur && cur !== panel) {
        if (cur.dataset?.keywords) kwParts.push(cur.dataset.keywords);
        cur = cur.parentElement;
      }
      if (ctrl.placeholder) kwParts.push(ctrl.placeholder);
      entries.push({
        id: ctrl.id || "",
        el: ctrl,
        flashTarget: box.matches?.("fieldset") ? ctrl.closest("label") || box : box,
        tab: tabKey,
        crumb: crumbKey,
        tabLabel: trailLabel,
        label: rawText,
        haystack: kwParts.join(" ").toLowerCase()
      });
    });
  });
  controlSearchEntries = entries;
  return entries;
}

function jumpToControlEntry(entry) {
  if (!entry) return;
  switchStudioTab(entry.tab);
  if (entry.crumb) switchCrumb(entry.tab, entry.crumb);
  let p = entry.el.parentElement;
  while (p && !p.classList.contains("panel")) {
    if (p.tagName === "DETAILS") p.open = true;
    p = p.parentElement;
  }
  const target = entry.flashTarget || entry.el;
  document.querySelectorAll(".is-control-flash").forEach(n => n.classList.remove("is-control-flash"));
  if (flashControlTimer) clearTimeout(flashControlTimer);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("is-control-flash");
  flashControlTimer = window.setTimeout(() => target.classList.remove("is-control-flash"), 1400);
  const focusEl = entry.el.id === "border-picker" || entry.el.id === "stamp-picker"
    ? entry.el.querySelector("button")
    : entry.el;
  focusEl?.focus?.({ preventScroll: true });
}

function renderControlSearchResults(rawQuery) {
  const resultsEl = $("ctrl-search-results");
  const clearBtn = $("ctrl-search-clear");
  const query = String(rawQuery || "").trim().toLowerCase();
  if (clearBtn) clearBtn.hidden = !query.length;
  const tabsWrap = $("studio-tabs");
  if (!query) {
    if (resultsEl) {
      resultsEl.innerHTML = "";
      resultsEl.hidden = true;
    }
    tabsWrap?.querySelectorAll("[data-tab]").forEach(btn => btn.removeAttribute("data-has-match"));
    document.querySelectorAll(".crumb-btn").forEach(btn => btn.removeAttribute("data-has-match"));
    return [];
  }
  const tokens = query.split(/\s+/).filter(Boolean);
  const entries = buildControlSearchIndex();
  const matches = entries.filter(e => tokens.every(tok => e.haystack.includes(tok))).slice(0, 14);
  const matchedTabs = new Set(matches.map(m => m.tab));
  const matchedCrumbs = new Set(matches.filter(m => m.crumb).map(m => `${m.tab}:${m.crumb}`));
  tabsWrap?.querySelectorAll("[data-tab]").forEach(btn => {
    btn.dataset.hasMatch = matchedTabs.has(btn.dataset.tab) ? "true" : "false";
  });
  document.querySelectorAll(".crumb-btn").forEach(btn => {
    const key = `${btn.dataset.crumbFor}:${btn.dataset.crumb}`;
    btn.dataset.hasMatch = matchedCrumbs.has(key) ? "true" : "false";
  });
  if (resultsEl) {
    resultsEl.hidden = false;
    resultsEl.innerHTML = matches.length
      ? matches.map((m, idx) =>
          `<button type="button" class="ctrl-search-item" data-ctrl-idx="${idx}"><span>${escapeHtml(m.label)}</span><span class="ctrl-search-tab-pill">${escapeHtml(m.tabLabel)}</span></button>`
        ).join("")
      : `<p class="hint">No settings match “${escapeHtml(rawQuery.trim())}”.</p>`;
  }
  return matches;
}

function buildPvControlSearchIndex() {
  if (pvControlSearchEntries) return pvControlSearchEntries;
  const entries = [];
  const seen = new Set();
  document.querySelectorAll("[data-pv-panel]").forEach(panel => {
    const tabKey = panel.dataset.pvPanel;
    const tabBtn = $("pv-tabs")?.querySelector(`[data-pv-tab="${tabKey}"]`);
    const tabLabel = tabBtn ? tabBtn.textContent.trim() : tabKey;
    panel.querySelectorAll("input[id], select[id], button[id]").forEach(ctrl => {
      if (ctrl.classList.contains("color-hex") || !ctrl.id) return;
      if (seen.has(ctrl.id)) return;
      seen.add(ctrl.id);
      const box = ctrl.closest("label.fld, label.pv-slider-fld, label.switch-row, label.chk, fieldset, .pv-ed-group") || ctrl;
      const labelNode =
        box.querySelector(":scope > .lbl-row > span:first-child")
        || box.querySelector(":scope > .switch-text")
        || box.querySelector(":scope > span:first-child:not(.lbl-row)")
        || box.querySelector(":scope > legend > span:first-child, :scope > .pv-ed-subheader > span");
      const rawText = (
        labelNode?.textContent
        || ctrl.getAttribute("aria-label")
        || ctrl.textContent
        || ""
      ).replace(/\s+/g, " ").trim();
      if (!rawText) return;
      const kwParts = [rawText, tabLabel];
      let cur = ctrl;
      while (cur && cur !== panel) {
        if (cur.dataset?.keywords) kwParts.push(cur.dataset.keywords);
        cur = cur.parentElement;
      }
      if (ctrl.placeholder) kwParts.push(ctrl.placeholder);
      entries.push({
        id: ctrl.id,
        el: ctrl,
        flashTarget: box,
        tab: tabKey,
        tabLabel,
        label: rawText,
        haystack: kwParts.join(" ").toLowerCase()
      });
    });
  });
  pvControlSearchEntries = entries;
  return entries;
}

function jumpToPvControlEntry(entry) {
  if (!entry) return;
  switchPvTab(entry.tab);
  const target = entry.flashTarget || entry.el;
  document.querySelectorAll("#pv-editor .is-control-flash").forEach(n => n.classList.remove("is-control-flash"));
  if (flashControlTimer) clearTimeout(flashControlTimer);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("is-control-flash");
  flashControlTimer = window.setTimeout(() => target.classList.remove("is-control-flash"), 1400);
  entry.el?.focus?.({ preventScroll: true });
}

function renderPvControlSearchResults(rawQuery) {
  const resultsEl = $("pv-ctrl-search-results");
  const clearBtn = $("pv-ctrl-search-clear");
  const query = String(rawQuery || "").trim().toLowerCase();
  if (clearBtn) clearBtn.hidden = !query.length;
  const tabsWrap = $("pv-tabs");
  if (!query) {
    if (resultsEl) {
      resultsEl.innerHTML = "";
      resultsEl.hidden = true;
    }
    tabsWrap?.querySelectorAll("[data-pv-tab]").forEach(btn => btn.removeAttribute("data-has-match"));
    return [];
  }
  const tokens = query.split(/\s+/).filter(Boolean);
  const entries = buildPvControlSearchIndex();
  const matches = entries.filter(e => tokens.every(tok => e.haystack.includes(tok))).slice(0, 12);
  const matchedTabs = new Set(matches.map(m => m.tab));
  tabsWrap?.querySelectorAll("[data-pv-tab]").forEach(btn => {
    btn.dataset.hasMatch = matchedTabs.has(btn.dataset.pvTab) ? "true" : "false";
  });
  if (resultsEl) {
    resultsEl.hidden = false;
    resultsEl.innerHTML = matches.length
      ? matches.map((m, idx) =>
          `<button type="button" class="ctrl-search-item" data-pv-ctrl-idx="${idx}"><span>${escapeHtml(m.label)}</span><span class="ctrl-search-tab-pill">${escapeHtml(m.tabLabel)}</span></button>`
        ).join("")
      : `<p class="hint">No card settings match “${escapeHtml(rawQuery.trim())}”.</p>`;
  }
  return matches;
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
  const lay = currentLayout || layoutFromControls();
  const per = lay.PER || 9;
  const isVisitingMode = Boolean(lay.isVisiting);
  lastBuiltRowsPerPage = per;
  lastBuiltLayoutKind = isVisitingMode ? "visiting" : "standard";
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
      <div class="cv-wrap">
        <div class="cv" tabindex="0" role="button" aria-label="Choose photo for card ${index + 1}">${imgSrc ? "" : `${iconMarkup("upload")} Photo`}</div>
        <button class="cv-remove-btn" type="button" data-action="remove-photo"${imgSrc ? "" : " hidden"} aria-label="Remove photo from card ${index + 1}" title="Remove photo"><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></button>
      </div>
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
          ${isVisitingMode ? `
          <label class="fld w"><span>Full name</span><input type="text" data-field="title" aria-label="Card ${index + 1} full name" placeholder="Full name" value="${escapeHtml(card.title)}"></label>
          <label class="fld"><span>Job title</span><input type="text" data-field="role" aria-label="Job title" placeholder="Job title" value="${escapeHtml(card.role ?? "")}"></label>
          <label class="fld"><span>Company</span><input type="text" data-field="company" aria-label="Company" placeholder="Company" value="${escapeHtml(card.company ?? "")}"></label>
          <label class="fld"><span>Phone</span><input type="text" data-field="phone" aria-label="Phone" placeholder="Phone" value="${escapeHtml(card.phone ?? "")}"></label>
          <label class="fld"><span>Email</span><input type="text" data-field="email" aria-label="Email" placeholder="Email" value="${escapeHtml(card.email ?? "")}"></label>
          <label class="fld w"><span>Website</span><input type="text" data-field="website" aria-label="Website" placeholder="https://…" value="${escapeHtml(card.website ?? "")}"></label>
          <label class="fld w"><span>Address</span><input type="text" data-field="address" aria-label="Address" placeholder="Street, City" value="${escapeHtml(card.address ?? "")}"></label>
          <label class="fld w"><span>QR code text / link</span><input type="text" data-field="qrText" aria-label="QR value" placeholder="Auto (website / email / phone)" value="${escapeHtml(card.qrText ?? "")}"></label>
          ` : `
          <label class="fld w"><span>Artist / band name</span><input type="text" data-field="title" aria-label="Card ${index + 1} name" placeholder="Artist / band name" value="${escapeHtml(card.title)}"></label>
          <label class="fld w"><span>Genre</span><input type="text" data-field="genre" aria-label="Genre" placeholder="Genre" value="${escapeHtml(genre)}"><output class="field-value" data-field-value="genre"${genre.length > 24 ? "" : " hidden"}>${escapeHtml(genre)}</output></label>
          <label class="fld w"><span>Place</span><input type="text" data-field="loc" aria-label="Place" placeholder="Place" value="${escapeHtml(card.loc)}"></label>
          <label class="fld w"><span>Year</span><input type="text" data-field="year" aria-label="Year" placeholder="Year" value="${escapeHtml(card.year)}"></label>
          <label class="fld w"><span>Abbreviation</span><input type="text" data-field="code" aria-label="Abbreviation" placeholder="Abbreviation" value="${escapeHtml(card.code)}"></label>
          `}
          <label class="fld w"><span>Image URL</span><div class="url-row"><input type="url" data-url aria-label="Image URL" placeholder="https://…" value="${escapeHtml(imageUrl)}"><button class="g" type="button" data-action="load-url">${iconMarkup("upload")} Load</button></div><output class="field-value" data-field-value="url"${imageUrl.length > 32 ? "" : " hidden"}>${escapeHtml(imageUrl)}</output></label>
          ${card.corsLimited ? '<span class="cors-tag w" tabindex="0" role="note" aria-label="This host blocks canvas access; SVG export works, raster export may not." data-tooltip="This host blocks canvas access; SVG export works, raster export may not.">CORS-limited image</span>' : ""}
          <div class="c-row w"><input type="color" data-accent aria-label="Accent colour" value="${hslToHex(card)}"> <span>Accent sampled from image when available</span></div>
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
      const fieldNames = {
        title: "name", genre: "genre", loc: "place", year: "year", code: "abbreviation",
        role: "job title", company: "company", phone: "phone", email: "email",
        website: "website", address: "address", qrText: "QR value"
      };
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
      } else if (action === "remove-photo") {
        removeCardPhoto(index);
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

function removeCardPhoto(index) {
  const current = studioState.cards[index];
  if (!current || !(current.img || current.imgUrl)) return;
  const { iw: _iw, ih: _ih, corsLimited: _cors, ...rest } = current;
  const next = { ...rest, img: null, imgUrl: "", zm: 1, px: 0, py: 0 };
  cardIds.set(next, cardIdentity(current));
  studioState.cards = studioState.cards.map((card, cardIndex) => cardIndex === index ? next : card);
  recordDiscrete("remove card photo");
  buildRows();
  render();
  message(`Removed photo from card ${index + 1}.`);
  showUndoToast(`Removed photo from card ${index + 1}.`);
}

function moveCard(from, to) {
  const cards = studioState.cards.slice();
  [cards[from], cards[to]] = [cards[to], cards[from]];
  studioState.cards = cards;
  studioState.selectedCard = to;
  recordDiscrete("move card");
  currentLayout = layoutFromControls();
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
  currentLayout = layoutFromControls();
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
      code: String(item.abbreviation || item.abbr || item.code || abbr(item.kind === "album" ? (item.place || item.location || item.loc || title) : title)),
      h: accent?.h ?? hueOf(title),
      s: accent?.s ?? .75,
      img: photo.startsWith("data:") ? photo : null,
      imgUrl: photo.startsWith("http") ? photo : "",
      zm: Math.max(1, Math.min(3, Number(item.photoZoom) || 1)),
      px: Math.max(-100, Math.min(100, Number(item.photoX) || 0)),
      py: Math.max(-100, Math.min(100, Number(item.photoY) || 0)),
      ...styleOverrides,
      ...(item.kind === "album" || item.kind === "visiting" ? { kind: item.kind } : {}),
      ...(item.role ? { role: String(item.role) } : {}),
      ...(item.company ? { company: String(item.company) } : {}),
      ...(item.phone ? { phone: String(item.phone) } : {}),
      ...(item.email ? { email: String(item.email) } : {}),
      ...(item.website ? { website: String(item.website) } : {}),
      ...(item.address ? { address: String(item.address) } : {}),
      ...(item.qrText ? { qrText: String(item.qrText) } : {}),
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

function loadVisitingSamples() {
  if (!isVisitingSize($("csize")?.value)) $("csize").value = "vc_eu";
  if ($("corient")) $("corient").value = "landscape";
  studioState.cards = VISITING_SAMPLE_CARDS.map(card => ({ ...blankCard(), ...card }));
  studioState.count = studioState.cards.length;
  studioState.selectedCard = 0;
  $("count").value = studioState.count;
  currentLayout = layoutFromControls();
  buildRows();
  recordDiscrete("load visiting samples");
  render();
  message("Loaded 3 sample visiting cards.");
  showUndoToast("Visiting card samples loaded.");
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
  const lay = currentLayout || layoutFromControls();
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
  currentLayout = layoutFromControls();
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
  currentLayout = layoutFromControls();
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
  currentLayout = layoutFromControls();
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
  currentLayout = layoutFromControls();
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
  $("tsc").value = Math.random() > .5 ? Math.floor(Math.random() * 40) : 0;
  if ($("tsc-rot")) $("tsc-rot").value = Math.round((Math.random() * 2 - 1) * 45);
  $("gspread").value = 25 + Math.floor(Math.random() * 45);
  const randBorders = BORDER_STYLES.filter(s => s.id !== 15);
  studioState.borderStyle = randBorders[Math.floor(Math.random() * randBorders.length)].id;
  studioState.borderConfig = undefined;
  syncBorderControls();
  syncStampControls();
  setGradientAngle(Math.floor(Math.random() * 24) * 15, false);
  recordDiscrete("randomise styling");
  message("Randomised theme, border, stamp and surface details.");
  showUndoToast("Sheet styling randomised.");
}

function previewSvg(index, { interactive = false } = {}) {
  const originalIndex = studioState.selectedCard;
  studioState.selectedCard = index;
  const layout = currentLayout;
  const baseConfig = renderConfig(true, interactive);
  const page = Math.floor(index / layout.PER);
  const cardMarkup = renderCard(studioState.cards[index], index, {
    ...baseConfig,
    lay: layout,
    one: true,
    interactive,
    drag: interactive ? baseConfig.drag : false,
    moveStamps: interactive ? moveStampsMode : false,
    cropMarks: false,
    style: studioState.pageThemes[page] || baseConfig.style,
    themeForce: studioState.pageThemes[page] || ""
  });
  studioState.selectedCard = originalIndex;
  const height = layout.CH;
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

function populateSubtitleFontSelect() {
  const sfontSel = $("sfont");
  const tfontSel = $("tfont");
  if (!sfontSel || !tfontSel || sfontSel.options.length) return;
  const opts = [...tfontSel.options]
    .filter(opt => opt.value !== "theme")
    .map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.textContent)}</option>`)
    .join("");
  sfontSel.innerHTML = opts;
  sfontSel.value = "mont";
}

function renderPvExtraStampsEditor() {
  if (previewIndex < 0) return;
  const card = studioState.cards[previewIndex];
  const cfg = renderConfig();
  const baseList = Array.isArray(card?.extraStamps) && card.extraStamps.length
    ? card.extraStamps
    : (Array.isArray(cfg.extraStamps) ? cfg.extraStamps : []);
  renderExtraStampsEditor({
    containerId: "pv-extra-stamps-list",
    getList: () => baseList,
    setList: (next, label, discrete) => {
      if (previewIndex < 0) return;
      const clean = sanitizeExtraStamps(next);
      if (clean.length) {
        updateCard(previewIndex, { extraStamps: clean });
      } else {
        const cur = studioState.cards[previewIndex];
        if (cur) {
          const { extraStamps: _rm, ...rest } = cur;
          const updated = { ...rest };
          cardIds.set(updated, cardIdentity(cur));
          studioState.cards = studioState.cards.map((c, idx) => idx === previewIndex ? updated : c);
        }
      }
      syncSidebarRowValues(previewIndex);
      if (discrete) {
        renderPvExtraStampsEditor();
        recordDiscrete(label);
        buildRows();
        render();
      } else {
        scheduleRender();
      }
    },
    labelPrefix: "Card extra stamp"
  });
  if ($("pv-extra-stamp-add")) {
    $("pv-extra-stamp-add").disabled = baseList.length >= EXTRA_STAMP_MAX;
  }
}

function syncPreviewSelects(force = false) {
  const themeSel = $("pv-theme");
  const stampSel = $("pv-stamp");
  const borderSel = $("pv-border-style");
  const fontSel = $("pv-title-font");
  const subFontSel = $("pv-sub-font");
  if (themeSel && (force || !themeSel.options.length)) {
    populateThemeSelect(themeSel, true);
  }
  if (stampSel && (force || !stampSel.options.length)) {
    stampSel.innerHTML = [["", "Same as sheet"], ["none", "No stamp"], ...Object.keys(STAMPS).map(key => [key, STAMPS[key].name || (key[0].toUpperCase() + key.slice(1))]), ["mixed", "Mixed"]]
      .map(([value, name]) => `<option value="${value}">${escapeHtml(name)}</option>`).join("");
  }
  if (borderSel && (force || !borderSel.options.length)) {
    borderSel.innerHTML = [["", "Same as sheet"], ...BORDER_STYLES.map(s => [String(s.id), s.name])]
      .map(([value, name]) => `<option value="${value}">${escapeHtml(name)}</option>`).join("");
  }
  if (fontSel && (force || !fontSel.options.length)) {
    const tfontOpts = [...($("tfont")?.options || [])].map(opt => [opt.value, opt.textContent]);
    fontSel.innerHTML = [["", "Same as sheet"], ...tfontOpts]
      .map(([value, name]) => `<option value="${escapeHtml(value)}">${escapeHtml(name)}</option>`).join("");
  }
  if (subFontSel && (force || !subFontSel.options.length)) {
    const sfontOpts = [...($("sfont")?.options || [])].map(opt => [opt.value, opt.textContent]);
    subFontSel.innerHTML = [["", "Same as sheet"], ...sfontOpts]
      .map(([value, name]) => `<option value="${escapeHtml(value)}">${escapeHtml(name)}</option>`).join("");
  }
}

function syncPreviewControls() {
  if (previewIndex < 0 || $("pv").hidden) return;
  const card = studioState.cards[previewIndex];
  if (!card) return;
  syncPreviewSelects();
  const active = document.activeElement;
  const setVal = (id, val) => {
    const el = $(id);
    if (!el || active === el) return;
    if (el.type === "checkbox") el.checked = Boolean(val);
    else el.value = String(val);
  };
  const triState = val => val === undefined ? "" : (val ? "1" : "0");
  const cfg = renderConfig();
  const isVisitingMode = isVisitingSize($("csize")?.value);
  if ($("pv-title-label")) $("pv-title-label").textContent = isVisitingMode ? "Full name" : "Artist / band name";
  document.querySelectorAll(".pv-band-fld").forEach(el => { el.hidden = isVisitingMode; });
  document.querySelectorAll(".pv-vc-fld").forEach(el => { el.hidden = !isVisitingMode; });
  setVal("pv-title", card.title || "");
  setVal("pv-genre", card.genre || "");
  setVal("pv-loc", card.loc || "");
  setVal("pv-year", card.year || "");
  setVal("pv-code", card.code || "");
  setVal("pv-role", card.role ?? "");
  setVal("pv-company", card.company ?? "");
  setVal("pv-phone", card.phone ?? "");
  setVal("pv-email", card.email ?? "");
  setVal("pv-website", card.website ?? "");
  setVal("pv-address", card.address ?? "");
  setVal("pv-qrtext", card.qrText ?? "");
  setVal("pv-left-margin", card.leftMargin ?? "");
  setVal("pv-doors", card.doors ?? "");
  setVal("pv-side", card.side ?? "");
  setVal("pv-admit", card.admitText ?? "");
  setVal("pv-pass", card.passText ?? "");
  setVal("pv-vc-badge", card.vcBadge || "");
  setVal("pv-nfc", triState(card.nfc));
  setVal("pv-nfc-platform", card.nfcStyle || "");
  setVal("pv-punch", triState(card.punchHole));
  const effNfcScale = card.nfcScale ?? cfg.nfcScale ?? 100;
  setVal("pv-nfc-scale", effNfcScale);
  if ($("pv-nfc-scale-val")) $("pv-nfc-scale-val").textContent = `${effNfcScale}%`;
  const hasTicketOverride = ["leftMargin", "doors", "side", "admitText", "passText", "vcBadge", "nfc", "nfcStyle", "nfcScale", "punchHole"]
    .some(k => card[k] !== undefined && card[k] !== "");
  if ($("pv-ticket-reset")) $("pv-ticket-reset").hidden = !hasTicketOverride;

  const zmVal = Math.round((card.zm || 1) * 100);
  const pxVal = card.px || 0;
  const pyVal = card.py || 0;
  setVal("pv-zm", zmVal);
  setVal("pv-px", pxVal);
  setVal("pv-py", pyVal);
  if ($("pv-zm-val")) $("pv-zm-val").textContent = `${zmVal}%`;
  if ($("pv-px-val")) $("pv-px-val").textContent = String(pxVal);
  if ($("pv-py-val")) $("pv-py-val").textContent = String(pyVal);
  setVal("pv-accent", hslToHex(card));
  setVal("pv-theme", card.theme || "");
  setVal("pv-hardware", card.cornerHardware || "");

  // Typography & photo look
  setVal("pv-title-font", card.titleFont || "");
  const effTitleScale = Math.round((card.titleScale ?? (cfg.titleScale || 85) / 100) * 100);
  setVal("pv-title-scale", effTitleScale);
  if ($("pv-title-scale-val")) $("pv-title-scale-val").textContent = `${effTitleScale}%`;
  setVal("pv-sub-font", card.subFont || "");
  const effSubScale = Math.round((card.subScale ?? cfg.subScale ?? 100) > 3
    ? (card.subScale ?? cfg.subScale ?? 100)
    : (card.subScale ?? 1) * 100);
  setVal("pv-sub-scale", effSubScale);
  if ($("pv-sub-scale-val")) $("pv-sub-scale-val").textContent = `${effSubScale}%`;
  setVal("pv-center-title", triState(card.centerTitle));
  setVal("pv-photo-filter", card.photoFilter !== undefined ? String(card.photoFilter) : "");
  setVal("pv-halftone", triState(card.halftone));
  setVal("pv-year-badge", card.yearBadge !== undefined ? String(card.yearBadge) : "");
  setVal("pv-badge-washed", triState(card.yearBadgeWashed));
  setVal("pv-tear-style", card.tearStyle !== undefined ? String(card.tearStyle) : "");
  setVal("pv-tear-notches", triState(card.tearNotches));
  const hasLookOverride = ["titleFont", "titleScale", "subFont", "subScale", "centerTitle", "photoFilter", "halftone", "yearBadge", "yearBadgeWashed", "tearStyle", "tearNotches"]
    .some(k => card[k] !== undefined && card[k] !== "");
  if ($("pv-look-reset")) $("pv-look-reset").hidden = !hasLookOverride;

  // Page config & palette / gradient / wear
  const page = Math.floor(previewIndex / (currentLayout?.PER || 9));
  const pageCfg = { ...cfg, style: studioState.pageThemes[page] || cfg.style };
  const effTheme = THEMES[card.theme] || THEMES[pageCfg.style] || THEMES.cream || {};
  const effBg = normalizeHex(card.palette?.bg || effTheme.bg, "#f2eadb");
  const effInk = normalizeHex(card.palette?.ink || effTheme.ink, "#1b1a19");
  const effTape = normalizeHex(card.tape || effTheme.tape, "#d8b46b");
  setVal("pv-pal-bg", effBg);
  setVal("pv-pal-ink", effInk);
  setVal("pv-pal-tape", effTape);
  setVal("pv-grad-mode", card.gradMode || "");
  const effAngle = card.gradientAngle ?? cfg.gradientAngle ?? 180;
  const effSpread = card.gradientSpread ?? cfg.gradientSpread ?? 32;
  setVal("pv-grad-angle", effAngle);
  setVal("pv-grad-spread", effSpread);
  if ($("pv-grad-angle-val")) $("pv-grad-angle-val").textContent = `${effAngle}°`;
  if ($("pv-grad-spread-val")) $("pv-grad-spread-val").textContent = `${effSpread}%`;
  const hasPalOverride = Boolean(card.palette || card.tape || card.gradMode || card.gradientAngle !== undefined || card.gradientSpread !== undefined);
  if ($("pv-pal-reset")) $("pv-pal-reset").hidden = !hasPalOverride;

  const effGrain = card.grain ?? cfg.grain ?? 15;
  const effEw = card.edgeWear ?? cfg.edgeWear ?? 0;
  const effSc = card.scuffs ?? cfg.scuffs ?? 0;
  const effScRot = card.scuffRotation ?? cfg.scuffRotation ?? 0;
  setVal("pv-grain", effGrain);
  setVal("pv-edge-wear", effEw);
  setVal("pv-scuffs", effSc);
  setVal("pv-scuff-rot", effScRot);
  if ($("pv-grain-val")) $("pv-grain-val").textContent = `${effGrain}%`;
  if ($("pv-edge-wear-val")) $("pv-edge-wear-val").textContent = `${effEw}%`;
  if ($("pv-scuffs-val")) $("pv-scuffs-val").textContent = `${effSc}%`;
  if ($("pv-scuff-rot-val")) $("pv-scuff-rot-val").textContent = `${effScRot}°`;
  if ($("pv-wear-reset")) {
    $("pv-wear-reset").hidden = !["grain", "edgeWear", "scuffs", "scuffRotation"].some(k => card[k] !== undefined);
  }

  // Sync per-card border controls
  const resolvedBorder = resolveBorderConfig(pageCfg, card);
  const bMeta = getBorderStyleMeta(resolvedBorder.style);
  const bSup = bMeta.supports;
  const hasCardBorder = Boolean(card.border && typeof card.border === "object");
  setVal("pv-border-style", hasCardBorder ? String(resolvedBorder.style) : "");
  setVal("pv-border-color-mode", resolvedBorder.colorMode);
  setVal("pv-border-color", resolvedBorder.color);
  setVal("pv-border-pattern", resolvedBorder.pattern);
  setVal("pv-border-corner", resolvedBorder.corner);
  setVal("pv-border-ornament", resolvedBorder.ornament);
  setVal("pv-border-width", resolvedBorder.width);
  setVal("pv-border-inset", resolvedBorder.inset);
  setVal("pv-border-opacity", resolvedBorder.opacity);
  setVal("pv-border-glow", resolvedBorder.glow);
  setVal("pv-border-corner-size", resolvedBorder.cornerSize);
  setVal("pv-border-wear", resolvedBorder.wear);
  setVal("pv-border-inner", resolvedBorder.inner);
  if ($("pv-border-width-val")) $("pv-border-width-val").textContent = Number(resolvedBorder.width).toFixed(1);
  if ($("pv-border-inset-val")) $("pv-border-inset-val").textContent = Number(resolvedBorder.inset).toFixed(1);
  if ($("pv-border-opacity-val")) $("pv-border-opacity-val").textContent = `${Math.round(resolvedBorder.opacity)}%`;
  if ($("pv-border-glow-val")) $("pv-border-glow-val").textContent = `${Math.round(resolvedBorder.glow)}%`;
  if ($("pv-border-corner-size-val")) $("pv-border-corner-size-val").textContent = String(resolvedBorder.cornerSize);
  if ($("pv-border-wear-val")) $("pv-border-wear-val").textContent = `${Math.round(resolvedBorder.wear)}%`;
  if ($("pv-border-reset")) $("pv-border-reset").hidden = !hasCardBorder;
  if ($("pv-border-none-note")) $("pv-border-none-note").hidden = bMeta.id !== 15;
  const showPvGroup = (group, visible) => {
    document.querySelectorAll(`[data-pv-border-group="${group}"]`).forEach(el => { el.hidden = !visible; });
  };
  const isNoneBorder = bMeta.id === 15;
  showPvGroup("width", !isNoneBorder && bSup.width);
  showPvGroup("inset", !isNoneBorder && bSup.inset);
  showPvGroup("opacity", !isNoneBorder && bSup.opacity);
  showPvGroup("glow", !isNoneBorder && bSup.glow);
  showPvGroup("color", !isNoneBorder && bSup.color);
  showPvGroup("customColor", !isNoneBorder && bSup.color && resolvedBorder.colorMode === "custom");
  showPvGroup("pattern", !isNoneBorder && bSup.pattern);
  showPvGroup("corner", !isNoneBorder && bSup.corner);
  showPvGroup("cornerSize", !isNoneBorder && bSup.corner && resolvedBorder.corner !== "square");
  showPvGroup("ornament", !isNoneBorder && bSup.ornament);
  showPvGroup("wear", !isNoneBorder && bSup.wear);
  showPvGroup("inner", !isNoneBorder && bSup.inner);

  // Sync per-card photo mounts
  const effMounts = Array.isArray(card.photoMounts) && card.photoMounts.length ? card.photoMounts : cfg.photoMounts;
  document.querySelectorAll("[data-pv-mount]").forEach(el => {
    el.checked = effMounts.includes(Number(el.value));
  });
  if ($("pv-mounts-reset")) $("pv-mounts-reset").hidden = !(Array.isArray(card.photoMounts) && card.photoMounts.length);

  // Sync per-card stamp styling & extra stamps
  setVal("pv-stamp", card.sk || "");
  setVal("pv-stx", card.stx || "");
  setVal("pv-stamp-year", card.stampYear ?? "");
  setVal("pv-stamp-auto", triState(card.stampAuto));
  setVal("pv-stamp-color", normalizeHex(card.stampColor || cfg.stampColor, "#d9322f"));
  setVal("pv-stamp-fill", card.stampStyle?.fillMode || "");
  setVal("pv-stamp-pattern", card.stampStyle?.pattern || "");
  setVal("pv-stamp-inner-ring", triState(card.stampStyle?.innerRing));
  setVal("pv-stamp-show-year", triState(card.stampStyle?.showYear));
  const effStampWear = card.stampWear ?? cfg.stampWear ?? 35;
  setVal("pv-stamp-wear", effStampWear);
  if ($("pv-stamp-wear-val")) $("pv-stamp-wear-val").textContent = `${effStampWear}%`;
  const hasStampOverride = ["sk", "stx", "stampYear", "extraStamps", "stampAuto", "stampColor", "stampStyle", "stampWear"]
    .some(k => card[k] !== undefined && card[k] !== "" && (!Array.isArray(card[k]) || card[k].length));
  if ($("pv-stamp-style-reset")) $("pv-stamp-style-reset").hidden = !hasStampOverride;

  if (!active?.closest?.("#pv-extra-stamps-list")) {
    renderPvExtraStampsEditor();
  }

  if (!active?.classList?.contains("color-hex") || !$("pv-editor")?.contains(active)) {
    syncColorHexFields($("pv-editor"));
  }

  const st = resolveCardStamp(previewIndex, 0);
  const rotDeg = Math.round(st.r || 0);
  const scalePct = Math.round((st.mult || 1) * 100);
  setVal("pv-srot", rotDeg);
  setVal("pv-sscale", scalePct);
  if ($("pv-srot-val")) $("pv-srot-val").textContent = `${rotDeg}°`;
  if ($("pv-sscale-val")) $("pv-sscale-val").textContent = `${scalePct}%`;
  const lockBtn = $("pv-lock");
  if (lockBtn) {
    const isLocked = Boolean(card.locked);
    lockBtn.setAttribute("aria-pressed", String(isLocked));
    lockBtn.classList.toggle("is-locked", isLocked);
  }
  const removePhotoBtn = $("pv-photo-remove");
  if (removePhotoBtn) removePhotoBtn.disabled = !(card.img || card.imgUrl);
  const pvDragBtn = $("pv-drag-photo");
  if (pvDragBtn) pvDragBtn.setAttribute("aria-pressed", String(Boolean(dragPhotoMode)));
  const pvMoveBtn = $("pv-move-stamps");
  if (pvMoveBtn) pvMoveBtn.setAttribute("aria-pressed", String(moveStampsMode));
  const resetStyleBtn = $("pv-reset-style");
  if (resetStyleBtn) resetStyleBtn.hidden = !hasCustomCardStyling(card);
}

function syncSidebarRowValues(index) {
  const row = getCardRowEl(index);
  const card = studioState.cards[index];
  if (!row || !card) return;
  const setRowEl = (sel, val) => {
    const el = row.querySelector(sel);
    if (el) el.value = val;
  };
  setRowEl("[data-field='title']", card.title || "");
  setRowEl("[data-field='genre']", card.genre || "");
  setRowEl("[data-field='loc']", card.loc || "");
  setRowEl("[data-field='year']", card.year || "");
  setRowEl("[data-field='code']", card.code || "");
  setRowEl("[data-field='role']", card.role ?? "");
  setRowEl("[data-field='company']", card.company ?? "");
  setRowEl("[data-field='phone']", card.phone ?? "");
  setRowEl("[data-field='email']", card.email ?? "");
  setRowEl("[data-field='website']", card.website ?? "");
  setRowEl("[data-field='address']", card.address ?? "");
  setRowEl("[data-field='qrText']", card.qrText ?? "");
  const nameBtn = row.querySelector(".card-name");
  if (nameBtn) nameBtn.textContent = `Card ${index + 1} · ${card.title || "Untitled card"}`;
  setRowEl("[data-adjust='zm']", Math.round((card.zm || 1) * 100));
  setRowEl("[data-adjust='px']", card.px || 0);
  setRowEl("[data-adjust='py']", card.py || 0);
  setRowEl("[data-accent]", hslToHex(card));
  setRowEl("[data-option='stx']", card.stx || "");
  syncCardStampRow(index);
  if (cardSearchQuery.trim()) applyCardSearchFilter();
}

function refreshPreview() {
  if (previewIndex < 0 || $("pv").hidden) return;
  $("pvi").innerHTML = scopePreviewSvgIds(previewSvg(previewIndex, { interactive: true }));
  $("pvt").textContent = `Card ${previewIndex + 1} of ${studioState.count}`;
  syncPreviewControls();
}

function openPreview(index) {
  previewIndex = (index + studioState.count) % studioState.count;
  selectCard(previewIndex);
  if ($("pv").hidden) previousFocus = document.activeElement;
  $("pv").hidden = false;
  syncPreviewSelects(true);
  refreshPreview();
  $("pvx").focus();
}

function closePreview() {
  $("pv").hidden = true;
  dragPhotoMode = false;
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
    markActiveSheetClass(studioState.activePage);
    if (historyReady) history.refresh(captureSnapshot());
    scrollStageToPage(studioState.activePage);
  });
  $("stage")?.addEventListener("scroll", scheduleStagePageSync, { passive: true });
  window.addEventListener("scroll", scheduleStagePageSync, { passive: true });
  ["wheel", "touchstart", "pointerdown"].forEach(evtName => {
    $("stage")?.addEventListener(evtName, clearProgrammaticScrollGuard, { passive: true });
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
  ["marks", "bleed", "card-back", "nfc", "punch", "tpl", "regmarks", "sauto", "corner-hw", "design-badge", "design-badge-washed", "design-tear", "design-notches", "design-filter", "design-center", "design-halftone", "nfc-platform", "grad-mode", "sfont"].forEach(id => $(id)?.addEventListener("change", scheduleRender));
  $("card-back")?.addEventListener("change", syncCardBackControls);
  ["csize", "corient", "vc-badge", "card-back-logo-mode"].forEach(id => $(id)?.addEventListener("change", () => {
    syncCardBackControls();
    scheduleRender();
  }));
  $("single-theme-select")?.addEventListener("change", event => {
    if (event.target.value) selectThemeKey(event.target.value);
  });
  $("grad-theme-select")?.addEventListener("change", event => {
    if (event.target.value) selectThemeKey(event.target.value);
  });
  $("grad-slider-bar")?.addEventListener("pointerdown", event => {
    const bar = $("grad-slider-bar");
    const themeKey = $("style")?.value || "cream";
    const theme = THEMES[themeKey] || THEMES.cream;
    const stops = resolveActiveThemeStops(theme, themeKey === "custom" ? CUSTOM : studioState.quickColors);
    if (!stops.length) return;
    const offsets = resolveEffectiveGradOffsets(stops.length);
    const thumb = event.target.closest?.("[data-grad-thumb]");
    const rect = bar.getBoundingClientRect();
    let idx = thumb ? Number(thumb.dataset.gradThumb) : 0;
    if (!thumb) {
      const clickPct = Math.max(0, Math.min(100, Math.round(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100)));
      let bestDist = Infinity;
      offsets.forEach((p, i) => {
        const d = Math.abs(p - clickPct);
        if (d < bestDist) { bestDist = d; idx = i; }
      });
    }
    activeGradientStopIndex = idx;
    studioState.gradStopOffsets = offsets;
    syncGradSliderBar(stops);
    const updatePos = clientX => {
      const pct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / Math.max(1, rect.width)) * 100)));
      studioState.gradStopOffsets[idx] = pct;
      syncGradSliderBar(stops);
      scheduleRender();
      recordContinuous("adjust gradient stop position", "setting:grad-offset");
    };
    bar.setPointerCapture?.(event.pointerId);
    updatePos(event.clientX);
    const onMove = ev => updatePos(ev.clientX);
    const onUp = () => {
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
      finishContinuous("adjust gradient stop position", "setting:grad-offset");
    };
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
  });
  $("style").addEventListener("change", () => {
    studioState.quickColors = undefined;
    studioState.gradStopOffsets = [];
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
  const syncDragPhotoMode = checked => {
    dragPhotoMode = Boolean(checked);
    if (dragPhotoMode && moveStampsMode) {
      moveStampsMode = false;
      message("Drag photo on (turned off Move stamps).");
    } else {
      message(dragPhotoMode ? "Drag photo on: drag or scroll/pinch photo inside this card preview." : "Drag photo off.");
    }
    render();
  };
  const toggleMoveStampsMode = () => {
    moveStampsMode = !moveStampsMode;
    if (moveStampsMode && dragPhotoMode) {
      dragPhotoMode = false;
      message("Move stamps on (turned off photo drag).");
    } else {
      message(moveStampsMode ? "Move stamps on: drag or use arrow keys on a stamp." : "Move stamps off.");
    }
    render();
  };
  $("move-stamps")?.addEventListener("click", toggleMoveStampsMode);
  $("pv-drag-photo")?.addEventListener("click", () => syncDragPhotoMode(!dragPhotoMode));
  $("pv-move-stamps")?.addEventListener("click", toggleMoveStampsMode);
  $("sidebar-toggle")?.addEventListener("click", () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      const nextView = $("app")?.dataset.mobileView === "preview" ? "edit" : "preview";
      setMobileView(nextView);
      return;
    }
    const nextCollapsed = !$("app")?.classList.contains("is-sidebar-collapsed");
    setSidebarCollapsed(nextCollapsed);
  });
  $("sidebar-collapse")?.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 640px)").matches) {
      setMobileView("preview");
      return;
    }
    setSidebarCollapsed(true);
  });
  $("sidebar-edge-open")?.addEventListener("click", () => {
    setSidebarCollapsed(false);
    $("ctrl-search")?.focus({ preventScroll: true });
  });
  $("pv-expand")?.addEventListener("click", () => {
    const pv = $("pv");
    if (!pv) return;
    const expanded = pv.classList.toggle("is-expanded");
    const btn = $("pv-expand");
    if (btn) {
      btn.setAttribute("aria-expanded", String(expanded));
      btn.textContent = expanded ? "Compact" : "Expand";
    }
  });
  $("extra-stamp-add")?.addEventListener("click", () => {
    if ((studioState.extraStamps?.length || 0) >= EXTRA_STAMP_MAX) return;
    const idx = studioState.extraStamps.length + 1;
    studioState.extraStamps = [
      ...studioState.extraStamps,
      normalizeExtraStamp({ id: `xs_${Date.now().toString(36)}`, text: idx === 1 ? "VIP" : `STAMP ${idx}`, shape: "rect", fillMode: "inherit", autoColor: true, scale: 85, r: 0 }, idx - 1)
    ];
    renderGlobalExtraStampsEditor();
    recordDiscrete("add extra stamp");
    render();
  });
  $("pv-extra-stamp-add")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    const card = studioState.cards[previewIndex];
    const base = Array.isArray(card?.extraStamps) && card.extraStamps.length
      ? card.extraStamps.slice()
      : (studioState.extraStamps || []).slice();
    if (base.length >= EXTRA_STAMP_MAX) return;
    const nextList = sanitizeExtraStamps([
      ...base,
      normalizeExtraStamp({ id: `cxs_${Date.now().toString(36)}`, text: base.length === 0 ? "VIP" : `STAMP ${base.length + 1}`, shape: "rect", fillMode: "inherit", autoColor: true, scale: 85, r: 0 }, base.length)
    ]);
    updateCard(previewIndex, { extraStamps: nextList });
    renderPvExtraStampsEditor();
    recordDiscrete("add card extra stamp");
    buildRows();
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
  ["ssize", "gspread", "tgr", "tew", "tsc", "tsc-rot", "bleed-mm", "sub-size", "nfc-scale"].forEach(id => $(id)?.addEventListener("input", scheduleRender));
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
  ["gdoors", "gside", "gleft", "gadmit", "gpass", "gstamp", "gsyear"].forEach(id => $(id)?.addEventListener("input", scheduleRender));
  $("ct_grad")?.addEventListener("change", event => {
    const checked = Boolean(event.target.checked);
    if ($("style").value === "custom") {
      studioState.settings = {
        ...studioState.settings,
        customTheme: { ...studioState.settings.customTheme, grad: checked }
      };
      Object.assign(CUSTOM, studioState.settings.customTheme);
      buildCustom();
    } else {
      studioState.quickColors = { ...(studioState.quickColors || {}), grad: checked };
    }
    syncQuickColorsControls({ rebuildStops: true });
    recordDiscrete("toggle gradient background");
    render();
  });
  const quickMountInputs = [...document.querySelectorAll("[data-quick-mount]")];
  quickMountInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (!applyMountCheckboxRule(quickMountInputs, input)) return;
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
  $("mobile-export").addEventListener("click", () => $("pdf").click());
  $("svg").addEventListener("click", () => exportAllSvgs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("png").addEventListener("click", () => exportAllPngs([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  $("pdf").addEventListener("click", () => exportPdf([...document.querySelectorAll("#sheets .sheet")], currentLayout.W, currentLayout.H, message));
  const populateSvgCodeDialog = () => {
    const list = $("svg-code-list");
    const summary = $("svg-code-summary");
    if (!list) return;
    const sheets = [...document.querySelectorAll("#sheets .sheet")];
    const embedFonts = Boolean($("svg-code-fonts")?.checked);
    if (summary) summary.textContent = `${sheets.length} page${sheets.length === 1 ? "" : "s"}`;
    list.replaceChildren();
    sheets.forEach((sheetEl, idx) => {
      const code = serializeSheetSvg(sheetEl, currentLayout.W, currentLayout.H, { embedFonts });
      const rawName = sheetEl.dataset.name || `ticket-cards-p${idx + 1}`;
      const label = rawName === "cut-template"
        ? "Cut Template"
        : `Page ${idx + 1} (${rawName})`;
      const sizeKb = (code.length / 1024).toFixed(1);
      const card = document.createElement("section");
      card.className = "svg-code-card";
      card.innerHTML = `
        <div class="svg-code-head">
          <strong>${escapeHtml(label)}</strong>
          <span class="hint">${sizeKb} KB</span>
          <button class="g sm" type="button" data-copy-svg="${idx}">${iconMarkup("duplicate")} Copy SVG</button>
        </div>
        <textarea class="svg-code-textarea" readonly rows="6" aria-label="${escapeHtml(label)} SVG code"></textarea>`;
      const textarea = card.querySelector("textarea");
      textarea.value = code;
      const copyBtn = card.querySelector("[data-copy-svg]");
      copyBtn.addEventListener("click", async () => {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
          else {
            textarea.focus();
            textarea.select();
            document.execCommand?.("copy");
          }
          copyBtn.innerHTML = `${iconMarkup("duplicate")} Copied!`;
          message(`Copied ${label} SVG code (${sizeKb} KB).`);
          setTimeout(() => { copyBtn.innerHTML = `${iconMarkup("duplicate")} Copy SVG`; }, 1600);
        } catch {
          textarea.focus();
          textarea.select();
          message("Selected SVG text — press Ctrl+C to copy.");
        }
      });
      list.append(card);
    });
  };
  $("svg-code-open")?.addEventListener("click", () => {
    populateSvgCodeDialog();
    $("svg-code-dialog")?.showModal();
  });
  $("svg-code-fonts")?.addEventListener("change", populateSvgCodeDialog);
  $("svg-code-dialog")?.addEventListener("click", event => {
    if (event.target === $("svg-code-dialog")) $("svg-code-dialog").close();
  });
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
  $("reset-all-cards")?.addEventListener("click", clearAllRandomStyling);
  $("studio-tabs")?.addEventListener("click", event => {
    const btn = event.target.closest?.("[data-tab]");
    if (btn) switchStudioTab(btn.dataset.tab);
  });
  $("studio-tabs")?.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const tabs = [...$("studio-tabs").querySelectorAll("[data-tab]")];
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    event.preventDefault();
    const next = tabs[(idx + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    switchStudioTab(next.dataset.tab);
    next.focus();
  });
  let currentCtrlMatches = [];
  const updateControlSearch = () => {
    currentCtrlMatches = renderControlSearchResults($("ctrl-search")?.value || "");
  };
  $("ctrl-search")?.addEventListener("input", updateControlSearch);
  $("ctrl-search")?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if ($("ctrl-search").value) {
        event.preventDefault();
        $("ctrl-search").value = "";
        updateControlSearch();
      }
    } else if (event.key === "Enter" && currentCtrlMatches.length) {
      event.preventDefault();
      jumpToControlEntry(currentCtrlMatches[0]);
    }
  });
  $("ctrl-search-clear")?.addEventListener("click", () => {
    if ($("ctrl-search")) {
      $("ctrl-search").value = "";
      updateControlSearch();
      $("ctrl-search").focus();
    }
  });
  $("ctrl-search-results")?.addEventListener("click", event => {
    const itemBtn = event.target.closest?.("[data-ctrl-idx]");
    if (!itemBtn) return;
    const match = currentCtrlMatches[Number(itemBtn.dataset.ctrlIdx)];
    if (match) jumpToControlEntry(match);
  });
  $("pv-tabs")?.addEventListener("click", event => {
    const btn = event.target.closest?.("[data-pv-tab]");
    if (btn) switchPvTab(btn.dataset.pvTab);
  });
  $("pv-tabs")?.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const tabs = [...$("pv-tabs").querySelectorAll("[data-pv-tab]")];
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    event.preventDefault();
    const next = tabs[(idx + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    switchPvTab(next.dataset.pvTab);
    next.focus();
  });
  document.querySelectorAll(".crumb-pills").forEach(pillBar => {
    pillBar.addEventListener("click", event => {
      const btn = event.target.closest?.("[data-crumb-for]");
      if (btn) switchCrumb(btn.dataset.crumbFor, btn.dataset.crumb);
    });
    pillBar.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const pills = [...pillBar.querySelectorAll("[data-crumb-for]")];
      const idx = pills.indexOf(document.activeElement);
      if (idx < 0) return;
      event.preventDefault();
      const next = pills[(idx + (event.key === "ArrowRight" ? 1 : -1) + pills.length) % pills.length];
      switchCrumb(next.dataset.crumbFor, next.dataset.crumb);
      next.focus();
    });
  });
  let currentPvCtrlMatches = [];
  const updatePvControlSearch = () => {
    currentPvCtrlMatches = renderPvControlSearchResults($("pv-ctrl-search")?.value || "");
  };
  $("pv-ctrl-search")?.addEventListener("input", updatePvControlSearch);
  $("pv-ctrl-search")?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if ($("pv-ctrl-search").value) {
        event.preventDefault();
        event.stopPropagation();
        $("pv-ctrl-search").value = "";
        updatePvControlSearch();
      }
    } else if (event.key === "Enter" && currentPvCtrlMatches.length) {
      event.preventDefault();
      jumpToPvControlEntry(currentPvCtrlMatches[0]);
    }
  });
  $("pv-ctrl-search-clear")?.addEventListener("click", () => {
    if ($("pv-ctrl-search")) {
      $("pv-ctrl-search").value = "";
      updatePvControlSearch();
      $("pv-ctrl-search").focus();
    }
  });
  $("pv-ctrl-search-results")?.addEventListener("click", event => {
    const itemBtn = event.target.closest?.("[data-pv-ctrl-idx]");
    if (!itemBtn) return;
    const match = currentPvCtrlMatches[Number(itemBtn.dataset.pvCtrlIdx)];
    if (match) jumpToPvControlEntry(match);
  });
  $("smp").addEventListener("click", loadSamples);
  $("smp-visiting")?.addEventListener("click", loadVisitingSamples);
  $("rst").addEventListener("click", async () => { await clearSession(); resetDefaults(); });
  $("exp").addEventListener("click", () => exportProjectJson(readSettings(), studioState.cards, studioState.count));
  $("data-open").addEventListener("click", () => $("data-dialog").showModal());
  document.querySelectorAll(".action-menu").forEach(menu => {
    menu.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { menu.open = false; }));
  });
  function setMobileView(view) {
    $("app").dataset.mobileView = view;
    document.body.dataset.mobileView = view;
    document.querySelectorAll("[data-mobile-view]").forEach(toggle => {
      toggle.setAttribute("aria-pressed", String(toggle.dataset.mobileView === view));
    });
    const toggleBtn = $("sidebar-toggle");
    if (toggleBtn && window.matchMedia("(max-width: 640px)").matches) {
      const open = view !== "preview";
      toggleBtn.setAttribute("aria-expanded", String(open));
      toggleBtn.setAttribute("aria-label", open ? "Collapse sidebar drawer" : "Open sidebar drawer");
    }
    updatePreviewZoom(previewZoom);
  }
  function setSidebarCollapsed(collapsed) {
    const app = $("app");
    if (!app) return;
    app.classList.toggle("is-sidebar-collapsed", Boolean(collapsed));
    const toggleBtn = $("sidebar-toggle");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", String(!collapsed));
      toggleBtn.setAttribute("aria-label", collapsed ? "Open sidebar drawer" : "Collapse sidebar drawer");
    }
    const edgeBtn = $("sidebar-edge-open");
    if (edgeBtn) edgeBtn.hidden = !collapsed;
    try { localStorage.setItem("ticket_sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
    window.setTimeout(() => updatePreviewZoom(previewZoom), 240);
  }
  try {
    if (!window.matchMedia("(max-width: 640px)").matches && localStorage.getItem("ticket_sidebar_collapsed") === "1") {
      setSidebarCollapsed(true);
    }
  } catch {}
  document.querySelectorAll("[data-mobile-view]").forEach(button => button.addEventListener("click", () => {
    setMobileView(button.dataset.mobileView);
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
  [
    ["pv-title", "title", "change card name"],
    ["pv-genre", "genre", "change card genre"],
    ["pv-loc", "loc", "change card place"],
    ["pv-year", "year", "change card year"],
    ["pv-code", "code", "change card abbreviation"],
    ["pv-role", "role", "change card job title"],
    ["pv-company", "company", "change card company"],
    ["pv-phone", "phone", "change card phone"],
    ["pv-email", "email", "change card email"],
    ["pv-website", "website", "change card website"],
    ["pv-address", "address", "change card address"],
    ["pv-qrtext", "qrText", "change card QR value"],
    ["pv-stx", "stx", "change card stamp text"],
    ["pv-left-margin", "leftMargin", "change card left margin text"],
    ["pv-doors", "doors", "change card doors text"],
    ["pv-side", "side", "change card right margin text"],
    ["pv-admit", "admitText", "change card top-left badge text"],
    ["pv-pass", "passText", "change card pass label text"],
    ["pv-stamp-year", "stampYear", "change card stamp year"]
  ].forEach(([id, field, label]) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (previewIndex < 0) return;
      updateCard(previewIndex, { [field]: el.value });
      syncSidebarRowValues(previewIndex);
      scheduleRender();
    });
    bindContinuousHistory(el, label, `pv:${field}`);
  });
  [
    ["pv-zm", "zm", "pv-zm-val", v => `${v}%`, v => Number(v) / 100, "change photo zoom"],
    ["pv-px", "px", "pv-px-val", v => String(v), v => Number(v), "change horizontal photo position"],
    ["pv-py", "py", "pv-py-val", v => String(v), v => Number(v), "change vertical photo position"]
  ].forEach(([id, field, outId, fmt, parseFn, label]) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (previewIndex < 0) return;
      if ($(outId)) $(outId).textContent = fmt(el.value);
      updateCard(previewIndex, { [field]: parseFn(el.value) });
      syncSidebarRowValues(previewIndex);
      scheduleRender();
    });
    bindContinuousHistory(el, label, `pv:${field}`);
  });
  $("pv-photo-btn")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    pendingPhotoUploadIndex = previewIndex;
    ensureSharedPhotoInput().click();
  });
  $("pv-photo-remove")?.addEventListener("click", () => {
    if (previewIndex >= 0) removeCardPhoto(previewIndex);
  });
  $("pv-crop-reset")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    updateCard(previewIndex, { zm: 1, px: 0, py: 0 });
    recordDiscrete("reset photo crop");
    syncSidebarRowValues(previewIndex);
    render();
  });
  $("pv-accent")?.addEventListener("input", event => {
    if (previewIndex < 0) return;
    updateCard(previewIndex, { ...hexToHS(event.target.value), autoAccent: false });
    syncSidebarRowValues(previewIndex);
    scheduleRender();
  });
  if ($("pv-accent")) bindContinuousHistory($("pv-accent"), "change card accent colour", "pv:accent");
  [
    ["pv-theme", "theme", "change card theme"],
    ["pv-stamp", "sk", "change card stamp"],
    ["pv-hardware", "cornerHardware", "change card corner hardware"]
  ].forEach(([id, field, label]) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", () => {
      if (previewIndex < 0) return;
      updateCard(previewIndex, { [field]: el.value });
      recordDiscrete(label);
      buildRows();
      render();
    });
  });
  const clearCardOverrideFields = (fields, label) => {
    if (previewIndex < 0) return;
    const current = studioState.cards[previewIndex];
    if (!current) return;
    const next = { ...current };
    let changed = false;
    for (const key of fields) {
      if (key in next) {
        delete next[key];
        changed = true;
      }
    }
    if (!changed) return;
    cardIds.set(next, cardIdentity(current));
    studioState.cards = studioState.cards.map((item, idx) => idx === previewIndex ? next : item);
    recordDiscrete(label);
    buildRows();
    render();
  };
  [
    ["pv-vc-badge", "vcBadge", "change card badge mode", v => v],
    ["pv-nfc-platform", "nfcStyle", "change card NFC platform", v => v],
    ["pv-title-font", "titleFont", "change card title font", v => v],
    ["pv-sub-font", "subFont", "change card subtitle font", v => v],
    ["pv-grad-mode", "gradMode", "change card gradient style", v => v],
    ["pv-photo-filter", "photoFilter", "change card photo filter", v => Number(v)],
    ["pv-year-badge", "yearBadge", "change card year badge", v => Number(v)],
    ["pv-tear-style", "tearStyle", "change card tear line", v => Number(v)]
  ].forEach(([id, field, label, parseFn]) => {
    $(id)?.addEventListener("change", event => {
      if (previewIndex < 0) return;
      const raw = event.target.value;
      if (raw === "") {
        clearCardOverrideFields([field], `reset ${field}`);
        return;
      }
      updateCard(previewIndex, { [field]: parseFn(raw) });
      recordDiscrete(label);
      buildRows();
      render();
    });
  });
  [
    ["pv-nfc", "nfc", "change card NFC visibility"],
    ["pv-punch", "punchHole", "change card punch hole"],
    ["pv-center-title", "centerTitle", "change card title alignment"],
    ["pv-badge-washed", "yearBadgeWashed", "change card washed year badge"],
    ["pv-tear-notches", "tearNotches", "change card tear notches"],
    ["pv-halftone", "halftone", "change card halftone"],
    ["pv-stamp-auto", "stampAuto", "change card stamp colour mode"]
  ].forEach(([id, field, label]) => {
    $(id)?.addEventListener("change", event => {
      if (previewIndex < 0) return;
      const raw = event.target.value;
      if (raw === "") {
        clearCardOverrideFields([field], `reset ${field}`);
        return;
      }
      updateCard(previewIndex, { [field]: raw === "1" });
      recordDiscrete(label);
      buildRows();
      render();
    });
  });
  const bindPvRangeSlider = (id, field, outId, fmt, parseFn, label, contKey) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (previewIndex < 0) return;
      const raw = Number(el.value);
      if ($(outId)) $(outId).textContent = fmt(raw);
      updateCard(previewIndex, { [field]: parseFn(raw) });
      syncSidebarRowValues(previewIndex);
      scheduleRender();
      recordContinuous(label, contKey);
    });
    el.addEventListener("change", () => finishContinuous(label, contKey));
  };
  bindPvRangeSlider("pv-nfc-scale", "nfcScale", "pv-nfc-scale-val", v => `${v}%`, v => v, "change card NFC size", "pv:nfc-scale");
  bindPvRangeSlider("pv-title-scale", "titleScale", "pv-title-scale-val", v => `${v}%`, v => Number((v / 100).toFixed(2)), "change card title size", "pv:title-scale");
  bindPvRangeSlider("pv-sub-scale", "subScale", "pv-sub-scale-val", v => `${v}%`, v => v, "change card subtitle size", "pv:sub-scale");
  bindPvRangeSlider("pv-grad-angle", "gradientAngle", "pv-grad-angle-val", v => `${v}°`, v => v, "change card gradient angle", "pv:grad-angle");
  bindPvRangeSlider("pv-grad-spread", "gradientSpread", "pv-grad-spread-val", v => `${v}%`, v => v, "change card gradient spread", "pv:grad-spread");
  bindPvRangeSlider("pv-grain", "grain", "pv-grain-val", v => `${v}%`, v => v, "change card paper grain", "pv:grain");
  bindPvRangeSlider("pv-edge-wear", "edgeWear", "pv-edge-wear-val", v => `${v}%`, v => v, "change card vignette", "pv:edge-wear");
  bindPvRangeSlider("pv-scuffs", "scuffs", "pv-scuffs-val", v => `${v}%`, v => v, "change card surface scuffs", "pv:scuffs");
  bindPvRangeSlider("pv-scuff-rot", "scuffRotation", "pv-scuff-rot-val", v => `${v}°`, v => v, "change card scuff rotation", "pv:scuff-rot");
  bindPvRangeSlider("pv-stamp-wear", "stampWear", "pv-stamp-wear-val", v => `${v}%`, v => v, "change card stamp wear", "pv:stamp-wear");
  [
    ["pv-pal-bg", "bg", "change card paper colour", "pv:pal-bg"],
    ["pv-pal-ink", "ink", "change card text colour", "pv:pal-ink"]
  ].forEach(([id, palKey, label, contKey]) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (previewIndex < 0) return;
      const cur = studioState.cards[previewIndex]?.palette || {};
      updateCard(previewIndex, { palette: { ...cur, [palKey]: el.value } });
      syncSidebarRowValues(previewIndex);
      scheduleRender();
    });
    bindContinuousHistory(el, label, contKey);
  });
  $("pv-pal-tape")?.addEventListener("input", event => {
    if (previewIndex < 0) return;
    updateCard(previewIndex, { tape: event.target.value });
    syncSidebarRowValues(previewIndex);
    scheduleRender();
  });
  if ($("pv-pal-tape")) bindContinuousHistory($("pv-pal-tape"), "change card tape colour", "pv:tape");
  $("pv-stamp-color")?.addEventListener("input", event => {
    if (previewIndex < 0) return;
    updateCard(previewIndex, { stampColor: event.target.value, stampAuto: false });
    syncSidebarRowValues(previewIndex);
    scheduleRender();
  });
  if ($("pv-stamp-color")) bindContinuousHistory($("pv-stamp-color"), "change card stamp colour", "pv:stamp-color");
  const applyPreviewStampStylePatch = (patch, label) => {
    if (previewIndex < 0) return;
    const cur = studioState.cards[previewIndex];
    if (!cur) return;
    const base = resolveStampStyle(renderConfig(), cur);
    const merged = compactStampStyle({ ...base, ...patch });
    if (merged) {
      updateCard(previewIndex, { stampStyle: merged });
      recordDiscrete(label);
      buildRows();
      render();
    } else {
      clearCardOverrideFields(["stampStyle"], label);
    }
  };
  [
    ["pv-stamp-fill", "fillMode", "change card stamp ink style", v => v],
    ["pv-stamp-pattern", "pattern", "change card stamp pattern", v => v],
    ["pv-stamp-inner-ring", "innerRing", "change card stamp inner frame", v => v === "1"],
    ["pv-stamp-show-year", "showYear", "change card stamp year toggle", v => v === "1"]
  ].forEach(([id, key, label, parseFn]) => {
    $(id)?.addEventListener("change", event => {
      if (previewIndex < 0) return;
      const raw = event.target.value;
      if (raw === "") {
        const curStyle = { ...(studioState.cards[previewIndex]?.stampStyle || {}) };
        delete curStyle[key];
        const nextCompact = compactStampStyle(curStyle);
        if (nextCompact) {
          updateCard(previewIndex, { stampStyle: nextCompact });
          recordDiscrete(label);
          buildRows();
          render();
        } else {
          clearCardOverrideFields(["stampStyle"], label);
        }
        return;
      }
      applyPreviewStampStylePatch({ [key]: parseFn(raw) }, label);
    });
  });
  $("pv-ticket-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["leftMargin", "doors", "side", "admitText", "passText", "vcBadge", "nfc", "nfcStyle", "nfcScale", "punchHole"], "reset card ticket details");
  });
  $("pv-look-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["titleFont", "titleScale", "subFont", "subScale", "centerTitle", "photoFilter", "halftone", "yearBadge", "yearBadgeWashed", "tearStyle", "tearNotches"], "reset card look & typography");
  });
  $("pv-pal-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["palette", "tape", "gradMode", "gradientAngle", "gradientSpread"], "reset card palette");
  });
  $("pv-wear-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["grain", "edgeWear", "scuffs", "scuffRotation"], "reset card paper wear");
  });
  $("pv-stamp-style-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["sk", "stx", "stampYear", "extraStamps", "stampAuto", "stampColor", "stampStyle", "stampWear"], "reset card stamp style");
  });
  const applyPreviewBorderPatch = (patch, label, { continuousKey = "" } = {}) => {
    if (previewIndex < 0) return;
    const card = studioState.cards[previewIndex];
    if (!card) return;
    const cfg = renderConfig();
    const page = Math.floor(previewIndex / (currentLayout?.PER || 9));
    const resolved = resolveBorderConfig({ ...cfg, style: studioState.pageThemes[page] || cfg.style }, card);
    const nextBorder = sanitizeBorderPatch({
      style: resolved.style,
      width: resolved.width,
      inset: resolved.inset,
      opacity: resolved.opacity,
      glow: resolved.glow,
      colorMode: resolved.colorMode,
      color: resolved.color,
      pattern: resolved.pattern,
      corner: resolved.corner,
      cornerSize: resolved.cornerSize,
      ornament: resolved.ornament,
      wear: resolved.wear,
      inner: resolved.inner,
      ...patch
    });
    updateCard(previewIndex, { border: nextBorder });
    syncSidebarRowValues(previewIndex);
    if (continuousKey) {
      scheduleRender();
      recordContinuous(label, continuousKey);
    } else {
      recordDiscrete(label);
      buildRows();
      render();
    }
  };
  $("pv-border-style")?.addEventListener("change", event => {
    if (previewIndex < 0) return;
    const raw = event.target.value;
    if (raw === "") {
      clearCardOverrideFields(["border"], "use sheet border");
      return;
    }
    const styleId = Number(raw);
    const meta = getBorderStyleMeta(styleId);
    const current = studioState.cards[previewIndex];
    const resolved = resolveBorderConfig(renderConfig(), current);
    applyPreviewBorderPatch({ ...meta.defaults, wear: resolved.wear, style: styleId }, "change card border");
  });
  $("pv-border-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["border"], "use sheet border");
  });
  [
    ["pv-border-color-mode", "colorMode", "change card border colour mode"],
    ["pv-border-pattern", "pattern", "change card border pattern"],
    ["pv-border-corner", "corner", "change card border corner"],
    ["pv-border-ornament", "ornament", "change card corner ornament"]
  ].forEach(([id, key, label]) => {
    $(id)?.addEventListener("change", event => {
      applyPreviewBorderPatch({ [key]: event.target.value }, label);
    });
  });
  $("pv-border-inner")?.addEventListener("change", event => {
    applyPreviewBorderPatch({ inner: event.target.checked }, "toggle card inner border");
  });
  $("pv-border-color")?.addEventListener("input", event => {
    applyPreviewBorderPatch({ colorMode: "custom", color: event.target.value }, "change card border colour", { continuousKey: "pv:border-color" });
  });
  if ($("pv-border-color")) bindContinuousHistory($("pv-border-color"), "change card border colour", "pv:border-color");
  [
    ["pv-border-width", "width", "pv-border-width-val", v => Number(v).toFixed(1), "change card border width", "pv:border-width"],
    ["pv-border-inset", "inset", "pv-border-inset-val", v => Number(v).toFixed(1), "change card border inset", "pv:border-inset"],
    ["pv-border-opacity", "opacity", "pv-border-opacity-val", v => `${Math.round(Number(v))}%`, "change card border opacity", "pv:border-opacity"],
    ["pv-border-glow", "glow", "pv-border-glow-val", v => `${Math.round(Number(v))}%`, "change card border glow", "pv:border-glow"],
    ["pv-border-corner-size", "cornerSize", "pv-border-corner-size-val", v => String(v), "change card corner size", "pv:border-corner-size"],
    ["pv-border-wear", "wear", "pv-border-wear-val", v => `${Math.round(Number(v))}%`, "change card border wear", "pv:border-wear"]
  ].forEach(([id, key, outId, fmt, label, contKey]) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", event => {
      const val = Number(event.target.value);
      if ($(outId)) $(outId).textContent = fmt(val);
      applyPreviewBorderPatch({ [key]: val }, label, { continuousKey: contKey });
    });
    el.addEventListener("change", () => finishContinuous(label, contKey));
  });
  const pvMountInputs = [...document.querySelectorAll("[data-pv-mount]")];
  pvMountInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (previewIndex < 0) return;
      const mounts = applyMountCheckboxRule(pvMountInputs, input);
      if (!mounts) return;
      updateCard(previewIndex, { photoMounts: mounts.length ? mounts : [3] });
      recordDiscrete("change card photo mounts");
      buildRows();
      render();
    });
  });
  $("pv-mounts-reset")?.addEventListener("click", () => {
    clearCardOverrideFields(["photoMounts"], "use sheet photo mounts");
  });
  const applyPreviewStampEdit = (patch, label) => {
    if (previewIndex < 0) return;
    const st = resolveCardStamp(previewIndex, 0);
    const current = studioState.cards[previewIndex]?.stampPos;
    const next = sanitizeStampOverride({
      x: current?.x ?? st.nx,
      y: current?.y ?? st.ny,
      r: current?.r ?? st.r,
      scale: current?.scale ?? st.mult,
      ...patch
    });
    updateCard(previewIndex, { stampPos: next });
    patchLiveStampDom(previewIndex, 0);
    syncSidebarRowValues(previewIndex);
    scheduleRender();
    recordContinuous(label, "pv:stamp-pos");
  };
  $("pv-srot")?.addEventListener("input", event => {
    const angle = normalizeAngle(Number(event.target.value));
    if ($("pv-srot-val")) $("pv-srot-val").textContent = `${angle}°`;
    applyPreviewStampEdit({ r: angle }, "rotate stamp");
  });
  $("pv-srot")?.addEventListener("change", () => finishContinuous("rotate stamp", "pv:stamp-pos"));
  $("pv-sscale")?.addEventListener("input", event => {
    const scale = clampStampScale(Number(event.target.value) / 100);
    if ($("pv-sscale-val")) $("pv-sscale-val").textContent = `${Math.round(scale * 100)}%`;
    applyPreviewStampEdit({ scale }, "scale stamp");
  });
  $("pv-sscale")?.addEventListener("change", () => finishContinuous("scale stamp", "pv:stamp-pos"));
  $("pv-surprise")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    surpriseCards({ seed: generateSeed(), onlyIndex: previewIndex, actionLabel: "surprise card styling" });
  });
  $("pv-lock")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    toggleCardLock(previewIndex);
    syncPreviewControls();
  });
  $("pv-reset-stamp")?.addEventListener("click", () => {
    if (previewIndex < 0) return;
    const current = studioState.cards[previewIndex];
    if (current && (current.stampPos || current.stamp2Pos)) {
      const { stampPos: _p1, stamp2Pos: _p2, ...rest } = current;
      const next = { ...rest };
      cardIds.set(next, cardIdentity(current));
      studioState.cards = studioState.cards.map((item, idx) => idx === previewIndex ? next : item);
      recordDiscrete("reset stamp position");
      buildRows();
      render();
    }
  });
  $("pv-reset-style")?.addEventListener("click", () => {
    if (previewIndex >= 0) resetSingleCardStyling(previewIndex);
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
    if (event.key === "Escape") { closePreview(); return; }
    if (event.target?.matches?.("#pv input, #pv select, #pv textarea") || event.target?.closest?.(".st-hit")) return;
    if (event.key === "ArrowLeft") openPreview(previewIndex - 1);
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

  const bindCardStageInteractions = container => {
    if (!container) return;
    container.addEventListener("pointerdown", event => {
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
          if (cardHasExtraStamp(index)) {
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
        if (cardHasExtraStamp(index)) {
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
      target.setPointerCapture?.(event.pointerId);
      const cardGroup = target.closest("g[data-ci]:not(.st-ui)");
      const cardScale = cardGroup?.getScreenCTM()?.a || target.ownerSVGElement.getScreenCTM().a;
      const geom = getCardPhotoGeometry(index);
      activePpPointers.set(event.pointerId, { x: event.clientX, y: event.clientY, index });
      const sameCard = [...activePpPointers.entries()].filter(([, p]) => p.index === index);
      if (sameCard.length >= 2) {
        dragState = null;
        const [idA, pA] = sameCard[0];
        const [idB, pB] = sameCard[1];
        pinchState = {
          index,
          idA,
          idB,
          startDist: Math.max(10, Math.hypot(pB.x - pA.x, pB.y - pA.y)),
          startZm: card.zm || 1,
          startPx: card.px || 0,
          startPy: card.py || 0,
          midX: (pA.x + pB.x) / 2,
          midY: (pA.y + pB.y) / 2,
          scale: cardScale,
          ...geom
        };
        return;
      }
      dragState = {
        index,
        x: event.clientX,
        y: event.clientY,
        px: card.px || 0,
        py: card.py || 0,
        scale: cardScale,
        ...geom
      };
    });
    container.addEventListener("wheel", event => {
      const target = event.target.closest(".pp");
      if (!target || !dragPhotoMode || container.id !== "pvi") return;
      const index = +target.dataset.ci, card = studioState.cards[index];
      if (!card?.img || !card.iw) return;
      event.preventDefault();
      const rawDelta = event.deltaMode === 1 ? event.deltaY * 16 : (event.deltaMode === 2 ? event.deltaY * 120 : event.deltaY);
      if (!rawDelta) return;
      const sensitivity = event.ctrlKey ? 0.008 : 0.0022;
      const nextZm = Math.max(1, Math.min(3, Math.round((card.zm || 1) * Math.exp(-rawDelta * sensitivity) * 1000) / 1000));
      const updated = updateCard(index, { zm: nextZm });
      const geom = getCardPhotoGeometry(index);
      const box = fitBox(updated, geom.CH, geom.PS, geom.PH);
      if (box) patchLivePhotoDom(index, updated.px || 0, updated.py || 0, box, geom.isPolaroid, true);
      const actionKey = `card:${index}:photo-zoom`;
      recordContinuous("zoom card photo", actionKey);
      const prevTimer = photoZoomWheelTimers.get(index);
      if (prevTimer) clearTimeout(prevTimer);
      photoZoomWheelTimers.set(index, setTimeout(() => {
        photoZoomWheelTimers.delete(index);
        finishContinuous("zoom card photo", actionKey);
        saveSoon();
      }, 180));
    }, { passive: false });
    container.addEventListener("keydown", event => {
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
    container.addEventListener("focusout", event => {
      const target = event.target.closest(".st-hit");
      if (!target) return;
      const index = Number(target.dataset.ci);
      const si = Number(target.dataset.si) === 1 ? 1 : 0;
      finishContinuous("nudge stamp", `card:${index}:stamp-nudge:${si}`);
    });
  };

  bindCardStageInteractions($("sheets"));
  bindCardStageInteractions($("pvi"));

  window.addEventListener("pointermove", event => {
    if (activePpPointers.has(event.pointerId)) {
      const entry = activePpPointers.get(event.pointerId);
      entry.x = event.clientX;
      entry.y = event.clientY;
    }

    if (pinchState) {
      const pA = activePpPointers.get(pinchState.idA);
      const pB = activePpPointers.get(pinchState.idB);
      if (!pA || !pB) return;
      const curDist = Math.max(10, Math.hypot(pB.x - pA.x, pB.y - pA.y));
      const curMidX = (pA.x + pB.x) / 2;
      const curMidY = (pA.y + pB.y) / 2;
      const nextZm = Math.max(1, Math.min(3, Math.round(pinchState.startZm * (curDist / pinchState.startDist) * 1000) / 1000));
      const curCard = studioState.cards[pinchState.index];
      const box = curCard ? fitBox({ ...curCard, zm: nextZm }, pinchState.CH, pinchState.PS, pinchState.PH) : null;
      if (!box) return;
      const dx = (curMidX - pinchState.midX) / pinchState.scale;
      const dy = (curMidY - pinchState.midY) / pinchState.scale;
      const px = box.mx > 0 ? Math.max(-100, Math.min(100, pinchState.startPx + dx / box.mx * 100)) : 0;
      const py = box.my > 0 ? Math.max(-100, Math.min(100, pinchState.startPy + dy / box.my * 100)) : 0;
      updateCard(pinchState.index, { zm: nextZm, px, py });
      recordContinuous("zoom and pan card photo", `card:${pinchState.index}:photo-pinch`);
      patchLivePhotoDom(pinchState.index, px, py, box, pinchState.isPolaroid, true);
      return;
    }

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
    const card = studioState.cards[dragState.index];
    const box = fitBox(card, currentLayout.CH, dragState.PS, dragState.PH);
    if (!box) return;
    const dx = (event.clientX - dragState.x) / dragState.scale;
    const dy = (event.clientY - dragState.y) / dragState.scale;
    const px = box.mx > 0 ? Math.max(-100, Math.min(100, dragState.px + dx / box.mx * 100)) : 0;
    const py = box.my > 0 ? Math.max(-100, Math.min(100, dragState.py + dy / box.my * 100)) : 0;
    updateCard(dragState.index, { px, py });
    recordContinuous("reposition card photo", `card:${dragState.index}:photo-position`);
    patchLivePhotoDom(dragState.index, px, py, box, dragState.isPolaroid);
  });
  ["pointerup", "pointercancel"].forEach(name => window.addEventListener(name, event => {
    activePpPointers.delete(event.pointerId);
    if (pinchState && (event.pointerId === pinchState.idA || event.pointerId === pinchState.idB || activePpPointers.size < 2)) {
      finishContinuous("zoom and pan card photo", `card:${pinchState.index}:photo-pinch`);
      pinchState = null;
      render();
      return;
    }
    if (stampDragState) {
      const { mode, moved } = stampDragState;
      stampDragState = null;
      [$("sheets"), $("pvi")].forEach(root => root?.querySelectorAll(".st-snap-guide").forEach(node => node.remove()));
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
  studioState.activePage = Math.max(0, Math.min(studioState.activePage, pageCount - 1));
  if (select.options.length !== pageCount) {
    select.innerHTML = Array.from({ length: pageCount }, (_, page) =>
      `<option value="${page}"${page === studioState.activePage ? " selected" : ""}>Page ${page + 1}</option>`
    ).join("");
  } else if (select.value !== String(studioState.activePage)) {
    select.value = String(studioState.activePage);
  }
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
  markActiveSheetClass(studioState.activePage);
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
  populateSubtitleFontSelect();
  populateThemeSelect($("style"));
  populateFilteredThemeSelects();
  buildThemeDropdown();
  syncThemeDropdown();
  buildBorderPicker();
  populateBorderPresets();
  syncBorderControls();
  buildStampPicker();
  populateStampPresets();
  syncStampControls();
  renderGlobalExtraStampsEditor();
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
  syncVisitingControlsUi();
  currentLayout = layoutFromControls();
  buildRows();
  render();
  historyReady = true;
  history.initialize(captureSnapshot());
}

init().catch(error => {
  console.error("Could not initialize Ticket Card Studio:", error);
  message("Could not restore the studio session. Reload the page to try again.");
});

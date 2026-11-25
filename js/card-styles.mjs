// Per-card optional style override schema, sanitization & WCAG contrast helpers
import { sanitizeBorderPatch } from "./borders.mjs?v=phase8.3";
import { sanitizeStampOverride, sanitizeStampStyle } from "./stamps.mjs?v=phase8.3";

export const MAX_CARDS_LIMIT = 300;

export const CARD_STYLE_OVERRIDE_KEYS = Object.freeze([
  "theme",
  "palette",
  "tape",
  "border",
  "sk",
  "stampStyle",
  "stampColor",
  "stampAuto",
  "stampSize",
  "stampWear",
  "stampPos",
  "stamp2Pos",
  "photoMounts",
  "titleFont",
  "titleScale",
  "centerTitle",
  "yearBadge",
  "tearStyle",
  "grain",
  "edgeWear",
  "creases",
  "scuffs",
  "photoFilter",
  "halftone",
  "gradientAngle",
  "gradientSpread"
]);

export const SURPRISE_MANAGED_STYLE_KEYS = Object.freeze([
  "theme",
  "palette",
  "tape",
  "border",
  "sk",
  "stampStyle",
  "stampColor",
  "stampAuto",
  "stampSize",
  "stampWear",
  "stampPos",
  "stamp2Pos",
  "photoMounts",
  "titleFont",
  "titleScale",
  "centerTitle",
  "yearBadge",
  "tearStyle",
  "grain",
  "edgeWear",
  "creases",
  "scuffs",
  "photoFilter",
  "halftone",
  "gradientAngle",
  "gradientSpread"
]);

const HEX_RE = /^#[\da-f]{6}$/i;
const FONT_KEYS = ["pirata", "playfair", "georgia", "mont", "trebuchet", "bebas", "impact", "script", "calligraphy", "brush", "marker", "type", "courier", "consolas"];

export function normalizeHex(hex, fallback = "") {
  let clean = String(hex || "").trim();
  if (!clean) return fallback;
  if (/^#[\da-f]{3}$/i.test(clean)) {
    const [, r, g, b] = clean;
    clean = `#${r}${r}${g}${g}${b}${b}`;
  }
  return HEX_RE.test(clean) ? clean.toLowerCase() : fallback;
}

export function hexToRgb(hex) {
  const clean = normalizeHex(hex, "");
  if (!clean) return null;
  const n = parseInt(clean.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  const clampByte = v => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [r, g, b].map(v => clampByte(v).toString(16).padStart(2, "0")).join("");
}

export function blendHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return normalizeHex(hexA, "#000000");
  const k = Math.max(0, Math.min(1, Number(t) || 0));
  return rgbToHex(
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k
  );
}

export function hslObjectToHex({ h = 35, s = 0.75, l = 0.5 } = {}) {
  const hue = ((Number(h) % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, Number(s) || 0));
  const lig = Math.max(0, Math.min(1, Number(l) || 0));
  const f = n => {
    const k = (n + hue / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    return Math.round(255 * (lig - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return rgbToHex(f(0), f(8), f(4));
}

// WCAG 2.1 sRGB relative luminance
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const linear = rgb.map(c => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const bright = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (bright + 0.05) / (dark + 0.05);
}

/**
 * Adjusts foreground hex toward white or near-black if contrast against every background stop
 * is below minRatio (default WCAG AA 4.5:1).
 */
export function ensureContrastHex(fgHex, bgStops, minRatio = 4.5) {
  const cleanFg = normalizeHex(fgHex, "#111111");
  const stops = (Array.isArray(bgStops) ? bgStops : [bgStops]).map(s => normalizeHex(s, "")).filter(Boolean);
  if (!stops.length) return cleanFg;

  const minContrast = hex => Math.min(...stops.map(bg => contrastRatio(hex, bg)));
  if (minContrast(cleanFg) >= minRatio) return cleanFg;

  // Pick direction based on average background luminance: dark bg -> lighten toward #ffffff; light bg -> darken toward #0c0c0c
  const avgLum = stops.reduce((sum, bg) => sum + relativeLuminance(bg), 0) / stops.length;
  const target = avgLum < 0.35 ? "#ffffff" : "#0c0c0c";
  let best = cleanFg;
  let bestScore = minContrast(cleanFg);

  for (let step = 1; step <= 20; step++) {
    const candidate = blendHex(cleanFg, target, step / 20);
    const score = minContrast(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
    if (score >= minRatio) return candidate;
  }
  const opposite = target === "#ffffff" ? "#0c0c0c" : "#ffffff";
  return minContrast(opposite) > bestScore ? opposite : best;
}

export function sanitizePalettePatch(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  for (const key of ["bg", "ink", "mute", "ph", "frame", "acc", "fixed", "bt", "gs", "gradEnd"]) {
    const hex = normalizeHex(raw[key], "");
    if (hex) out[key] = hex;
  }
  if (raw.grad !== undefined) out.grad = raw.grad ? 1 : 0;
  if (raw.gl !== undefined && Number.isFinite(Number(raw.gl))) {
    out.gl = Number(Math.max(0.15, Math.min(0.85, Number(raw.gl))).toFixed(3));
  }
  return Object.keys(out).length ? out : undefined;
}

const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.max(min, Math.min(max, n))) : fallback;
};

export function sanitizeCardStyleOverrides(raw, validThemes = null, validStamps = null) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  if (typeof raw.theme === "string" && raw.theme.trim()) {
    const tKey = raw.theme.trim();
    if (!validThemes || validThemes[tKey]) out.theme = tKey;
  }
  const pal = sanitizePalettePatch(raw.palette);
  if (pal) out.palette = pal;
  const tapeHex = normalizeHex(raw.tape, "");
  if (tapeHex) out.tape = tapeHex;
  const border = sanitizeBorderPatch(raw.border);
  if (border) out.border = border;
  const skRaw = raw.sk ?? raw.stampShape;
  if (typeof skRaw === "string" && skRaw.trim()) {
    const skKey = skRaw.trim();
    if (!validStamps || validStamps[skKey] || skKey === "mixed" || skKey === "none") out.sk = skKey;
  }
  const stampStyle = sanitizeStampStyle(raw.stampStyle);
  if (stampStyle) out.stampStyle = stampStyle;
  const stampHex = normalizeHex(raw.stampColor, "");
  if (stampHex) out.stampColor = stampHex;
  if (raw.stampAuto !== undefined) out.stampAuto = Boolean(raw.stampAuto);
  if (raw.stampSize !== undefined && Number.isFinite(Number(raw.stampSize))) {
    out.stampSize = clampInt(raw.stampSize, 50, 250, 100);
  }
  if (raw.stampWear !== undefined && Number.isFinite(Number(raw.stampWear))) {
    out.stampWear = clampInt(raw.stampWear, 0, 100, 35);
  }
  const stampPos = sanitizeStampOverride(raw.stampPos);
  if (stampPos) out.stampPos = stampPos;
  const stamp2Pos = sanitizeStampOverride(raw.stamp2Pos);
  if (stamp2Pos) out.stamp2Pos = stamp2Pos;
  if (Array.isArray(raw.photoMounts)) {
    const mounts = [...new Set(raw.photoMounts.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 8))].slice(0, 2);
    if (mounts.length) out.photoMounts = mounts;
  }
  if (typeof raw.titleFont === "string" && FONT_KEYS.includes(raw.titleFont)) {
    out.titleFont = raw.titleFont;
  }
  if (raw.titleScale !== undefined && Number.isFinite(Number(raw.titleScale))) {
    out.titleScale = Number(Math.max(0.7, Math.min(1, Number(raw.titleScale))).toFixed(2));
  }
  if (raw.centerTitle !== undefined) out.centerTitle = Boolean(raw.centerTitle);
  if (raw.yearBadge !== undefined && Number.isFinite(Number(raw.yearBadge))) {
    out.yearBadge = clampInt(raw.yearBadge, 0, 2, 0);
  }
  if (raw.tearStyle !== undefined && Number.isFinite(Number(raw.tearStyle))) {
    out.tearStyle = clampInt(raw.tearStyle, 0, 2, 0);
  }
  for (const wearKey of ["grain", "edgeWear", "creases", "scuffs"]) {
    if (raw[wearKey] !== undefined && Number.isFinite(Number(raw[wearKey]))) {
      out[wearKey] = clampInt(raw[wearKey], 0, 100, 0);
    }
  }
  if (raw.photoFilter !== undefined && Number.isFinite(Number(raw.photoFilter))) {
    out.photoFilter = clampInt(raw.photoFilter, 0, 2, 0);
  }
  if (raw.halftone !== undefined) out.halftone = Boolean(raw.halftone);
  if (raw.gradientAngle !== undefined && Number.isFinite(Number(raw.gradientAngle))) {
    out.gradientAngle = ((Math.round(Number(raw.gradientAngle)) % 360) + 360) % 360;
  }
  if (raw.gradientSpread !== undefined && Number.isFinite(Number(raw.gradientSpread))) {
    out.gradientSpread = clampInt(raw.gradientSpread, 10, 100, 32);
  }
  if (raw.locked) out.locked = true;
  return out;
}

export function hasCustomCardStyling(card) {
  if (!card || typeof card !== "object") return false;
  return CARD_STYLE_OVERRIDE_KEYS.some(key => {
    if (key === "locked") return false;
    const val = card[key];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0;
    return true;
  });
}

export function clearCardStylingRecord(card, { clearLock = false } = {}) {
  if (!card || typeof card !== "object") return card;
  const next = { ...card };
  for (const key of CARD_STYLE_OVERRIDE_KEYS) {
    if (key === "locked" && !clearLock) continue;
    delete next[key];
  }
  return next;
}

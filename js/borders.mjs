// Border style catalog, config resolution, presets & SVG vector/filter renderer

export const ORNAMENT_KINDS = [
  { id: "none", name: "None" },
  { id: "diamond", name: "Diamond" },
  { id: "dot", name: "Dot" },
  { id: "star", name: "Star" },
  { id: "cross", name: "Cross" },
  { id: "bracket", name: "Corner tick" }
];

export const CORNER_KINDS = [
  { id: "square", name: "Square" },
  { id: "rounded", name: "Rounded" },
  { id: "notched", name: "Notched" },
  { id: "chamfered", name: "Chamfered" }
];

export const PATTERN_KINDS = [
  { id: "solid", name: "Solid" },
  { id: "dashed", name: "Dashed" },
  { id: "dotted", name: "Dotted" },
  { id: "dashdot", name: "Dash-dot" }
];

export const COLOR_MODES = [
  { id: "accent", name: "Theme accent" },
  { id: "ink", name: "Theme text" },
  { id: "frame", name: "Theme frame" },
  { id: "mute", name: "Theme muted" },
  { id: "custom", name: "Custom hex" }
];

const BASE_DEFAULTS = {
  width: 1.5,
  inset: 2.5,
  colorMode: "accent",
  color: "#ff5a36",
  opacity: 100,
  pattern: "solid",
  dash: 4,
  gap: 2.5,
  corner: "square",
  cornerSize: 9,
  lineGap: 3.3,
  inner: false,
  innerWidth: 0.7,
  innerGap: 3.0,
  innerColorMode: "accent",
  innerColor: "#ff5a36",
  ornament: "none",
  ornamentSize: 5,
  glow: 0
};

const FULL_SUPPORTS = {
  width: true,
  inset: true,
  color: true,
  opacity: true,
  pattern: true,
  corner: true,
  lineGap: false,
  inner: true,
  ornament: true,
  wear: true,
  glow: true
};

export const BORDER_STYLES = [
  {
    id: 0,
    key: "double",
    name: "Double",
    legacy: true,
    defaults: { ...BASE_DEFAULTS, width: 1.5, inset: 2.5, lineGap: 3.3, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, lineGap: true }
  },
  {
    id: 1,
    key: "thick",
    name: "Thick",
    legacy: true,
    defaults: { ...BASE_DEFAULTS, width: 2.6, inset: 3, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS }
  },
  {
    id: 2,
    key: "brackets",
    name: "Brackets",
    legacy: true,
    defaults: { ...BASE_DEFAULTS, width: 2.2, inset: 3, corner: "square", cornerSize: 22 },
    supports: { ...FULL_SUPPORTS, corner: false }
  },
  {
    id: 3,
    key: "dashed",
    name: "Dashed",
    legacy: true,
    defaults: { ...BASE_DEFAULTS, width: 1.1, inset: 4, pattern: "dashed", dash: 4, gap: 2.5 },
    supports: { ...FULL_SUPPORTS }
  },
  {
    id: 4,
    key: "rounded",
    name: "Rounded",
    legacy: true,
    defaults: { ...BASE_DEFAULTS, width: 1.5, inset: 2.5, lineGap: 3.3, corner: "rounded", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, lineGap: true }
  },
  {
    id: 5,
    key: "triple",
    name: "Triple line",
    defaults: { ...BASE_DEFAULTS, width: 1.4, inset: 2.2, lineGap: 2.4, corner: "square", cornerSize: 8 },
    supports: { ...FULL_SUPPORTS, lineGap: true },
    printNote: "Inner hairline uses a 0.45-unit print floor so thin rules do not drop out."
  },
  {
    id: 6,
    key: "retro",
    name: "Thick retro",
    defaults: { ...BASE_DEFAULTS, width: 2.8, inset: 3, lineGap: 2.8, corner: "square", cornerSize: 8 },
    supports: { ...FULL_SUPPORTS, lineGap: true }
  },
  {
    id: 7,
    key: "deco",
    name: "Art-Deco",
    defaults: { ...BASE_DEFAULTS, width: 1.3, inset: 3, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, corner: false }
  },
  {
    id: 8,
    key: "ornate",
    name: "Flourishes",
    defaults: { ...BASE_DEFAULTS, width: 1.0, inset: 3, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, corner: false },
    printNote: "Fine corner curls soften slightly on small Mini cards."
  },
  {
    id: 9,
    key: "stitch",
    name: "Dashed stitch",
    defaults: { ...BASE_DEFAULTS, width: 1.4, inset: 3.5, lineGap: 2.4, corner: "rounded", cornerSize: 6 },
    supports: { ...FULL_SUPPORTS, pattern: false, lineGap: true }
  },
  {
    id: 10,
    key: "film",
    name: "Film-strip",
    defaults: { ...BASE_DEFAULTS, width: 1.0, inset: 2.0 },
    supports: { ...FULL_SUPPORTS, pattern: false, corner: false, ornament: false }
  },
  {
    id: 11,
    key: "scallop",
    name: "Scalloped stub",
    defaults: { ...BASE_DEFAULTS, width: 1.3, inset: 3.5 },
    supports: { ...FULL_SUPPORTS, pattern: false, corner: false }
  },
  {
    id: 12,
    key: "grunge",
    name: "Ink-bleed",
    defaults: { ...BASE_DEFAULTS, width: 2.4, inset: 3.2, corner: "square", cornerSize: 8 },
    supports: { ...FULL_SUPPORTS, pattern: false },
    printNote: "Uses an SVG displacement filter when wear is above 0%; rasterizes in PNG/PDF exports."
  },
  {
    id: 13,
    key: "holo",
    name: "Holographic",
    defaults: { ...BASE_DEFAULTS, width: 1.9, inset: 2.8, corner: "chamfered", cornerSize: 8 },
    supports: { ...FULL_SUPPORTS },
    printNote: "Prints as a multi-colour gradient rather than metallic foil."
  },
  {
    id: 14,
    key: "neon",
    name: "Neon glow",
    defaults: { ...BASE_DEFAULTS, width: 1.8, inset: 3.0, corner: "rounded", cornerSize: 8, glow: 65 },
    supports: { ...FULL_SUPPORTS },
    printNote: "Best on dark themes; glow softens on paper and rasterizes in PNG/PDF."
  },
  {
    id: 15,
    key: "none",
    name: "None",
    defaults: { ...BASE_DEFAULTS },
    supports: {
      width: false, inset: false, color: false, opacity: false,
      pattern: false, corner: false, lineGap: false, inner: false,
      ornament: false, wear: false, glow: false
    }
  },
  {
    id: 16,
    key: "lattice",
    name: "Lattice knot",
    defaults: { ...BASE_DEFAULTS, width: 1.25, inset: 2.8, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, corner: false }
  },
  {
    id: 17,
    key: "keyfret",
    name: "Key fret",
    defaults: { ...BASE_DEFAULTS, width: 1.25, inset: 2.8, corner: "square", cornerSize: 9 },
    supports: { ...FULL_SUPPORTS, corner: false }
  }
];

export const BORDER_PRESETS_KEY = "ticketgen.borderPresets.v1";

const OVERRIDE_KEYS = [
  "width", "inset", "colorMode", "color", "opacity",
  "pattern", "dash", "gap", "corner", "cornerSize", "lineGap",
  "inner", "innerWidth", "innerGap", "innerColorMode", "innerColor",
  "ornament", "ornamentSize", "glow"
];

const HEX_RE = /^#[\da-f]{6}$/i;
const num = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const hexOr = (value, fallback) => HEX_RE.test(String(value || "").trim()) ? String(value).trim().toLowerCase() : fallback;
const fmt = value => Number(value.toFixed(2));

export function getBorderStyleMeta(styleId) {
  const id = Number(styleId);
  return BORDER_STYLES[id] || BORDER_STYLES[0];
}

export function sanitizeBorderPatch(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  if (raw.style !== undefined) {
    const id = Number.parseInt(raw.style, 10);
    if (Number.isInteger(id) && id >= 0 && id < BORDER_STYLES.length) out.style = id;
  }
  if (raw.width !== undefined) out.width = fmt(num(raw.width, 0.5, 5, BASE_DEFAULTS.width));
  if (raw.inset !== undefined) out.inset = fmt(num(raw.inset, 1.5, 10, BASE_DEFAULTS.inset));
  if (raw.colorMode !== undefined) out.colorMode = pick(raw.colorMode, COLOR_MODES.map(c => c.id), "accent");
  if (raw.color !== undefined) out.color = hexOr(raw.color, BASE_DEFAULTS.color);
  if (raw.opacity !== undefined) out.opacity = Math.round(num(raw.opacity, 10, 100, 100));
  if (raw.pattern !== undefined) out.pattern = pick(raw.pattern, PATTERN_KINDS.map(p => p.id), "solid");
  if (raw.dash !== undefined) out.dash = fmt(num(raw.dash, 1, 16, 4));
  if (raw.gap !== undefined) out.gap = fmt(num(raw.gap, 1, 16, 2.5));
  if (raw.corner !== undefined) out.corner = pick(raw.corner, CORNER_KINDS.map(c => c.id), "square");
  if (raw.cornerSize !== undefined) out.cornerSize = fmt(num(raw.cornerSize, 2, 18, 9));
  if (raw.lineGap !== undefined) out.lineGap = fmt(num(raw.lineGap, 1.5, 8, 3.3));
  if (raw.inner !== undefined) out.inner = Boolean(raw.inner);
  if (raw.innerWidth !== undefined) out.innerWidth = fmt(num(raw.innerWidth, 0.4, 3, 0.7));
  if (raw.innerGap !== undefined) out.innerGap = fmt(num(raw.innerGap, 1.5, 10, 3));
  if (raw.innerColorMode !== undefined) out.innerColorMode = pick(raw.innerColorMode, COLOR_MODES.map(c => c.id), "accent");
  if (raw.innerColor !== undefined) out.innerColor = hexOr(raw.innerColor, BASE_DEFAULTS.innerColor);
  if (raw.ornament !== undefined) out.ornament = pick(raw.ornament, ORNAMENT_KINDS.map(o => o.id), "none");
  if (raw.ornamentSize !== undefined) out.ornamentSize = fmt(num(raw.ornamentSize, 2, 10, 5));
  if (raw.wear !== undefined) out.wear = Math.round(num(raw.wear, 0, 100, 35));
  if (raw.glow !== undefined) out.glow = Math.round(num(raw.glow, 0, 100, 0));
  return Object.keys(out).length ? out : undefined;
}

export function compactBorderOverrides(styleId, raw) {
  const meta = getBorderStyleMeta(styleId);
  const clean = sanitizeBorderPatch(raw) || {};
  const out = {};
  for (const key of OVERRIDE_KEYS) {
    if (clean[key] !== undefined && clean[key] !== meta.defaults[key]) {
      out[key] = clean[key];
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function resolveBorderConfig(settings = {}, card = null) {
  const sheetStyle = Number.isInteger(Number(settings.borderStyle))
    ? Math.max(0, Math.min(BORDER_STYLES.length - 1, Number(settings.borderStyle)))
    : 0;
  const cardBorder = card?.border && typeof card.border === "object" ? card.border : null;
  const cardChangesStyle = cardBorder?.style !== undefined && Number(cardBorder.style) !== sheetStyle;
  const styleId = cardBorder?.style !== undefined
    ? Math.max(0, Math.min(BORDER_STYLES.length - 1, Number(cardBorder.style)))
    : sheetStyle;
  const meta = getBorderStyleMeta(styleId);
  const sheetOverrides = cardChangesStyle ? undefined : settings.border;
  const wear = cardBorder?.wear !== undefined
    ? num(cardBorder.wear, 0, 100, 35)
    : num(settings.borderWear, 0, 100, 35);

  const merged = {
    ...meta.defaults,
    ...(sheetOverrides && typeof sheetOverrides === "object" ? sanitizeBorderPatch(sheetOverrides) : {}),
    ...(cardBorder ? sanitizeBorderPatch(cardBorder) : {}),
    style: styleId,
    wear
  };
  return merged;
}

export function hasBorderOverrides(resolved) {
  if (!resolved) return false;
  const meta = getBorderStyleMeta(resolved.style);
  return OVERRIDE_KEYS.some(key => resolved[key] !== undefined && resolved[key] !== meta.defaults[key]);
}

function parseColorHex(hex) {
  let clean = String(hex || "").trim().replace("#", "");
  if (clean.length === 3) clean = clean.replace(/./g, "$&$&");
  if (!/^[\da-f]{6}$/i.test(clean)) return null;
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const ca = parseColorHex(a) || [255, 90, 54];
  const cb = parseColorHex(b) || [255, 255, 255];
  const mixCh = index => Math.round(ca[index] * (1 - t) + cb[index] * t).toString(16).padStart(2, "0");
  return `#${mixCh(0)}${mixCh(1)}${mixCh(2)}`;
}

function hexToHsl(hex) {
  const rgb = parseColorHex(hex);
  if (!rgb) return { h: 25, s: 0.85, l: 0.55 };
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s, l };
}

function hslToHexString(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const lig = Math.max(0, Math.min(1, l));
  const a = sat * Math.min(lig, 1 - lig);
  const ch = n => {
    const k = (n + hue / 30) % 12;
    const val = lig - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(val * 255).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(8)}${ch(4)}`;
}

export function resolveBorderColor(mode, customColor, accent, theme = {}) {
  if (mode === "custom") return hexOr(customColor, accent);
  if (mode === "ink") return theme.ink || accent;
  if (mode === "frame") return theme.frame || theme.ink || accent;
  if (mode === "mute") return theme.mute || theme.ink || accent;
  return accent;
}

function dashAttributes(pattern, dash, gap) {
  if (pattern === "dashed") return ` stroke-dasharray="${fmt(dash)} ${fmt(gap)}"`;
  if (pattern === "dotted") return ` stroke-dasharray="0.1 ${fmt(gap)}" stroke-linecap="round"`;
  if (pattern === "dashdot") return ` stroke-dasharray="${fmt(dash)} ${fmt(gap)} 0.1 ${fmt(gap)}" stroke-linecap="round"`;
  return "";
}

export function boxPath(x, y, w, h, corner = "square", size = 0) {
  const r = Math.max(0, Math.min(size, w / 2 - 0.5, h / 2 - 0.5));
  if (corner === "square" || r <= 0.1) {
    return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"`;
  }
  if (corner === "rounded") {
    return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(r)}"`;
  }
  const x2 = x + w, y2 = y + h;
  if (corner === "chamfered") {
    return `<path d="M${fmt(x + r)} ${fmt(y)}H${fmt(x2 - r)}L${fmt(x2)} ${fmt(y + r)}V${fmt(y2 - r)}L${fmt(x2 - r)} ${fmt(y2)}H${fmt(x + r)}L${fmt(x)} ${fmt(y2 - r)}V${fmt(y + r)}Z"`;
  }
  // notched inward square step
  return `<path d="M${fmt(x + r)} ${fmt(y)}H${fmt(x2 - r)}V${fmt(y + r)}H${fmt(x2)}V${fmt(y2 - r)}H${fmt(x2 - r)}V${fmt(y2)}H${fmt(x + r)}V${fmt(y2 - r)}H${fmt(x)}V${fmt(y + r)}H${fmt(x + r)}Z"`;
}

function boxShape(x, y, w, h, corner, size, attrs) {
  return `${boxPath(x, y, w, h, corner, size)}${attrs}/>`;
}

function renderOrnaments(kind, size, ins, CW, CH, col, w, corner, cornerSize) {
  if (!kind || kind === "none") return "";
  const r = size * 0.55;
  const insetAdjust = corner === "rounded" || corner === "chamfered"
    ? Math.min(cornerSize * 0.28, 3.5)
    : 0;
  const corners = [
    [ins + insetAdjust, ins + insetAdjust, 1, 1],
    [CW - ins - insetAdjust, ins + insetAdjust, -1, 1],
    [ins + insetAdjust, CH - ins - insetAdjust, 1, -1],
    [CW - ins - insetAdjust, CH - ins - insetAdjust, -1, -1]
  ];
  return corners.map(([cx, cy, dx, dy]) => {
    const px = fmt(cx), py = fmt(cy);
    if (kind === "dot") return `<circle cx="${px}" cy="${py}" r="${fmt(r * 0.8)}" fill="${col}" stroke="none"/>`;
    if (kind === "diamond") {
      return `<polygon points="${px},${fmt(cy - r)} ${fmt(cx + r)},${py} ${px},${fmt(cy + r)} ${fmt(cx - r)},${py}" fill="${col}" stroke="none"/>`;
    }
    if (kind === "star") {
      const s = r * 1.15;
      return `<path d="M${px} ${fmt(cy - s)}Q${px} ${py} ${fmt(cx + s)} ${py}Q${px} ${py} ${px} ${fmt(cy + s)}Q${px} ${py} ${fmt(cx - s)} ${py}Q${px} ${py} ${px} ${fmt(cy - s)}Z" fill="${col}" stroke="none"/>`;
    }
    if (kind === "cross") {
      return `<path d="M${fmt(cx - r)} ${py}H${fmt(cx + r)}M${px} ${fmt(cy - r)}V${fmt(cy + r)}" stroke="${col}" stroke-width="${fmt(Math.max(0.65, w * 0.65))}" stroke-linecap="round"/>`;
    }
    if (kind === "bracket") {
      const arm = r * 1.5;
      const ox = fmt(cx - dx * 1.3), oy = fmt(cy - dy * 1.3);
      return `<path d="M${ox} ${fmt(cy - dy * 1.3 + dy * arm)}V${oy}H${fmt(cx - dx * 1.3 + dx * arm)}" stroke="${col}" stroke-width="${fmt(Math.max(0.7, w * 0.7))}"/>`;
    }
    return "";
  }).join("");
}

function scallopPath(ins, CW, CH) {
  const bw = CW - 2 * ins;
  const bh = CH - 2 * ins;
  const stepX = bw / Math.max(8, Math.round(bw / 7.0));
  const stepY = bh / Math.max(10, Math.round(bh / 7.0));
  const rx = stepX / 2;
  const ry = stepY / 2;
  const nx = Math.round(bw / stepX);
  const ny = Math.round(bh / stepY);
  let d = `M${fmt(ins)} ${fmt(ins)}`;
  for (let k = 0; k < nx; k++) d += `A${fmt(rx)} ${fmt(rx)} 0 0 1 ${fmt(ins + (k + 1) * stepX)} ${fmt(ins)}`;
  for (let k = 0; k < ny; k++) d += `A${fmt(ry)} ${fmt(ry)} 0 0 1 ${fmt(CW - ins)} ${fmt(ins + (k + 1) * stepY)}`;
  for (let k = 0; k < nx; k++) d += `A${fmt(rx)} ${fmt(rx)} 0 0 1 ${fmt(CW - ins - (k + 1) * stepX)} ${fmt(CH - ins)}`;
  for (let k = 0; k < ny; k++) d += `A${fmt(ry)} ${fmt(ry)} 0 0 1 ${fmt(ins)} ${fmt(CH - ins - (k + 1) * stepY)}`;
  return `${d}Z`;
}

function filmStripMarkup(ins, w, CW, CH, col) {
  const railW = Math.min(5.2, 3.4 + w * 0.55);
  const holeW = Math.max(1.4, railW * 0.48);
  const holeXOff = (railW - holeW) / 2;
  const top = ins, bottom = CH - ins;
  const span = bottom - top - 6;
  const pitch = 7.4;
  const count = Math.max(4, Math.floor(span / pitch));
  const startY = top + (bottom - top - (count - 1) * pitch - 3.6) / 2;
  const holeH = 3.6;

  const rail = x => {
    let d = `M${fmt(x)} ${fmt(top)}H${fmt(x + railW)}V${fmt(bottom)}H${fmt(x)}Z`;
    for (let k = 0; k < count; k++) {
      const hy = startY + k * pitch;
      const hx = x + holeXOff;
      d += ` M${fmt(hx)} ${fmt(hy)}H${fmt(hx + holeW)}V${fmt(hy + holeH)}H${fmt(hx)}Z`;
    }
    return `<path d="${d}" fill="${col}" fill-rule="evenodd" stroke="none" opacity=".88"/>`;
  };
  const ruleW = fmt(Math.max(0.55, w * 0.65));
  const rules = `<path d="M${fmt(ins + railW)} ${fmt(ins)}H${fmt(CW - ins - railW)}M${fmt(ins + railW)} ${fmt(CH - ins)}H${fmt(CW - ins - railW)}" stroke="${col}" stroke-width="${ruleW}" opacity=".72"/>`;
  return rail(ins) + rail(CW - ins - railW) + rules;
}

function grungePaths(ins, CW, CH, w, seed) {
  const rnd = k => {
    const v = Math.sin((seed + 1) * 91.7 + k * 217.3) * 43758.5453;
    return v - Math.floor(v);
  };
  const segs = 16;
  const pts = [];
  const x1 = ins, y1 = ins, x2 = CW - ins, y2 = CH - ins;
  for (let k = 0; k < segs; k++) pts.push([x1 + (x2 - x1) * (k / segs), y1 + (rnd(k) - 0.5) * 1.1]);
  for (let k = 0; k < segs; k++) pts.push([x2 + (rnd(20 + k) - 0.5) * 1.1, y1 + (y2 - y1) * (k / segs)]);
  for (let k = 0; k < segs; k++) pts.push([x2 - (x2 - x1) * (k / segs), y2 + (rnd(40 + k) - 0.5) * 1.1]);
  for (let k = 0; k < segs; k++) pts.push([x1 + (rnd(60 + k) - 0.5) * 1.1, y2 - (y2 - y1) * (k / segs)]);
  const mainD = "M" + pts.map(p => `${fmt(p[0])} ${fmt(p[1])}`).join("L") + "Z";
  const innerD = `M${fmt(x1 + 1.4)} ${fmt(y1 + 1.2)}H${fmt(x2 - 1.4)}V${fmt(y2 - 1.2)}H${fmt(x1 + 1.4)}Z`;
  return `<path d="${mainD}" stroke-width="${fmt(w)}" stroke-linejoin="round"/><path d="${innerD}" stroke-width="${fmt(Math.max(0.55, w * 0.4))}" stroke-dasharray="14 5 7 4" opacity=".65"/>`;
}

function latticeKnotMarkup(ins, w, CW, CH, col, da) {
  const sc = Math.min(1, Math.min(CW, CH) / 100);
  const swMain = fmt(Math.max(0.65, w * 0.95));
  const swWeb = fmt(Math.max(0.55, w * 0.72));
  const swRail = fmt(Math.max(0.5, w * 0.65));
  const arm = 24 * sc;
  const rScroll = 2.1 * sc;
  const rDot = Math.max(0.55, 0.85 * sc);
  let out = "";
  const midStartX = ins + arm + 2.8 * sc;
  const midEndX = CW - ins - arm - 2.8 * sc;
  const midStartY = ins + arm + 2.8 * sc;
  const midEndY = CH - ins - arm - 2.8 * sc;
  if (midEndX > midStartX) {
    out += `<path d="M${fmt(midStartX)} ${fmt(ins)}H${fmt(midEndX)}M${fmt(midStartX)} ${fmt(CH - ins)}H${fmt(midEndX)}" stroke-width="${swRail}" opacity=".85"${da}/>`;
  }
  if (midEndY > midStartY) {
    out += `<path d="M${fmt(ins)} ${fmt(midStartY)}V${fmt(midEndY)}M${fmt(CW - ins)} ${fmt(midStartY)}V${fmt(midEndY)}" stroke-width="${swRail}" opacity=".85"${da}/>`;
  }
  [[ins, ins, 1, 1], [CW - ins, ins, -1, 1], [ins, CH - ins, 1, -1], [CW - ins, CH - ins, -1, -1]].forEach(([bx, by, dx, dy]) => {
    const p = (u, v) => `${fmt(bx + dx * u * sc)} ${fmt(by + dy * v * sc)}`;
    // Outer L-rails terminating in scroll C-hooks with ball finials
    out += `<path d="M${p(0, 24)}V${p(0, 0).split(" ")[1]}H${p(24, 0).split(" ")[0]}" stroke-width="${swMain}" stroke-linecap="round"${da}/>`;
    out += `<path d="M${fmt(bx + dx * (arm - 0.5 * sc))} ${fmt(by - dy * rScroll)}A${fmt(rScroll)} ${fmt(rScroll)} 0 1 ${dx * dy > 0 ? 1 : 0} ${fmt(bx + dx * (arm - 0.5 * sc))} ${fmt(by + dy * rScroll)}" stroke-width="${swWeb}" stroke-linecap="round"/>`;
    out += `<circle cx="${p(23.5, 0).split(" ")[0]}" cy="${by}" r="${fmt(rDot)}" fill="${col}" stroke="none"/>`;
    out += `<path d="M${fmt(bx - dx * rScroll)} ${fmt(by + dy * (arm - 0.5 * sc))}A${fmt(rScroll)} ${fmt(rScroll)} 0 1 ${dx * dy > 0 ? 0 : 1} ${fmt(bx + dx * rScroll)} ${fmt(by + dy * (arm - 0.5 * sc))}" stroke-width="${swWeb}" stroke-linecap="round"/>`;
    out += `<circle cx="${bx}" cy="${p(0, 23.5).split(" ")[1]}" r="${fmt(rDot)}" fill="${col}" stroke="none"/>`;
    // Interlocking 3x3 woven knot inside the corner + inner curved pocket bracket
    out += `<path d="M${p(0, 11.2)}H${fmt(bx + dx * 11.2 * sc)}V${by}M${p(3.2, 0)}V${fmt(by + dy * 8.6 * sc)}H${fmt(bx + dx * 8.6 * sc)}V${fmt(by + dy * 3.2 * sc)}H${bx}M${p(5.9, 0)}V${fmt(by + dy * 11.2 * sc)}M${p(0, 5.9)}H${fmt(bx + dx * 11.2 * sc)}M${p(8.6, 0)}V${fmt(by + dy * 11.2 * sc)}M${p(0, 8.6)}H${fmt(bx + dx * 11.2 * sc)}" stroke-width="${swWeb}" stroke-linecap="square"/>`;
    out += `<path d="M${p(13.2, 3.6)}H${fmt(bx + dx * 18.5 * sc)}L${p(13.2, 8.9)}Z M${p(3.6, 13.2)}V${fmt(by + dy * 18.5 * sc)}L${p(8.9, 13.2)}Z" stroke-width="${fmt(Math.max(0.45, w * 0.6))}" stroke-linejoin="round" opacity=".88"/>`;
  });
  return out;
}

function keyFretMarkup(ins, w, CW, CH, col, da) {
  const sc = Math.min(1, Math.min(CW, CH) / 100);
  const bw = CW - 2 * ins;
  const bh = CH - 2 * ins;
  const innerIns = ins + 2.0 * sc;
  const swOuter = fmt(w);
  const swInner = fmt(Math.max(0.5, w * 0.55));
  const swFret = fmt(Math.max(0.55, w * 0.78));
  let out = `<rect x="${fmt(ins)}" y="${fmt(ins)}" width="${fmt(bw)}" height="${fmt(bh)}" stroke-width="${swOuter}"${da}/>`;
  out += `<rect x="${fmt(innerIns)}" y="${fmt(innerIns)}" width="${fmt(CW - 2 * innerIns)}" height="${fmt(CH - 2 * innerIns)}" stroke-width="${swInner}" opacity=".72"${da}/>`;
  const cornerIn = ins + 3.8 * sc;
  [[cornerIn, cornerIn, 1, 1], [CW - cornerIn, cornerIn, -1, 1], [cornerIn, CH - cornerIn, 1, -1], [CW - cornerIn, CH - cornerIn, -1, -1]].forEach(([bx, by, dx, dy]) => {
    const x = u => fmt(bx + dx * u * sc);
    const y = v => fmt(by + dy * v * sc);
    // Asymmetric stepped Chinese meander key-fret hooks in all 4 corners
    out += `<path d="M${x(0)} ${y(15.5)}V${by}H${x(18.5)}V${y(5.5)}H${x(14)}V${y(2.8)}H${x(16.3)}" stroke-width="${swFret}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    out += `<path d="M${x(5.8)} ${y(0)}V${y(10.8)}H${x(2.6)}V${y(15.5)}H${x(7.4)}V${y(12.6)}H${x(4.9)}" stroke-width="${swFret}" stroke-linecap="square" stroke-linejoin="miter"/>`;
    out += `<path d="M${x(9.2)} ${y(0)}V${y(6.2)}H${x(11.8)}V${y(2.8)}H${x(9.2)}" stroke-width="${fmt(Math.max(0.45, w * 0.65))}" stroke-linecap="square" opacity=".88"/>`;
  });
  return out;
}

function inkFilterDef(id, seed, wear) {
  if (wear <= 0) return "";
  return `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${seed}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="r"/><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed + 8}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.4 0 0 0 -${(0.15 + wear / 100 * 1.1).toFixed(2)}" result="g"/><feComposite in="r" in2="g" operator="in"/></filter>`;
}

function glowFilterDef(id, glow) {
  if (glow <= 0) return "";
  const dev = Math.max(0.6, (glow / 100) * 3.0).toFixed(2);
  return `<filter id="${id}" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${dev}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

function holoGradientDef(id, baseHex, theme = {}) {
  const { h, s } = hexToHsl(baseHex);
  const sat = Math.max(0.72, s);
  const s0 = hslToHexString(h, sat, 0.58);
  const s1 = hslToHexString(h + 55, sat, 0.64);
  const s2 = mixHex(hslToHexString(h + 135, sat, 0.66), theme.hi || "#ffffff", 0.25);
  const s3 = hslToHexString(h + 220, sat, 0.60);
  const s4 = hslToHexString(h + 305, sat, 0.62);
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${s0}"/><stop offset="25%" stop-color="${s1}"/><stop offset="50%" stop-color="${s2}"/><stop offset="75%" stop-color="${s3}"/><stop offset="100%" stop-color="${s4}"/></linearGradient>`;
}

function innerSpanOffset(styleId, lineGap) {
  if (styleId === 0 || styleId === 4 || styleId === 6 || styleId === 9) return lineGap;
  if (styleId === 5) return lineGap * 2;
  if (styleId === 10) return 4.0;
  if (styleId === 11) return 2.2;
  return 0;
}

export function renderBorder({ index = 0, CW = 170, CH = 239, accent = "#ff5a36", theme = {}, border, scope = "", seed = index + 21 }) {
  const b = border || resolveBorderConfig({ borderStyle: 0, borderWear: 35 }, null);
  const bs = b.style;
  const scopePrefix = scope ? `${scope}-` : "";
  const bdId = `bd${scopePrefix}${index}`;
  const glowId = `bgl${scopePrefix}${index}`;
  const gradId = `bgd${scopePrefix}${index}`;

  if (bs === 15) {
    return { defs: "", markup: "", isLegacy: false };
  }

  // Exact legacy fast path when style is 0..4 with default customisation and no scope prefix
  if (!scope && bs >= 0 && bs <= 4 && !hasBorderOverrides(b)) {
    const f = n => `<g${b.wear > 0 ? ` filter="url(#bd${index})"` : ""} fill="none" stroke="${accent}">${n}</g>`;
    let markup;
    if (bs === 1) markup = f(`<rect x="3" y="3" width="${CW - 6}" height="${CH - 6}" stroke-width="2.6"/>`);
    else if (bs === 2) {
      let o = "";
      [[3, 3, 1, 1], [CW - 3, 3, -1, 1], [3, CH - 3, 1, -1], [CW - 3, CH - 3, -1, -1]].forEach(([bx, by, dx, dy]) => {
        o += `<path d="M${bx} ${by + dy * 22}V${by}H${bx + dx * 22}" stroke-width="2.2"/>`;
      });
      markup = f(o);
    }
    else if (bs === 3) markup = f(`<rect x="4" y="4" width="${CW - 8}" height="${CH - 8}" stroke-width="1.1" stroke-dasharray="4 2.5"/>`);
    else if (bs === 4) markup = f(`<rect x="2.5" y="2.5" width="${CW - 5}" height="${CH - 5}" rx="9" stroke-width="1.5"/><rect x="5.8" y="5.8" width="${CW - 11.6}" height="${CH - 11.6}" rx="6" stroke-width=".7" opacity=".8"/>`);
    else markup = f(`<rect x="2.5" y="2.5" width="${CW - 5}" height="${CH - 5}" stroke-width="1.5"/><rect x="5.8" y="5.8" width="${CW - 11.6}" height="${CH - 11.6}" stroke-width=".7" opacity=".8"/>`);
    return { defs: "", markup, isLegacy: true };
  }

  const col = resolveBorderColor(b.colorMode, b.color, accent, theme);
  const strokeCol = bs === 13 ? `url(#${gradId})` : col;
  const w = b.width;
  const ins = b.inset;
  const bw = CW - 2 * ins;
  const bh = CH - 2 * ins;
  const lg = b.lineGap;
  const da = dashAttributes(b.pattern, b.dash, b.gap);
  const corner = b.corner;
  const cr = b.cornerSize;
  const meta = getBorderStyleMeta(bs);
  const effectiveWear = b.wear;

  let defs = "";
  if (effectiveWear > 0) defs += inkFilterDef(bdId, seed, effectiveWear);
  if (b.glow > 0) defs += glowFilterDef(glowId, b.glow);
  if (bs === 13) defs += holoGradientDef(gradId, col, theme);

  let body = "";
  if (bs === 0 || bs === 4) {
    const innerIns = ins + lg;
    const innerW = Math.max(0.45, w * (0.7 / 1.5));
    const innerCr = Math.max(0, cr - lg);
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w)}"${da}`);
    body += boxShape(innerIns, innerIns, CW - 2 * innerIns, CH - 2 * innerIns, corner, innerCr, ` stroke-width="${fmt(innerW)}" opacity=".8"${da}`);
  } else if (bs === 1 || bs === 3) {
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w)}"${da}`);
  } else if (bs === 2) {
    const arm = 22;
    [[ins, ins, 1, 1], [CW - ins, ins, -1, 1], [ins, CH - ins, 1, -1], [CW - ins, CH - ins, -1, -1]].forEach(([bx, by, dx, dy]) => {
      body += `<path d="M${fmt(bx)} ${fmt(by + dy * arm)}V${fmt(by)}H${fmt(bx + dx * arm)}" stroke-width="${fmt(w)}"${da}/>`;
    });
  } else if (bs === 5) {
    const w1 = Math.max(0.45, w * 0.75);
    const w2 = Math.max(0.45, w * 1.25);
    const w3 = Math.max(0.45, w * 0.5);
    [
      [ins, w1, 1],
      [ins + lg, w2, 1],
      [ins + lg * 2, w3, 0.75]
    ].forEach(([off, sw, op]) => {
      body += boxShape(off, off, CW - 2 * off, CH - 2 * off, corner, Math.max(0, cr - (off - ins)), ` stroke-width="${fmt(sw)}"${op < 1 ? ` opacity="${op}"` : ""}${da}`);
    });
  } else if (bs === 6) {
    const innerIns = ins + lg;
    const innerW = Math.max(0.5, w * 0.25);
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w)}"${da}`);
    body += boxShape(innerIns, innerIns, CW - 2 * innerIns, CH - 2 * innerIns, corner, Math.max(0, cr - lg), ` stroke-width="${fmt(innerW)}" opacity=".8"${da}`);
    const sq = Math.max(2.6, w * 1.2);
    const pad = corner === "rounded" || corner === "chamfered" ? Math.min(cr * 0.35, 3) : 0;
    [[ins + pad, ins + pad], [CW - ins - sq - pad, ins + pad], [ins + pad, CH - ins - sq - pad], [CW - ins - sq - pad, CH - ins - sq - pad]].forEach(([rx, ry]) => {
      body += `<rect x="${fmt(rx)}" y="${fmt(ry)}" width="${fmt(sq)}" height="${fmt(sq)}" fill="${col}" stroke="none"/>`;
    });
  } else if (bs === 7) {
    const hl = ins + 2.2;
    body += `<rect x="${fmt(hl)}" y="${fmt(hl)}" width="${fmt(CW - 2 * hl)}" height="${fmt(CH - 2 * hl)}" stroke-width="${fmt(Math.max(0.55, w * 0.5))}" opacity=".7"${da}/>`;
    [[ins, ins, 1, 1], [CW - ins, ins, -1, 1], [ins, CH - ins, 1, -1], [CW - ins, CH - ins, -1, -1]].forEach(([bx, by, dx, dy]) => {
      body += `<path d="M${fmt(bx)} ${fmt(by + dy * 20)}V${fmt(by)}H${fmt(bx + dx * 20)}" stroke-width="${fmt(w)}"${da}/>`;
      body += `<path d="M${fmt(bx + dx * 2.5)} ${fmt(by + dy * 13.5)}V${fmt(by + dy * 2.5)}H${fmt(bx + dx * 13.5)}" stroke-width="${fmt(Math.max(0.55, w * 0.65))}"/>`;
      body += `<path d="M${fmt(bx)} ${fmt(by + dy * 5.2)}L${fmt(bx + dx * 5.2)} ${fmt(by)}" stroke-width="${fmt(Math.max(0.55, w * 0.75))}"/>`;
    });
  } else if (bs === 8) {
    const hl = ins + 1.5;
    body += `<rect x="${fmt(hl)}" y="${fmt(hl)}" width="${fmt(CW - 2 * hl)}" height="${fmt(CH - 2 * hl)}" stroke-width="${fmt(Math.max(0.6, w * 0.65))}" opacity=".72"${da}/>`;
    [[ins, ins, 1, 1], [CW - ins, ins, -1, 1], [ins, CH - ins, 1, -1], [CW - ins, CH - ins, -1, -1]].forEach(([bx, by, dx, dy]) => {
      body += `<path d="M${fmt(bx)} ${fmt(by + dy * 4)}C${fmt(bx + dx * 5)} ${fmt(by)},${fmt(bx + dx * 11)} ${fmt(by + dy * 5)},${fmt(bx + dx * 17)} ${fmt(by + dy * 1.4)}C${fmt(bx + dx * 19.5)} ${fmt(by + dy * 0.4)},${fmt(bx + dx * 18.5)} ${fmt(by + dy * 4.4)},${fmt(bx + dx * 14.5)} ${fmt(by + dy * 4.2)}" stroke-width="${fmt(w)}" stroke-linecap="round"/>`;
      body += `<path d="M${fmt(bx + dx * 4)} ${fmt(by)}C${fmt(bx)} ${fmt(by + dy * 5)},${fmt(bx + dx * 5)} ${fmt(by + dy * 11)},${fmt(bx + dx * 1.4)} ${fmt(by + dy * 17)}C${fmt(bx + dx * 0.4)} ${fmt(by + dy * 19.5)},${fmt(bx + dx * 4.4)} ${fmt(by + dy * 18.5)},${fmt(bx + dx * 4.2)} ${fmt(by + dy * 14.5)}" stroke-width="${fmt(w)}" stroke-linecap="round"/>`;
      body += `<circle cx="${fmt(bx + dx * 2.2)}" cy="${fmt(by + dy * 2.2)}" r="${fmt(Math.max(0.7, w * 0.75))}" fill="${col}" stroke="none"/>`;
    });
  } else if (bs === 9) {
    const stitchDa = ` stroke-dasharray="3.2 2.2" stroke-linecap="round"`;
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w)}"${stitchDa}`);
    const innerIns = ins + lg;
    body += boxShape(innerIns, innerIns, CW - 2 * innerIns, CH - 2 * innerIns, corner, Math.max(0, cr - lg), ` stroke-width="${fmt(Math.max(0.5, w * 0.55))}" opacity=".55"${stitchDa}`);
  } else if (bs === 10) {
    body += filmStripMarkup(ins, w, CW, CH, col);
  } else if (bs === 11) {
    body += `<path d="${scallopPath(ins, CW, CH)}" stroke-width="${fmt(w)}" stroke-linejoin="round"/>`;
  } else if (bs === 12) {
    body += grungePaths(ins, CW, CH, w, seed);
  } else if (bs === 13) {
    const innerIns = ins + 2.8;
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w)}"${da}`);
    body += boxShape(innerIns, innerIns, CW - 2 * innerIns, CH - 2 * innerIns, corner, Math.max(0, cr - 2.8), ` stroke-width="${fmt(Math.max(0.5, w * 0.35))}" opacity=".68"${da}`);
  } else if (bs === 14) {
    const coreCol = mixHex(col, "#ffffff", 0.65);
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke-width="${fmt(w * 1.35)}"${da}`);
    body += boxShape(ins, ins, bw, bh, corner, cr, ` stroke="${coreCol}" stroke-width="${fmt(Math.max(0.6, w * 0.48))}"${da}`);
  } else if (bs === 16) {
    body += latticeKnotMarkup(ins, w, CW, CH, col, da);
  } else if (bs === 17) {
    body += keyFretMarkup(ins, w, CW, CH, col, da);
  }

  if (b.inner && meta.supports.inner) {
    const span = innerSpanOffset(bs, lg);
    const iIns = Math.min(13.5, ins + span + b.innerGap);
    const iCol = resolveBorderColor(b.innerColorMode, b.innerColor, accent, theme);
    const iCorner = meta.supports.corner ? corner : "square";
    const iCr = Math.max(0, cr - (iIns - ins));
    body += boxShape(iIns, iIns, CW - 2 * iIns, CH - 2 * iIns, iCorner, iCr, ` stroke="${iCol}" stroke-width="${fmt(b.innerWidth)}"`);
  }

  if (b.ornament !== "none" && meta.supports.ornament) {
    body += renderOrnaments(b.ornament, b.ornamentSize, ins, CW, CH, col, w, corner, cr);
  }

  const opacityAttr = b.opacity < 100 ? ` opacity="${(b.opacity / 100).toFixed(2)}"` : "";
  const wearFilter = effectiveWear > 0 ? ` filter="url(#${bdId})"` : "";
  const glowFilter = b.glow > 0 ? ` filter="url(#${glowId})"` : "";

  let innerGroup = `<g${wearFilter} fill="none" stroke="${strokeCol}">${body}</g>`;
  if (glowFilter) {
    innerGroup = `<g${glowFilter}>${innerGroup}</g>`;
  }
  const markup = opacityAttr ? `<g${opacityAttr}>${innerGroup}</g>` : innerGroup;

  return { defs, markup, isLegacy: false };
}

export function renderBorderSwatchSvg(styleId, accent = "#ff5a36", theme = {}) {
  const meta = getBorderStyleMeta(styleId);
  const bg = theme.bg || "#1f1c1a";
  const ink = theme.ink || "#f1ece8";
  const border = {
    ...meta.defaults,
    style: meta.id,
    wear: meta.id === 12 ? 45 : 0
  };
  const { defs, markup } = renderBorder({
    index: meta.id,
    CW: 76,
    CH: 56,
    accent,
    theme,
    border,
    scope: "sw",
    seed: meta.id + 41
  });
  const emptyMarker = meta.id === 15
    ? `<path d="M14 44L62 12" stroke="${ink}" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="3 2.5"/>`
    : `<rect x="16" y="15" width="44" height="26" rx="1" fill="${ink}" fill-opacity=".1"/>`;
  return `<svg viewBox="0 0 76 56" width="76" height="56" aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ""}<rect width="76" height="56" rx="3" fill="${bg}"/>${emptyMarker}${markup}</svg>`;
}

export function getBorderPresets() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = JSON.parse(localStorage.getItem(BORDER_PRESETS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && typeof item.id === "string" && typeof item.name === "string" && item.border && typeof item.border === "object");
  } catch {
    return [];
  }
}

export function saveBorderPresetsList(list) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(BORDER_PRESETS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function uniquePresetName(name, existingNames = []) {
  const base = String(name || "").trim().slice(0, 48) || "Border preset";
  const existing = new Set(existingNames.map(n => String(n || "").trim().toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;
  for (let v = 2; ; v++) {
    const suffix = ` (${v})`;
    const candidate = `${base.slice(0, 48 - suffix.length).trimEnd()}${suffix}`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
  }
}

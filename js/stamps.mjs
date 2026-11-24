// Stamp shapes, custom style resolution, placement math, presets & swatch renderer

export const STAMP_MIN_NORM = -0.04;
export const STAMP_MAX_NORM = 1.04;
export const STAMP_MIN_SCALE = 0.4;
export const STAMP_MAX_SCALE = 2.5;
export const STAMP_PRESETS_KEY = "ticketgen.stampPresets.v1";

const star = (n, ro, ri) => {
  const p = [];
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? ri : ro, a = Math.PI * k / n;
    p.push((r * Math.sin(a)).toFixed(2) + "," + (-r * Math.cos(a)).toFixed(2));
  }
  return p.join(" ");
};

const hexp = r => [0, 1, 2, 3, 4, 5].map(k => {
  const a = Math.PI / 3 * k;
  return (r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2);
}).join(" ");

const defStamp = (name, outer, inner, extras) => ({
  name,
  outer,
  inner,
  o: outer + inner,
  ...extras
});

export const STAMPS = {
  round: defStamp("Round", '<circle r="17" stroke-width="1"/>', '<circle r="14.5" stroke-width=".5"/>', { yr: -5, nm: 3, w: 22, r: "M-7 7h14" }),
  oval: defStamp("Oval", '<ellipse rx="19" ry="12" stroke-width="1"/>', '<ellipse rx="16.5" ry="9.5" stroke-width=".5"/>', { yr: -2.5, nm: 4, w: 24, r: "M-7 6.5h14" }),
  rect: defStamp("Rectangle", '<rect x="-19" y="-11" width="38" height="22" rx="1.5" stroke-width="1"/>', '<rect x="-16.5" y="-8.5" width="33" height="17" rx="1" stroke-width=".5"/>', { yr: -2.5, nm: 5, w: 30 }),
  tri: defStamp("Triangle", '<path d="M0 -19L18 12H-18Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M0 -14.9L14.4 9.9H-14.4Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: 1, nm: 7.2, w: 19, ys: 3.4 }),
  shield: defStamp("Shield", '<path d="M-14 -15H14V2Q14 12 0 18Q-14 12 -14 2Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-11.5 -12.5H11.5V1.5Q11.5 9.5 0 14.8Q-11.5 9.5 -11.5 1.5Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -6, nm: 1, w: 20, r: "M-6 4.5h12" }),
  hex: defStamp("Hexagon", `<polygon points="${hexp(17)}" stroke-width="1" stroke-linejoin="round"/>`, `<polygon points="${hexp(14.5)}" stroke-width=".5" stroke-linejoin="round"/>`, { yr: -5, nm: 3, w: 22, r: "M-7 7h14" }),
  diamond: defStamp("Diamond", '<path d="M0 -19L19 0L0 19L-19 0Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M0 -15.6L15.6 0L0 15.6L-15.6 0Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -4.5, nm: 2.5, w: 20, r: "M-4.5 6.5h9" }),
  seal: defStamp("Seal", `<polygon points="${star(16, 17.6, 15.2)}" stroke-width=".9" stroke-linejoin="round"/>`, '<circle r="12.8" stroke-width=".5"/>', { yr: -4.5, nm: 3, w: 19, r: "M-6 6.5h12" }),
  starburst: defStamp("Starburst", `<polygon points="${star(12, 20, 14.5)}" stroke-width="1" stroke-linejoin="round"/>`, '<circle r="12" stroke-width=".5"/>', { yr: -4.5, nm: 3.5, w: 20, r: "M-6.5 7h13" }),
  scallop: defStamp("Scalloped", `<polygon points="${star(20, 17.8, 16.2)}" stroke-width=".9" stroke-linejoin="round"/>`, '<circle r="13.5" stroke-width=".5"/>', { yr: -5, nm: 3, w: 20, r: "M-6 7h12" }),
  ticket: defStamp("Ticket", '<path d="M-20 -12H20V-7A7 7 0 0 0 20 7V12H-20V7A7 7 0 0 0-20-7Z" stroke-width="1" stroke-linejoin="round"/>', '<rect x="-16.5" y="-8.5" width="33" height="17" rx="2" stroke-width=".5"/><path d="M-12 -5V5M12 -5V5" stroke-width=".5"/>', { yr: -3, nm: 5.5, w: 27, r: "M-7 8h14" }),
  arch: defStamp("Arch", '<path d="M-18 13V-3A18 18 0 0 1 18-3V13Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-14.5 10V-2A14.5 14.5 0 0 1 14.5-2V10Z" stroke-width=".5"/>', { yr: -5, nm: 3, w: 21, r: "M-6 6.5h12" }),
  ribbon: defStamp("Ribbon", '<path d="M-18 -12H18V8H7L4 14L0 8H-18Z" stroke-width="1" stroke-linejoin="round"/>', '<rect x="-15" y="-9" width="30" height="14" rx="1" stroke-width=".5"/>', { yr: -4, nm: 4.5, w: 25, r: "M-7 7h14" }),
  burst: defStamp("Sunburst", `<polygon points="${star(16, 21, 17)}" stroke-width=".9" stroke-linejoin="round"/>`, '<circle r="13" stroke-width=".5"/>', { yr: -4.5, nm: 3.5, w: 19, r: "M-6 7h12" }),
  cross: defStamp("Cross", '<path d="M-7 -18H7V-7H18V7H7V18H-7V7H-18V-7H-7Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-4.5 -14.5H4.5V-4.5H14.5V4.5H4.5V14.5H-4.5V4.5H-14.5V-4.5H-4.5Z" stroke-width=".5"/>', { yr: -4.5, nm: 3.5, w: 19, r: "M-5.5 7h11" }),
  vinyl: defStamp("Vinyl", '<circle r="18" stroke-width="1"/>', '<path d="M-15.4 0A15.4 15.4 0 0 1 0-15.4M15.4 0A15.4 15.4 0 0 1 0 15.4" stroke-width=".45" stroke-linecap="round"/><circle r="13.2" stroke-width=".55"/>', { yr: -4.5, nm: 3, w: 20, r: "M-6 6.5h12" }),
  pick: defStamp("Guitar pick", '<path d="M0 -18C14 -18 19 -8 14 5C10 14 4 19 0 19C-4 19 -10 14 -14 5C-19 -8 -14 -18 0 -18Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M0 -14.5C11 -14.5 15 -6.5 11 4C7.8 11.2 3.2 15.2 0 15.2C-3.2 15.2 -7.8 11.2 -11 4C-15 -6.5 -11 -14.5 0 -14.5Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -6, nm: 1.5, w: 20, r: "M-5.5 5.5h11" }),
  octagon: defStamp("Octagon", '<path d="M-7.2 -17.5H7.2L17.5 -7.2V7.2L7.2 17.5H-7.2L-17.5 7.2V-7.2Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-5.8 -14.2H5.8L14.2 -5.8V5.8L5.8 14.2H-5.8L-14.2 5.8V-5.8Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -5, nm: 3, w: 22, r: "M-7 7h14" }),
  banner: defStamp("Banner", '<path d="M-20 -11H20L16 0L20 11H-20L-16 0Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-16.5 -8H16.5L13.5 0L16.5 8H-16.5L-13.5 0Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -2.5, nm: 4.5, w: 24 }),
  badge: defStamp("Star badge", '<path d="M-16 -12H-5L0 -18L5 -12H16V4Q16 13 0 18Q-16 13 -16 4Z" stroke-width="1" stroke-linejoin="round"/>', '<path d="M-13 -9.5H13V3.2Q13 10.2 0 14.6Q-13 10.2 -13 3.2Z" stroke-width=".5" stroke-linejoin="round"/>', { yr: -4, nm: 3, w: 21, r: "M-6 6.5h12" }),
  bolt: defStamp("Rock bolt", '<path d="M-18 -13H10L13 -18L19 -10L15 -6V13H-18Z" stroke-width="1" stroke-linejoin="round"/>', '<rect x="-15" y="-10" width="27" height="20" rx="1" stroke-width=".5"/><path d="M13.5 -15L11 -11H14L12 -7" stroke-width=".7" stroke-linejoin="round"/>', { yr: -4, nm: 3.5, w: 22, r: "M-7 6.5h14" })
};

export const SKINDS = Object.keys(STAMPS);

export const STAMP_OPTIONS = [
  ...SKINDS.map(id => ({ id, name: STAMPS[id].name })),
  { id: "mixed", name: "Mixed" },
  { id: "none", name: "None" }
];

export const STAMP_FILL_MODES = [
  { id: "outline", name: "Outline" },
  { id: "tinted", name: "Tinted wash" },
  { id: "solid", name: "Solid badge" }
];

export const STAMP_PATTERNS = [
  { id: "solid", name: "Solid" },
  { id: "dashed", name: "Dashed" },
  { id: "dotted", name: "Dotted" }
];

export const STAMP_STYLE_DEFAULTS = Object.freeze({
  fillMode: "outline",
  weight: 1,
  pattern: "solid",
  opacity: 95,
  innerRing: true,
  showYear: true
});

const STAMP_STYLE_KEYS = ["fillMode", "weight", "pattern", "opacity", "innerRing", "showYear"];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const U = t => esc(String(t).toUpperCase());
const fit = (t, max, w, k = 0.64) => Math.max(3.4, Math.min(max, w / (Math.max(t.length, 1) * k))).toFixed(1);
const FT = 'font-family="Montserrat,Arial,sans-serif"';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(deg) {
  const n = Number(deg);
  if (!Number.isFinite(n)) return 0;
  let wrapped = ((n + 180) % 360 + 360) % 360 - 180;
  if (wrapped === -180) wrapped = 180;
  return Math.round(wrapped * 10) / 10;
}

export function clampStampNorm(nx, ny) {
  return {
    nx: clamp(Number(nx) || 0, STAMP_MIN_NORM, STAMP_MAX_NORM),
    ny: clamp(Number(ny) || 0, STAMP_MIN_NORM, STAMP_MAX_NORM)
  };
}

export function clampStampScale(scale) {
  const n = Number(scale);
  return Number.isFinite(n) ? clamp(n, STAMP_MIN_SCALE, STAMP_MAX_SCALE) : 1;
}

export function sanitizeStampStyle(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  if (raw.fillMode !== undefined && ["outline", "tinted", "solid"].includes(raw.fillMode)) {
    out.fillMode = raw.fillMode;
  }
  if (raw.weight !== undefined && Number.isFinite(Number(raw.weight))) {
    out.weight = Number(clamp(Number(raw.weight), 0.6, 2.0).toFixed(2));
  }
  if (raw.pattern !== undefined && ["solid", "dashed", "dotted"].includes(raw.pattern)) {
    out.pattern = raw.pattern;
  }
  if (raw.opacity !== undefined && Number.isFinite(Number(raw.opacity))) {
    out.opacity = Math.round(clamp(Number(raw.opacity), 35, 100));
  }
  if (raw.innerRing !== undefined) out.innerRing = Boolean(raw.innerRing);
  if (raw.showYear !== undefined) out.showYear = Boolean(raw.showYear);
  return Object.keys(out).length ? out : undefined;
}

export function compactStampStyle(raw) {
  const clean = sanitizeStampStyle(raw) || {};
  const out = {};
  for (const key of STAMP_STYLE_KEYS) {
    if (clean[key] !== undefined && clean[key] !== STAMP_STYLE_DEFAULTS[key]) {
      out[key] = clean[key];
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function resolveStampStyle(settings = {}, card = null) {
  const sheetStyle = sanitizeStampStyle(settings.stampStyle) || {};
  const cardStyle = sanitizeStampStyle(card?.stampStyle) || {};
  const cardChangesShape = Boolean(card?.sk && card.sk !== (settings.stampShape || "round"));
  return {
    ...STAMP_STYLE_DEFAULTS,
    ...(cardChangesShape ? {} : sheetStyle),
    ...cardStyle
  };
}

export function hasStampStyleOverrides(resolved) {
  if (!resolved) return false;
  return STAMP_STYLE_KEYS.some(key => resolved[key] !== undefined && resolved[key] !== STAMP_STYLE_DEFAULTS[key]);
}

function scaleStrokeWidths(svgMarkup, mult) {
  if (Math.abs(mult - 1) < 0.01) return svgMarkup;
  return svgMarkup.replace(/stroke-width="([^"]+)"/g, (_, raw) => {
    const val = Math.max(0.35, Number(raw) * mult);
    return `stroke-width="${Number(val.toFixed(2))}"`;
  });
}

function contrastInk(hex, themeBg) {
  let clean = String(hex || "").trim().replace("#", "");
  if (clean.length === 3) clean = clean.replace(/./g, "$&$&");
  if (!/^[\da-f]{6}$/i.test(clean)) return themeBg || "#ffffff";
  const n = parseInt(clean, 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  if (lum > 0.52) return "#141211";
  return themeBg && !themeBg.startsWith("#0") && !themeBg.startsWith("#1") && !themeBg.startsWith("#2") ? themeBg : "#ffffff";
}

function stampDashAttrs(pattern) {
  if (pattern === "dashed") return ' stroke-dasharray="3.2 2.2"';
  if (pattern === "dotted") return ' stroke-dasharray="0.2 2.2" stroke-linecap="round"';
  return "";
}

export function renderStampMarkup({
  shapeKey = "round",
  text = "Soul Fuel",
  year = "2026",
  scale = 1,
  px = 85,
  py = 152,
  rotation = 0,
  color = "#d9322f",
  wear = 0,
  filterId = "",
  idAttr = "",
  style = null,
  themeBg = "#ffffff"
}) {
  const d = STAMPS[shapeKey] || STAMPS.round;
  const resolved = style ? { ...STAMP_STYLE_DEFAULTS, ...style } : STAMP_STYLE_DEFAULTS;
  const filterAttr = wear > 0 && filterId ? ` filter="url(#${filterId})"` : "";
  const idPart = idAttr ? ` id="${idAttr}"` : "";

  if (!hasStampStyleOverrides(resolved)) {
    return `<g${idPart}${filterAttr} transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${scale})" fill="none" stroke="${color}" opacity=".95">${d.o}${year ? `<text y="${d.yr}" text-anchor="middle" fill="${color}" stroke="none" font-size="${d.ys || 4}" font-weight="700" ${FT}>${U(year)}</text>` : ""}<text y="${d.nm}" text-anchor="middle" fill="${color}" stroke="none" font-size="${fit(text, 5.4, d.w, 0.7)}" font-weight="800" ${FT}>${U(text)}</text>${d.r ? `<path d="${d.r}" stroke-width=".5"/>` : ""}</g>`;
  }

  const isSolid = resolved.fillMode === "solid";
  const isTinted = resolved.fillMode === "tinted";
  const fg = isSolid ? contrastInk(color, themeBg) : color;
  const opStr = (resolved.opacity / 100).toFixed(2).replace(/^0/, "");
  const dashAttr = stampDashAttrs(resolved.pattern);
  const outerShape = scaleStrokeWidths(d.outer, resolved.weight);
  const innerShape = resolved.innerRing ? scaleStrokeWidths(d.inner, resolved.weight) : "";
  const ruleW = Number(Math.max(0.35, 0.5 * resolved.weight).toFixed(2));

  let frame = "";
  if (isTinted) {
    frame += `<g fill="${color}" fill-opacity=".14" stroke="none">${d.outer}</g>`;
  } else if (isSolid) {
    frame += `<g fill="${color}" stroke="${color}"${dashAttr}>${outerShape}</g>`;
  }
  if (!isSolid) {
    frame += `<g${dashAttr}>${outerShape}</g>`;
  }
  if (innerShape) {
    frame += `<g stroke="${fg}"${dashAttr}>${innerShape}</g>`;
  }

  const yearMarkup = resolved.showYear && year
    ? `<text y="${d.yr}" text-anchor="middle" fill="${fg}" stroke="none" font-size="${d.ys || 4}" font-weight="700" ${FT}>${U(year)}</text>`
    : "";
  const nameMarkup = `<text y="${d.nm}" text-anchor="middle" fill="${fg}" stroke="none" font-size="${fit(text, 5.4, d.w, 0.7)}" font-weight="800" ${FT}>${U(text)}</text>`;
  const ruleMarkup = d.r ? `<path d="${d.r}" stroke="${fg}" stroke-width="${ruleW}"/>` : "";

  return `<g${idPart}${filterAttr} transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${scale})" fill="none" stroke="${color}" opacity="${opStr}">${frame}${yearMarkup}${nameMarkup}${ruleMarkup}</g>`;
}

export function renderStampSwatchSvg(shapeKey, accent = "#d9322f", theme = {}, style = null) {
  const bg = theme.bg || "#1f1c1a";
  const ink = theme.ink || "#f1ece8";
  let body = "";
  if (shapeKey === "none") {
    body = `<path d="M-16 14L16 -14" stroke="${ink}" stroke-opacity=".35" stroke-width="1.4" stroke-dasharray="3 2.5"/>`;
  } else if (shapeKey === "mixed") {
    body = `<g fill="none" stroke="${accent}" stroke-width="1.1"><circle cx="-9" cy="-7" r="6.5"/><polygon points="9,-14 16,-7 9,0 2,-7"/><rect x="-15.5" y="2.5" width="13" height="9" rx="1.2"/><path d="M9 1L14.5 11.5H3.5Z"/></g>`;
  } else {
    body = renderStampMarkup({
      shapeKey,
      text: "LIVE",
      year: "26",
      scale: 0.96,
      px: 0,
      py: 0,
      rotation: 0,
      color: accent,
      wear: 0,
      style,
      themeBg: bg
    });
  }
  return `<svg viewBox="-24 -22 48 44" width="60" height="55" aria-hidden="true"><rect x="-24" y="-22" width="48" height="44" rx="3" fill="${bg}"/>${body}</svg>`;
}

export function getStampShapeName(shapeKey) {
  if (shapeKey === "mixed") return "Mixed";
  if (shapeKey === "none") return "None";
  return STAMPS[shapeKey]?.name || "Round";
}

export function getStampPresets() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = JSON.parse(localStorage.getItem(STAMP_PRESETS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && typeof item.id === "string" && typeof item.name === "string" && item.stamp && typeof item.stamp === "object");
  } catch {
    return [];
  }
}

export function saveStampPresetsList(list) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(STAMP_PRESETS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function uniqueStampPresetName(name, existingNames = []) {
  const base = String(name || "").trim().slice(0, 48) || "Stamp preset";
  const existing = new Set(existingNames.map(n => String(n || "").trim().toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;
  for (let v = 2; ; v++) {
    const suffix = ` (${v})`;
    const candidate = `${base.slice(0, 48 - suffix.length).trimEnd()}${suffix}`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
  }
}

export function autoStampGeometry({ index = 0, stampIndex = 0, CH = 239, stampSize = 100 }) {
  const D = CH - 239;
  const PX = 17, PY = 16, PS = 136, PH = 136 + D, PB = PY + PH;
  const ss = (stampSize || 100) / 100;
  const rr = 17 * ss;
  const rn = k => {
    const v = Math.sin((index + 1) * 127.1 + k * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  if (stampIndex === 1) {
    return {
      x: PX + 30 + rn(8) * (PS - 60),
      y: PB + 32 + rn(9) * 26,
      r: (rn(10) - 0.5) * 30,
      scale: ss * 0.85
    };
  }
  return {
    x: PX + rr * 0.6 + rn(1) * (PS - rr * 1.2),
    y: PB + (rn(2) - 0.5) * 8,
    r: (rn(3) - 0.5) * 50,
    scale: ss
  };
}

export function resolveStampTransform({ index = 0, stampIndex = 0, CW = 170, CH = 239, stampSize = 100, override = null }) {
  const auto = autoStampGeometry({ index, stampIndex, CH, stampSize });
  const hasOverride = Boolean(
    override && typeof override === "object"
    && (Number.isFinite(override.x) || Number.isFinite(override.y) || Number.isFinite(override.r) || Number.isFinite(override.scale))
  );
  if (!hasOverride) {
    return {
      x: auto.x,
      y: auto.y,
      r: auto.r,
      scale: auto.scale,
      nx: auto.x / CW,
      ny: auto.y / CH,
      mult: 1,
      isOverridden: false
    };
  }
  const nx = Number.isFinite(override.x) ? clamp(override.x, STAMP_MIN_NORM, STAMP_MAX_NORM) : auto.x / CW;
  const ny = Number.isFinite(override.y) ? clamp(override.y, STAMP_MIN_NORM, STAMP_MAX_NORM) : auto.y / CH;
  const r = Number.isFinite(override.r) ? normalizeAngle(override.r) : auto.r;
  const mult = Number.isFinite(override.scale) ? clampStampScale(override.scale) : 1;
  return {
    x: nx * CW,
    y: ny * CH,
    r,
    scale: auto.scale * mult,
    nx,
    ny,
    mult,
    isOverridden: true
  };
}

export function sanitizeStampOverride(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  if (Number.isFinite(Number(raw.x))) out.x = Number(clamp(Number(raw.x), STAMP_MIN_NORM, STAMP_MAX_NORM).toFixed(4));
  if (Number.isFinite(Number(raw.y))) out.y = Number(clamp(Number(raw.y), STAMP_MIN_NORM, STAMP_MAX_NORM).toFixed(4));
  if (Number.isFinite(Number(raw.r))) out.r = normalizeAngle(raw.r);
  if (Number.isFinite(Number(raw.scale))) out.scale = Number(clampStampScale(raw.scale).toFixed(3));
  return Object.keys(out).length ? out : undefined;
}

export function snapStampNorm(nx, ny, { CW = 170, CH = 239, snapEnabled = true, bypass = false } = {}) {
  const clamped = clampStampNorm(nx, ny);
  if (!snapEnabled || bypass) {
    return { nx: clamped.nx, ny: clamped.ny, snappedX: false, snappedY: false, snapPxX: null, snapPxY: null };
  }
  const D = CH - 239;
  const PMY = 16 + (136 + D) / 2;
  const px = clamped.nx * CW;
  const py = clamped.ny * CH;
  const threshold = 3.5;

  const targetsX = [CW / 2, 26, CW - 26];
  const targetsY = [CH / 2, PMY, 26, CH - 26];

  let outNx = clamped.nx;
  let outNy = clamped.ny;
  let snappedX = false;
  let snappedY = false;
  let snapPxX = null;
  let snapPxY = null;

  let bestDx = threshold;
  for (const tx of targetsX) {
    const d = Math.abs(px - tx);
    if (d <= bestDx) {
      bestDx = d;
      outNx = tx / CW;
      snappedX = true;
      snapPxX = tx;
    }
  }

  let bestDy = threshold;
  for (const ty of targetsY) {
    const d = Math.abs(py - ty);
    if (d <= bestDy) {
      bestDy = d;
      outNy = ty / CH;
      snappedY = true;
      snapPxY = ty;
    }
  }

  return { nx: outNx, ny: outNy, snappedX, snappedY, snapPxX, snapPxY };
}

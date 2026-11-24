export const PREVIEW_OPTIONS = Object.freeze({
  one: true,
  drag: false,
  style: "custom",
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
  titleScale: 0.85,
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
  photoMounts: Object.freeze([0]),
  centerTitle: false,
  halftone: false,
  bleed: false,
  cropMarks: false
});

const CUSTOM_VERSION = /\s+-\s+Custom v\d+$/i;
const MAX_NAME_LENGTH = 60;

function normalizedName(name) {
  return String(name ?? "").trim().slice(0, MAX_NAME_LENGTH) || "Untitled theme";
}

function nameKey(name) {
  return normalizedName(name).toLocaleLowerCase();
}

function colorHex(value, fallback) {
  const color = String(value ?? "");
  const shortHex = color.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) return `#${[...shortHex[1]].map(channel => channel + channel).join("")}`;
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return `#${rgb.slice(1, 4).map(channel => Number(channel).toString(16).padStart(2, "0")).join("")}`;
  return fallback;
}

function normalizeConfig(config, defaults) {
  const normalized = { ...defaults, ...config, name: normalizedName(config.name) };
  for (const key of ["bg", "ink", "acc", "frame", "tape", "gs"]) {
    normalized[key] = colorHex(normalized[key], defaults[key]);
  }
  return normalized;
}

export function themeBaseName(name) {
  return normalizedName(name).replace(CUSTOM_VERSION, "").trim() || "Untitled theme";
}

export function nextCustomThemeName(name, existingNames = []) {
  const existing = new Set(existingNames.map(nameKey));
  const base = themeBaseName(name);
  for (let version = 1; ; version++) {
    const suffix = ` - Custom v${version}`;
    const candidate = `${base.slice(0, MAX_NAME_LENGTH - suffix.length).trimEnd()}${suffix}`;
    if (!existing.has(nameKey(candidate))) return candidate;
  }
}

export function uniqueThemeName(name, existingNames = []) {
  const candidate = normalizedName(name);
  const existing = new Set(existingNames.map(nameKey));
  return existing.has(nameKey(candidate))
    ? nextCustomThemeName(candidate, existingNames)
    : candidate;
}

export function configForTheme(key, theme, defaults) {
  if (theme.config && typeof theme.config === "object") {
    return normalizeConfig(theme.config, defaults);
  }
  if (theme.acc !== undefined || theme.pa !== undefined || theme.name !== undefined) {
    return normalizeConfig(theme, defaults);
  }
  return normalizeConfig({
    ...defaults,
    name: normalizedName(theme.n || key),
    bg: theme.grad ? (theme.bg || theme.gs) : theme.bg,
    ink: theme.ink,
    acc: theme.fixed || defaults.acc,
    frame: theme.frame || theme.ink || defaults.frame,
    tape: theme.tape || defaults.tape,
    pa: !theme.fixed,
    grad: Boolean(theme.grad),
    gs: theme.gs || theme.bg || defaults.gs,
    gl: theme.gl ?? defaults.gl
  }, defaults);
}

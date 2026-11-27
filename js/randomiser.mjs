// Seeded per-card "Surprise me" style randomiser with WCAG contrast, print-safe & stamp bounds guard rails
import { BORDER_STYLES, compactBorderOverrides } from "./borders.mjs?v=phase10d";
import {
  SKINDS,
  STAMP_MAX_SCALE,
  STAMP_MIN_SCALE,
  clampStampNorm,
  compactStampStyle,
  stampNormBounds
} from "./stamps.mjs?v=phase10d";
import {
  SURPRISE_MANAGED_STYLE_KEYS,
  blendHex,
  contrastRatio,
  ensureContrastHex,
  hasCustomCardStyling,
  hslObjectToHex,
  normalizeHex,
  relativeLuminance
} from "./card-styles.mjs?v=phase10d";

const FALLBACK_THEMES = Object.freeze({
  cream: { grp: "Light", n: "Cream", bg: "#f2eadb", ink: "#1b1a19", mute: "#3a3733" }
});

export const SURPRISE_PREFS_KEY = "ticketgen.surprisePrefs.v1";

export const DEFAULT_SURPRISE_PREFS = Object.freeze({
  scope: {
    colors: true,
    border: true,
    stamps: false,
    wear: true,
    font: false
  },
  strength: 1, // 0 = Subtle, 1 = Normal, 2 = Wild
  keepTheme: false,
  keepMovedStamps: false
});

const FONT_POOLS = {
  0: ["pirata", "playfair", "mont", "georgia"],
  1: ["pirata", "playfair", "mont", "bebas", "type", "impact", "trebuchet", "script", "scrawl", "marker"],
  2: ["pirata", "playfair", "georgia", "mont", "trebuchet", "bebas", "impact", "script", "scrawl", "rough", "calligraphy", "brush", "marker", "type", "courier", "consolas"]
};

const BORDER_POOLS = {
  0: [0, 1, 2, 4, 5, 6, 7],
  1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17],
  2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17]
};

const CORNER_KINDS = ["square", "rounded", "notched", "chamfered"];
const ORNAMENT_KINDS = ["none", "diamond", "dot", "star", "cross", "bracket"];
const STAMP_PATTERN_KINDS = ["solid", "dashed", "dotted"];
const STAMP_FILL_KINDS = ["outline", "tinted", "solid"];

const CURATED_TAPES = [
  "#d8b46b", "#f2ead3", "#e6d6a8", "#ffd166", "#b9f0e0",
  "#ffd6e0", "#c9c4b5", "#fff3a8", "#8ecae6", "#e0afa0"
];

export function mulberry32(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cardSeed(masterSeed, cardIndex, salt = 0) {
  let h = (Number(masterSeed) >>> 0) || 1;
  h = Math.imul(h ^ ((cardIndex + 1) * 0x9e3779b1), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ ((salt + 1) * 0xc2b2ae35), 0x27d4eb2f) >>> 0;
  return (h ^ (h >>> 15)) >>> 0 || 1;
}

export function generateSeed() {
  return 100000 + Math.floor(Math.random() * 899999);
}

export function normalizeSurprisePrefs(raw = {}) {
  const scopeRaw = raw?.scope && typeof raw.scope === "object" ? raw.scope : {};
  const strengthNum = Number(raw?.strength);
  return {
    scope: {
      colors: scopeRaw.colors !== undefined ? Boolean(scopeRaw.colors) : DEFAULT_SURPRISE_PREFS.scope.colors,
      border: scopeRaw.border !== undefined ? Boolean(scopeRaw.border) : DEFAULT_SURPRISE_PREFS.scope.border,
      stamps: scopeRaw.stamps !== undefined ? Boolean(scopeRaw.stamps) : DEFAULT_SURPRISE_PREFS.scope.stamps,
      wear: scopeRaw.wear !== undefined ? Boolean(scopeRaw.wear) : DEFAULT_SURPRISE_PREFS.scope.wear,
      font: scopeRaw.font !== undefined ? Boolean(scopeRaw.font) : DEFAULT_SURPRISE_PREFS.scope.font
    },
    strength: Number.isInteger(strengthNum) ? Math.max(0, Math.min(2, strengthNum)) : DEFAULT_SURPRISE_PREFS.strength,
    keepTheme: raw?.keepTheme !== undefined ? Boolean(raw.keepTheme) : DEFAULT_SURPRISE_PREFS.keepTheme,
    keepMovedStamps: raw?.keepMovedStamps !== undefined ? Boolean(raw.keepMovedStamps) : DEFAULT_SURPRISE_PREFS.keepMovedStamps
  };
}

export function getSurprisePrefs() {
  try {
    if (typeof localStorage === "undefined") return normalizeSurprisePrefs();
    const raw = JSON.parse(localStorage.getItem(SURPRISE_PREFS_KEY) || "null");
    return normalizeSurprisePrefs(raw || {});
  } catch {
    return normalizeSurprisePrefs();
  }
}

export function saveSurprisePrefs(prefs) {
  const clean = normalizeSurprisePrefs(prefs);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SURPRISE_PREFS_KEY, JSON.stringify(clean));
    }
  } catch {}
  return clean;
}

function pickFrom(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function printSafeAccentHex(baseHue, bgLum, rng, strength) {
  const shift = strength === 0 ? 18 : (strength === 1 ? 45 : 180);
  const h = ((Math.round(baseHue + (rng() * 2 - 1) * shift)) % 360 + 360) % 360;
  const s = clamp(randRange(rng, 0.58, 0.92), 0.5, 0.95);
  // Keep accents readable on light paper (darker <= 0.44 L) and luminous on dark cards (>= 0.54 L)
  const l = bgLum > 0.45 ? randRange(rng, 0.30, 0.46) : randRange(rng, 0.54, 0.68);
  let hex = hslObjectToHex({ h, s, l });
  const alum = relativeLuminance(hex);
  if (bgLum > 0.55 && alum > 0.65) hex = blendHex(hex, "#111111", 0.35);
  if (bgLum < 0.20 && alum < 0.14) hex = blendHex(hex, "#ffffff", 0.35);
  return hex;
}

function resolveBaseThemeForCard(card, cfg, pageThemeKey, themes) {
  return (card?.theme && themes[card.theme])
    || (pageThemeKey && themes[pageThemeKey])
    || themes[cfg?.style]
    || themes.cream
    || FALLBACK_THEMES.cream;
}

function buildContrastCheckedPalette({ baseTheme, card, rng, strength, keepTheme }) {
  const baseBgLum = relativeLuminance(normalizeHex(baseTheme.bg, "#f2eadb"));
  const baseHue = Number.isFinite(Number(card?.h)) ? Number(card.h) : 35;

  // Pick a print-safe harmonized accent override (never modifying card.h / card.s)
  const acc = printSafeAccentHex(baseHue, baseBgLum, rng, strength);
  const bg = normalizeHex(baseTheme.bg, "#f2eadb");
  const gsHex = normalizeHex(baseTheme.gs, bg);
  let gradEnd = baseTheme.grad
    ? hslObjectToHex({
      h: (baseHue + Math.round((rng() * 2 - 1) * (strength === 2 ? 90 : 30)) + 360) % 360,
      s: clamp(Math.max(0.5, card?.s ?? 0.75), 0.5, 0.92),
      l: clamp(Number(baseTheme.gl) || (baseBgLum < 0.4 ? 0.34 : 0.74), 0.22, 0.80)
    })
    : undefined;

  // Subtle background tint if Normal/Wild + not keeping raw ink/bg identical
  let patchBg = bg;
  if (!keepTheme && !baseTheme.grad && strength > 0 && rng() < (strength === 2 ? 0.55 : 0.3)) {
    const tintTarget = acc;
    patchBg = blendHex(bg, tintTarget, strength === 2 ? 0.14 : 0.07);
  }

  const extraStops = Array.isArray(baseTheme.gradStops)
    ? baseTheme.gradStops.slice(0, -1).map(s => normalizeHex(s, "")).filter(Boolean)
    : [];
  const staticGradStops = baseTheme.grad ? [gsHex, ...extraStops] : [patchBg];
  const baseInk = ensureContrastHex(normalizeHex(baseTheme.ink, "#1b1a19"), staticGradStops, 4.5);
  const baseMute = ensureContrastHex(normalizeHex(baseTheme.mute, blendHex(baseInk, patchBg, 0.28)), staticGradStops, 4.5);

  if (gradEnd) {
    for (let step = 0; step <= 20; step++) {
      const candidateEnd = step === 0 ? gradEnd : blendHex(gradEnd, gsHex, step / 20);
      if (contrastRatio(baseInk, candidateEnd) >= 4.5 && contrastRatio(baseMute, candidateEnd) >= 4.5) {
        gradEnd = candidateEnd;
        break;
      }
      if (step === 20) gradEnd = gsHex;
    }
  }

  const finalStops = gradEnd ? [...staticGradStops, gradEnd] : [patchBg];
  const checkedInk = ensureContrastHex(baseInk, finalStops, 4.5);
  const checkedMute = ensureContrastHex(baseMute, finalStops, 4.5);

  return {
    ...(patchBg !== bg ? { bg: patchBg } : {}),
    ink: checkedInk,
    mute: checkedMute,
    acc,
    ...(gradEnd ? { gradEnd } : {})
  };
}

function chooseBorderForCard({ rng, strength, bgLum }) {
  const pool = BORDER_POOLS[strength] || BORDER_POOLS[1];
  // Avoid Neon glow on bright white/light paper because blur loses contrast when printed
  const candidates = bgLum > 0.52 ? pool.filter(id => id !== 14) : pool;
  const styleId = pickFrom(rng, candidates.length ? candidates : [0, 1, 2, 4]);
  const meta = BORDER_STYLES[styleId] || BORDER_STYLES[0];
  const raw = {
    style: styleId,
    width: Number(clamp(meta.defaults.width + randRange(rng, -0.3, strength === 2 ? 1.1 : 0.6), 0.75, 4.2).toFixed(2)),
    inset: Number(clamp(meta.defaults.inset + randRange(rng, -0.5, 1.8), 2.0, 6.5).toFixed(1)),
    opacity: strength === 0 ? 100 : pickFrom(rng, [75, 85, 95, 100])
  };
  if (meta.supports.color) {
    raw.colorMode = rng() < 0.7 ? "accent" : pickFrom(rng, ["frame", "ink"]);
  }
  if (meta.supports.corner && strength > 0 && rng() < (strength === 2 ? 0.65 : 0.35)) {
    const corner = pickFrom(rng, CORNER_KINDS);
    if (corner !== meta.defaults.corner) {
      raw.corner = corner;
      raw.cornerSize = Number(randRange(rng, 4, 11).toFixed(1));
    }
  }
  if (meta.supports.ornament && strength > 0 && rng() < (strength === 2 ? 0.55 : 0.28)) {
    raw.ornament = pickFrom(rng, ORNAMENT_KINDS.filter(o => o !== "none"));
    raw.ornamentSize = Number(randRange(rng, 3.5, 6.5).toFixed(1));
  }
  if (meta.supports.glow && styleId === 14 && bgLum <= 0.4) {
    raw.glow = Math.round(randRange(rng, 35, 70));
  }
  const compacted = compactBorderOverrides(styleId, raw) || {};
  return { style: styleId, ...compacted };
}

// Curated safe anchor zones avoiding title text (y >= 182+D) and photo center
export function pickSafeStampNorm({ rng, strength, stampIndex = 0, CH = 239, CW = 170, effScale = 1, hasNfc = true }) {
  const D = CH - 239;
  const PB = 152 + D;
  const bounds = stampNormBounds({ CW, CH, effScale });
  let zones;
  if (CH < 204) {
    zones = stampIndex === 1
      ? [{ nx: [0.68, 0.84], ny: [0.64, Math.min(bounds.maxNy, 0.80)] }]
      : [
        { nx: [0.76, Math.min(bounds.maxNx, 0.89)], ny: [0.20, 0.42] },
        { nx: [0.72, Math.min(bounds.maxNx, 0.86)], ny: [0.60, Math.min(bounds.maxNy, 0.80)] }
      ];
  } else {
    const tearNy = PB / CH;
    zones = stampIndex === 1
      ? [
        { nx: [0.18, 0.30], ny: [Math.min(bounds.maxNy - 0.02, (PB + 10) / CH), Math.min(bounds.maxNy, (PB + 18) / CH)] },
        { nx: [0.68, 0.82], ny: [(26) / CH, (40) / CH] }
      ]
      : [
        { nx: [0.18, 0.32], ny: [tearNy - 0.035, tearNy + 0.02] }, // Bottom-left tear margin
        { nx: [0.68, 0.83], ny: [tearNy - 0.035, tearNy + 0.02] }, // Bottom-right tear margin
        { nx: [0.43, 0.58], ny: [tearNy - 0.035, tearNy + 0.01] }, // Bottom-center tear overlap (above EST./title)
        { nx: [0.70, 0.84], ny: [24 / CH, 40 / CH] },               // Top-right photo corner
        { nx: [0.17, 0.30], ny: [24 / CH, 40 / CH] },               // Top-left photo corner
        ...(!hasNfc ? [{ nx: [0.72, 0.84], ny: [(202 + D) / CH, Math.min(bounds.maxNy, (214 + D) / CH)] }] : [])
      ];
  }

  const zone = pickFrom(rng, zones);
  const nxRaw = randRange(rng, zone.nx[0], zone.nx[1]);
  const nyRaw = randRange(rng, zone.ny[0], zone.ny[1]);
  const clamped = clampStampNorm(nxRaw, nyRaw, { CW, CH, effScale });

  const maxAng = strength === 0 ? 12 : (strength === 1 ? 26 : 40);
  const r = Math.round(randRange(rng, -maxAng, maxAng));
  const scale = Number(clamp(
    strength === 0 ? randRange(rng, 0.92, 1.08) : (strength === 1 ? randRange(rng, 0.82, 1.18) : randRange(rng, 0.72, 1.32)),
    STAMP_MIN_SCALE,
    STAMP_MAX_SCALE
  ).toFixed(2));

  return {
    x: Number(clamped.nx.toFixed(4)),
    y: Number(clamped.ny.toFixed(4)),
    r,
    scale
  };
}

export function surpriseSingleCard({
  card,
  index,
  seed,
  cfg = {},
  pageThemeKey = "",
  prefs = DEFAULT_SURPRISE_PREFS,
  themes = FALLBACK_THEMES,
  CH = 239,
  CW = 170
}) {
  const themeMap = themes && typeof themes === "object" ? themes : FALLBACK_THEMES;
  const cleanPrefs = normalizeSurprisePrefs(prefs);
  const { scope, strength, keepTheme, keepMovedStamps } = cleanPrefs;
  const rng = mulberry32(cardSeed(seed, index, strength));
  const next = { ...card };

  // Never alter text, photos, ordering, crop, or sampled hue/sat (card.h / card.s)
  const themePool = Object.keys(themeMap).filter(k => k !== "custom");
  const curatedPool = strength === 2
    ? themePool
    : themePool.filter(k => {
      const t = themeMap[k];
      return strength === 0 ? !t?.grad : !["neon", "terminal", "vapor"].includes(k);
    });

  let activeThemeKey = next.theme || pageThemeKey || cfg.style || "cream";
  let replacedMovedStamp = false;

  if (scope.colors) {
    if (!keepTheme && curatedPool.length) {
      activeThemeKey = pickFrom(rng, curatedPool);
      next.theme = activeThemeKey;
    }
    const baseTheme = themeMap[activeThemeKey] || themeMap.cream || FALLBACK_THEMES.cream;
    next.palette = buildContrastCheckedPalette({
      baseTheme,
      card: next,
      rng,
      strength,
      keepTheme
    });
    if (baseTheme.grad) {
      next.gradientAngle = Math.round(rng() * 12) * 30;
      next.gradientSpread = Math.round(randRange(rng, 22, 65));
    }
    if (strength > 0 && rng() < 0.7) {
      next.tape = pickFrom(rng, CURATED_TAPES);
    }
  } else {
    activeThemeKey = next.theme || pageThemeKey || cfg.style || "cream";
  }

  const effectiveTheme = resolveBaseThemeForCard(next, cfg, pageThemeKey, themeMap);
  const bgLum = relativeLuminance(normalizeHex(next.palette?.bg || effectiveTheme.bg, "#f2eadb"));

  if (scope.border) {
    next.border = chooseBorderForCard({ rng, strength, bgLum });
  }

  if (scope.stamps) {
    const shapePool = SKINDS.length ? SKINDS : ["round", "oval", "rect"];
    next.sk = pickFrom(rng, shapePool);
    const fillPool = strength === 0 ? ["outline", "tinted"] : STAMP_FILL_KINDS;
    const rawStyle = {
      fillMode: pickFrom(rng, fillPool),
      weight: Number(randRange(rng, strength === 0 ? 0.85 : 0.75, strength === 2 ? 1.55 : 1.35).toFixed(1)),
      pattern: strength === 0 ? "solid" : pickFrom(rng, STAMP_PATTERN_KINDS),
      opacity: strength === 0 ? 95 : pickFrom(rng, [75, 85, 95, 100]),
      innerRing: rng() > (strength === 2 ? 0.35 : 0.15),
      showYear: rng() > (strength === 2 ? 0.3 : 0.1)
    };
    const compactedStyle = compactStampStyle(rawStyle);
    if (compactedStyle) next.stampStyle = compactedStyle;
    else delete next.stampStyle;

    next.stampAuto = rng() < 0.78;
    if (!next.stampAuto) {
      next.stampColor = printSafeAccentHex((card?.h ?? 15) + 180, bgLum, rng, strength);
    } else {
      delete next.stampColor;
    }

    const hadManualPos = Boolean(card?.stampPos || card?.stamp2Pos);
    if (!keepMovedStamps || !hadManualPos) {
      if (hadManualPos) replacedMovedStamp = true;
      const effScale = (cfg.stampSize || 100) / 100;
      next.stampPos = pickSafeStampNorm({
        rng,
        strength,
        stampIndex: 0,
        CH,
        CW,
        effScale,
        hasNfc: Boolean(cfg.nfc)
      });
      if (cfg.stamp2) {
        next.stamp2Pos = pickSafeStampNorm({
          rng,
          strength,
          stampIndex: 1,
          CH,
          CW,
          effScale: effScale * 0.85,
          hasNfc: Boolean(cfg.nfc)
        });
      }
    }
  }

  if (scope.wear) {
    const maxWear = strength === 0 ? 25 : (strength === 1 ? 45 : 75);
    next.grain = Math.round(randRange(rng, 5, maxWear));
    next.edgeWear = rng() < 0.65 ? Math.round(randRange(rng, 0, maxWear)) : 0;
    next.creases = rng() < (strength === 2 ? 0.65 : 0.3) ? Math.round(randRange(rng, 10, maxWear)) : 0;
    next.scuffs = rng() < (strength === 2 ? 0.55 : 0.25) ? Math.round(randRange(rng, 10, maxWear)) : 0;
    next.stampWear = Math.round(randRange(rng, 10, Math.min(75, maxWear + 15)));
    const borderWear = Math.round(randRange(rng, 10, Math.min(75, maxWear + 15)));
    next.border = { ...(next.border || { style: cfg.borderStyle ?? 0 }), wear: borderWear };

    const mountPool = strength === 0 ? [0, 2, 4, 7] : [0, 1, 2, 4, 5, 6, 7, 8];
    const m1 = pickFrom(rng, mountPool);
    next.photoMounts = strength === 2 && rng() < 0.3
      ? [m1, pickFrom(rng, mountPool.filter(m => m !== m1))]
      : [m1];

    next.yearBadge = pickFrom(rng, [0, 1, 2]);
    next.tearStyle = pickFrom(rng, [0, 1, 2]);
    next.halftone = strength > 0 && rng() < (strength === 2 ? 0.35 : 0.15);
    next.photoFilter = strength === 2 && rng() < 0.45 ? pickFrom(rng, [0, 1, 2]) : (strength === 1 && rng() < 0.2 ? pickFrom(rng, [1, 2]) : 0);
  }

  if (scope.font) {
    const fonts = FONT_POOLS[strength] || FONT_POOLS[1];
    next.titleFont = pickFrom(rng, fonts);
    next.centerTitle = rng() < 0.45;
    if (strength > 0) {
      next.titleScale = Number(randRange(rng, 0.78, 0.96).toFixed(2));
    }
  }

  return { card: next, replacedMovedStamp };
}

export function surpriseCardsBatch({
  cards,
  count,
  seed = generateSeed(),
  cfg = {},
  prefs = DEFAULT_SURPRISE_PREFS,
  themes = FALLBACK_THEMES,
  CH = 239,
  CW = 170,
  perPage = 9,
  onlyIndices = null
}) {
  const activeCount = Math.max(0, Math.min(cards.length, Number(count) || cards.length));
  const cleanPrefs = normalizeSurprisePrefs(prefs);
  const targetSet = onlyIndices ? new Set(onlyIndices) : null;

  let surprisedCount = 0;
  let skippedLocked = 0;
  let replacedStampCount = 0;

  const nextCards = cards.map((card, index) => {
    if (index >= activeCount) return card;
    if (targetSet && !targetSet.has(index)) return card;
    if (card.locked && !targetSet) {
      skippedLocked++;
      return card;
    }
    const page = Math.floor(index / Math.max(1, perPage));
    const pageThemeKey = cfg.pageThemes?.[page] || "";
    const result = surpriseSingleCard({
      card,
      index,
      seed,
      cfg,
      pageThemeKey,
      prefs: cleanPrefs,
      themes,
      CH,
      CW
    });
    surprisedCount++;
    if (result.replacedMovedStamp) replacedStampCount++;
    return result.card;
  });

  return {
    cards: nextCards,
    seed,
    surprisedCount,
    skippedLocked,
    replacedStampCount
  };
}

export { SURPRISE_MANAGED_STYLE_KEYS, hasCustomCardStyling };

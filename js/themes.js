// Built-in Themes, Custom Theme Builder & Saved Custom Theme Registry

export const BUILTIN_THEMES = {
  cream:    { grp: "Light",    n: "Cream", bg: "#f2eadb", ink: "#1b1a19", mute: "#3a3733", ph: "#ddd2bd", frame: "#222", tape: "#d8b46b", te: "#b8935a", mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723" },
  kraft:    { grp: "Light",    n: "Kraft paper", bg: "#c9a56b", ink: "#2b1a0a", mute: "#4a3519", ph: "#b48f55", frame: "#2b1a0a", tape: "#f2ead3", te: "#cfc4a0", mt: "#6b5a3d", hi: "#e6d3a8", dk: "#25180a", l: 0.3, bt: "#fff", bs: 1, tt: 2 },
  bubble:   { grp: "Light",    n: "Bubblegum", bg: "#ffe1ee", ink: "#3a1030", mute: "#6b2b58", ph: "#f6c3da", frame: "#3a1030", tape: "#b9f0e0", te: "#7fcfb6", mt: "#c68fb0", hi: "#fff", dk: "#4a1a3c", l: 0.5, bt: "#fff", bs: 4, bd: 1, pf: 1, tc: 1 },
  zine:     { grp: "Light",    n: "Photocopy zine", bg: "#fbfbf6", ink: "#000", mute: "#222", ph: "#e4e4de", frame: "#000", tape: "#cfcfc8", te: "#9a9a92", mt: "#9a9a9a", hi: "#fff", dk: "#000", fixed: "#111", bt: "#fff", bs: 1, pf: 2 },
  hazard:   { grp: "Light",    n: "Hazard yellow", bg: "#ffd21f", ink: "#000", mute: "#2a2400", ph: "#e8b800", frame: "#000", tape: "#222", te: "#000", mt: "#5a4c00", hi: "#ffe97a", dk: "#000", fixed: "#000", bt: "#ffd21f", bs: 2, tt: 3, pf: 2 },
  news:     { grp: "Light",    n: "Newspaper", bg: "#e8e1ce", ink: "#161512", mute: "#38352c", ph: "#d4ccb4", frame: "#161512", tape: "#cbc3a4", te: "#9d956f", mt: "#8f8a7c", hi: "#e9e4d4", dk: "#161512", fixed: "#25231e", bt: "#e8e1ce", gray: 1, tf: "'Playfair Display',Georgia,serif", tw: 900, tk: 0.72, ts: 15, ht: 1, pf: 2, tc: 1 },
  min:      { grp: "Light",    n: "Minimal", min: 1, bg: "#fff", ink: "#111", mute: "#777", ph: "#eee", frame: "#111", tape: "#ccc", te: "#aaa", mt: "#999", hi: "#fff", dk: "#000", fixed: "#111", bt: "#fff", nc: "#111", np: "#fff", tf: "Montserrat,Arial,sans-serif", tw: 800, tk: 0.7, ts: 15 },
  sepia:    { grp: "Light",    n: "Sepia", bg: "#dcc8a6", ink: "#3b2614", mute: "#5e4326", ph: "#c9b088", frame: "#3b2614", tape: "#efe3c6", te: "#c9b98f", mt: "#7a6240", hi: "#f0e2c0", dk: "#2a1a0c", fixed: "#6b3a1a", bt: "#f4e8cc", gray: 2, tt: 2, tc: 1 },
  mint:     { grp: "Light",    n: "Mint", bg: "#dff5ea", ink: "#0f3b2c", mute: "#2d6a53", ph: "#bfe6d3", frame: "#0f3b2c", tape: "#ffd6e0", te: "#e8a6b8", mt: "#7fb09c", hi: "#f2fff9", dk: "#0a2a1f", l: 0.4, bt: "#fff", bs: 4, tt: 1, bd: 1, pf: 1 },
  concrete: { grp: "Light",    n: "Concrete", bg: "#b9b9b4", ink: "#111", mute: "#333", ph: "#a2a29c", frame: "#111", tape: "#e8d54a", te: "#b3a22c", mt: "#6d6d68", hi: "#e4e4de", dk: "#1a1a1a", l: 0.32, bt: "#fff", bs: 2, bd: 2 },
  lilac:    { grp: "Light",    n: "Lilac", bg: "#e8defa", ink: "#2a1650", mute: "#5a3f94", ph: "#d3c4f0", frame: "#2a1650", tape: "#fff3a8", te: "#d8c96a", mt: "#9a86c8", hi: "#faf6ff", dk: "#1c0e38", l: 0.45, bt: "#fff", bs: 4, bd: 1, tc: 1 },

  dark:     { grp: "Dark",     n: "Dark", bg: "#18181c", ink: "#fff", mute: "#cfcfd6", ph: "#2a2a30", frame: "#9a9aa2", tape: "#d8b46b", te: "#b8935a", mt: "#8c8c95", hi: "#d6d6dc", dk: "#0c0c0e" },
  neon:     { grp: "Dark",     n: "Neon night", bg: "#0b0720", ink: "#fff", mute: "#c4b8ff", ph: "#1a1240", frame: "#ff5ec4", tape: "#37e8ff", te: "#0fb5cc", mt: "#6a5cc4", hi: "#cfc6ff", dk: "#05030f", l: 0.62, sm: 0.95, bs: 4, tt: 1, bd: 1, pf: 1 },
  blue:     { grp: "Dark",     n: "Blueprint", bg: "#123f8c", ink: "#eaf3ff", mute: "#a9c8ff", ph: "#1d55b3", frame: "#eaf3ff", tape: "#e9e4cf", te: "#bfb89b", mt: "#9bb7e8", hi: "#fff", dk: "#071d45", fixed: "#eaf3ff", bt: "#123f8c", bs: 3, tt: 3, bd: 2, pf: 2 },
  mini:     { grp: "Dark",     n: "Minimal ink", min: 1, bg: "#0c0c0c", ink: "#f5f5f5", mute: "#8a8a8a", ph: "#1b1b1b", frame: "#3a3a3a", tape: "#444", te: "#222", mt: "#777", hi: "#fff", dk: "#000", fixed: "#f5f5f5", bt: "#0c0c0c", nc: "#f5f5f5", np: "#0c0c0c", tf: "Montserrat,Arial,sans-serif", tw: 800, tk: 0.7, ts: 15 },
  vapor:    { grp: "Dark",     n: "Vaporwave", bg: "#2a0f4d", ink: "#fff", mute: "#ffb3ec", ph: "#3b1a69", frame: "#01cdfe", tape: "#05ffa1", te: "#03b574", mt: "#b967ff", hi: "#f1d9ff", dk: "#12052a", fixed: "#ff71ce", bt: "#2a0f4d", bs: 4, tt: 1, bd: 1, pf: 1, tc: 1 },
  sunset:   { grp: "Dark",     n: "Sunset", bg: "#2b0f2e", ink: "#ffe9d6", mute: "#f2b38a", ph: "#431847", frame: "#ff8a3d", tape: "#ffd166", te: "#d9a63a", mt: "#a8606a", hi: "#ffd9c2", dk: "#14061a", fixed: "#ff8a3d", bt: "#2b0f2e", bs: 2, tt: 3, bd: 1, pf: 1 },
  forest:   { grp: "Dark",     n: "Forest", bg: "#12261c", ink: "#e6f2e0", mute: "#a9c9b3", ph: "#1d3a2b", frame: "#7fbf8f", tape: "#c9b27a", te: "#9f8a55", mt: "#7a9684", hi: "#d6ecd8", dk: "#07130d", l: 0.55, sm: 0.6, bs: 3, tt: 2, bd: 2 },
  ocean:    { grp: "Dark",     n: "Ocean", bg: "#07263b", ink: "#e8f6ff", mute: "#9fd0ea", ph: "#0d3a57", frame: "#3ad1ff", tape: "#f4e6b8", te: "#cdbb83", mt: "#5d8fae", hi: "#d8f1ff", dk: "#031521", fixed: "#3ad1ff", bt: "#07263b", bs: 4, tt: 3, bd: 2, pf: 2, tc: 1 },
  terminal: { grp: "Dark",     n: "Terminal", bg: "#020a04", ink: "#3dff7a", mute: "#22b857", ph: "#06190d", frame: "#3dff7a", tape: "#1e8a45", te: "#0f5a2b", mt: "#1f6a3a", hi: "#8dffb3", dk: "#000", fixed: "#3dff7a", bt: "#020a04", tf: "'Courier New',monospace", tw: 700, tk: 0.68, ts: 14, bs: 3, tt: 3, bd: 2, pf: 1 },
  luxe:     { grp: "Dark",     n: "Luxe gold", bg: "#0d0d0d", ink: "#f4e3b2", mute: "#c9b27a", ph: "#1c1a14", frame: "#d4af37", tape: "#d4af37", te: "#8f741a", mt: "#8c7a42", hi: "#f7e7a8", dk: "#000", fixed: "#d4af37", bt: "#0d0d0d", tt: 3, bd: 2, pf: 2, tc: 1 },
  crimson:  { grp: "Dark",     n: "Crimson club", bg: "#1a0508", ink: "#fff", mute: "#f0b6bd", ph: "#2d0a10", frame: "#e0182d", tape: "#e8e0d0", te: "#b8ad96", mt: "#8a3a44", hi: "#ffd0d5", dk: "#0b0204", fixed: "#e0182d", bt: "#fff", bs: 1, tt: 3, pf: 2 },
  rust:     { grp: "Dark",     n: "Rust", bg: "#3a1a0e", ink: "#ffe3c8", mute: "#e0a982", ph: "#52281a", frame: "#d9622b", tape: "#e8d3a5", te: "#bda877", mt: "#9a5a3a", hi: "#ffd6b5", dk: "#1e0c05", l: 0.55, sm: 0.7, bs: 1, tt: 2, pf: 1 },

  gradd:    { grp: "Gradient", n: "Gradient dark → accent", grad: 1, gs: "#0b0b10", gl: 0.4, bg: "#0b0b10", ink: "#fff", mute: "#ececf4", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.75)", tape: "#e8d9b0", te: "#bfae80", mt: "#8c8c95", hi: "#d6d6dc", dk: "#0c0c0e", l: 0.62, sm: 0.6, bs: 4, tt: 3, bd: 1, pf: 1 },
  gradl:    { grp: "Gradient", n: "Gradient cream → accent", grad: 1, gs: "#f3ead8", gl: 0.72, bg: "#f3ead8", ink: "#14121a", mute: "#34303f", ph: "rgba(0,0,0,.07)", frame: "rgba(0,0,0,.75)", tape: "#e6d6a8", te: "#b8a574", mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723", l: 0.42, sm: 0.6, bt: "#fff", bs: 1, pf: 2 }
};

export const TF = {
  pirata:   { f: "'Pirata One',Georgia,serif", w: 400, s: 17, k: 0.58 },
  playfair: { f: "'Playfair Display',Georgia,serif", w: 900, s: 15, k: 0.72 },
  mont:     { f: "Montserrat,Arial,sans-serif", w: 800, s: 15, k: 0.7 },
  bebas:    { f: "'Bebas Neue',Impact,sans-serif", w: 400, s: 20, k: 0.44 },
  type:     { f: "'Special Elite','Courier New',monospace", w: 400, s: 14, k: 0.66 },
  courier:  { f: "'Courier New',monospace", w: 700, s: 14, k: 0.68 }
};

export const DEFAULT_CUSTOM = {
  name: "My theme",
  bg: "#1f2430",
  ink: "#ffffff",
  acc: "#ff5a36",
  frame: "#ffffff",
  pa: false,
  tape: "#d8b46b",
  grad: false,
  gs: "#0b0b10",
  gl: 0.45
};

export const CUSTOM = { ...DEFAULT_CUSTOM };
export const THEMES = { ...BUILTIN_THEMES, custom: { grp: "Custom", n: "My theme" } };

const CUSTOM_THEMES_KEY = "ticketgen.customThemes.v1";

export const parseHex = h => {
  h = String(h || "#000000").replace("#", "");
  if (h.length === 3) h = h.replace(/./g, "$&$&");
  return parseInt(h, 16) || 0;
};

export const lum = h => {
  if (!h || !String(h).startsWith("#")) return 0.2;
  const n = parseHex(h);
  return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
};

export const hslLum = (h, s, l) => {
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return 0.299 * f(0) + 0.587 * f(8) + 0.114 * f(4);
};

export const mix = (a, b, t) => {
  const x = parseHex(a), y = parseHex(b);
  const c = sh => Math.round((x >> sh & 255) * (1 - t) + (y >> sh & 255) * t);
  return "#" + [16, 8, 0].map(sh => c(sh).toString(16).padStart(2, "0")).join("");
};

export function compileCustomTheme(cfg, grp = "Custom") {
  const C = { ...DEFAULT_CUSTOM, ...cfg };
  const isGrad = Boolean(C.grad);
  const baseBg = isGrad ? (C.gs || C.bg) : C.bg;

  return {
    grp,
    n: C.name || "My theme",
    bg: baseBg,
    grad: isGrad ? 1 : 0,
    gs: C.gs || baseBg,
    gl: Number(C.gl) || 0.45,
    ink: C.ink,
    mute: mix(C.ink, baseBg, 0.25),
    ph: mix(baseBg, C.ink, 0.12),
    frame: C.frame || C.ink,
    tape: C.tape,
    te: mix(C.tape, "#000000", 0.25),
    mt: mix(C.ink, baseBg, 0.45),
    hi: mix(C.ink, "#ffffff", 0.4),
    dk: mix(baseBg, "#000000", 0.5),
    fixed: C.pa ? undefined : C.acc,
    l: 0.52,
    bt: C.pa ? undefined : (lum(C.acc) > 0.55 ? "#111" : "#fff"),
    _raw: C
  };
}

export function buildCustom() {
  THEMES.custom = compileCustomTheme(CUSTOM, "Custom");
}

export function getSavedCustomThemes() {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveCustomThemesList(list) {
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Could not persist custom themes:", e);
    return false;
  }
  refreshSavedThemes();
  return true;
}

export function refreshSavedThemes() {
  // Remove previous saved_* keys
  for (const k of Object.keys(THEMES)) {
    if (k.startsWith("saved_")) delete THEMES[k];
  }
  const saved = getSavedCustomThemes();
  saved.forEach(item => {
    if (item && item.id) {
      THEMES["saved_" + item.id] = compileCustomTheme(item.config, "Saved Custom");
    }
  });
}

export function populateThemeSelect(selectEl, includeEmptyOption = false) {
  refreshSavedThemes();
  const groups = { Light: [], Dark: [], Gradient: [], "Saved Custom": [], Custom: [] };
  Object.entries(THEMES).forEach(([k, v]) => {
    const g = groups[v.grp] ? v.grp : "Light";
    groups[g].push(`<option value="${k}">${escapeHtml(v.n)}</option>`);
  });

  const prefix = includeEmptyOption ? '<option value="">Same as sheet</option>' : "";
  selectEl.innerHTML = prefix + Object.entries(groups)
    .filter(([, opts]) => opts.length > 0)
    .map(([lbl, opts]) => `<optgroup label="${lbl} Themes">${opts.join("")}</optgroup>`)
    .join("");
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Initialize registry on module load
buildCustom();
refreshSavedThemes();

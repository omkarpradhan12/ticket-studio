// Built-in Themes, Custom Theme Builder & Saved Custom Theme Registry

export const BUILTIN_THEMES = {
  cream:    { grp: "Light",    cat: "Light · Classic & Paper",   n: "Cream", bg: "#f2eadb", ink: "#1b1a19", mute: "#3a3733", ph: "#ddd2bd", frame: "#222", tape: "#d8b46b", te: "#b8935a", mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723" },
  kraft:    { grp: "Light",    cat: "Light · Classic & Paper",   n: "Kraft paper", bg: "#c9a56b", ink: "#2b1a0a", mute: "#4a3519", ph: "#b48f55", frame: "#2b1a0a", tape: "#f2ead3", te: "#cfc4a0", mt: "#6b5a3d", hi: "#e6d3a8", dk: "#25180a", l: 0.3, bt: "#fff", bs: 1, tt: 2 },
  news:     { grp: "Light",    cat: "Light · Classic & Paper",   n: "Newspaper", bg: "#e8e1ce", ink: "#161512", mute: "#38352c", ph: "#d4ccb4", frame: "#161512", tape: "#cbc3a4", te: "#9d956f", mt: "#8f8a7c", hi: "#e9e4d4", dk: "#161512", fixed: "#25231e", bt: "#e8e1ce", gray: 1, tf: "'Playfair Display',Georgia,serif", tw: 900, tk: 0.72, ts: 15, ht: 1, pf: 2, tc: 1 },
  sepia:    { grp: "Light",    cat: "Light · Classic & Paper",   n: "Sepia", bg: "#dcc8a6", ink: "#3b2614", mute: "#5e4326", ph: "#c9b088", frame: "#3b2614", tape: "#efe3c6", te: "#c9b98f", mt: "#7a6240", hi: "#f0e2c0", dk: "#2a1a0c", fixed: "#6b3a1a", bt: "#f4e8cc", gray: 2, tt: 2, tc: 1 },
  zine:     { grp: "Light",    cat: "Light · Classic & Paper",   n: "Photocopy zine", bg: "#fbfbf6", ink: "#000", mute: "#222", ph: "#e4e4de", frame: "#000", tape: "#cfcfc8", te: "#9a9a92", mt: "#9a9a9a", hi: "#fff", dk: "#000", fixed: "#111", bt: "#fff", bs: 1, pf: 2 },
  polaroid: { grp: "Light",    cat: "Light · Classic & Paper",   n: "Polaroid", polaroid: 1, bg: "#faf8f2", ink: "#1c1b1a", mute: "#5c5952", ph: "#262523", frame: "#d8d3c8", tape: "#f0e6c8", te: "#c7ba96", mt: "#a39a88", hi: "#ffffff", dk: "#22201d", fixed: "#1c1b1a", bt: "#ffffff", nc: "#1c1b1a", np: "#faf8f2", tf: "'Caveat','Segoe Script','Brush Script MT','Bradley Hand',cursive", tw: 700, tk: 0.48, ts: 19 },
  min:      { grp: "Light",    cat: "Light · Classic & Paper",   n: "Minimal", min: 1, bg: "#fff", ink: "#111", mute: "#777", ph: "#eee", frame: "#111", tape: "#ccc", te: "#aaa", mt: "#999", hi: "#fff", dk: "#000", fixed: "#111", bt: "#fff", nc: "#111", np: "#fff", tf: "Montserrat,Arial,sans-serif", tw: 800, tk: 0.7, ts: 15 },
  mint:     { grp: "Light",    cat: "Light · Pastel & Pop",      n: "Mint", bg: "#dff5ea", ink: "#0f3b2c", mute: "#2d6a53", ph: "#bfe6d3", frame: "#0f3b2c", tape: "#ffd6e0", te: "#e8a6b8", mt: "#7fb09c", hi: "#f2fff9", dk: "#0a2a1f", l: 0.4, bt: "#fff", bs: 4, tt: 1, bd: 1, pf: 1 },
  lilac:    { grp: "Light",    cat: "Light · Pastel & Pop",      n: "Lilac", bg: "#e8defa", ink: "#2a1650", mute: "#5a3f94", ph: "#d3c4f0", frame: "#2a1650", tape: "#fff3a8", te: "#d8c96a", mt: "#9a86c8", hi: "#faf6ff", dk: "#1c0e38", l: 0.45, bt: "#fff", bs: 4, bd: 1, tc: 1 },
  bubble:   { grp: "Light",    cat: "Light · Pastel & Pop",      n: "Bubblegum", bg: "#ffe1ee", ink: "#3a1030", mute: "#6b2b58", ph: "#f6c3da", frame: "#3a1030", tape: "#b9f0e0", te: "#7fcfb6", mt: "#c68fb0", hi: "#fff", dk: "#4a1a3c", l: 0.5, bt: "#fff", bs: 4, bd: 1, pf: 1, tc: 1 },
  concrete: { grp: "Light",    cat: "Light · Pastel & Pop",      n: "Concrete", bg: "#b9b9b4", ink: "#111", mute: "#333", ph: "#a2a29c", frame: "#111", tape: "#e8d54a", te: "#b3a22c", mt: "#6d6d68", hi: "#e4e4de", dk: "#1a1a1a", l: 0.32, bt: "#fff", bs: 2, bd: 2 },
  hazard:   { grp: "Light",    cat: "Light · Pastel & Pop",      n: "Hazard yellow", bg: "#ffd21f", ink: "#000", mute: "#2a2400", ph: "#e8b800", frame: "#000", tape: "#222", te: "#000", mt: "#5a4c00", hi: "#ffe97a", dk: "#000", fixed: "#000", bt: "#ffd21f", bs: 2, tt: 3, pf: 2 },

  dark:     { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Dark", bg: "#18181c", ink: "#fff", mute: "#cfcfd6", ph: "#2a2a30", frame: "#9a9aa2", tape: "#d8b46b", te: "#b8935a", mt: "#8c8c95", hi: "#d6d6dc", dk: "#0c0c0e" },
  mini:     { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Minimal ink", min: 1, bg: "#0c0c0c", ink: "#f5f5f5", mute: "#8a8a8a", ph: "#1b1b1b", frame: "#3a3a3a", tape: "#444", te: "#222", mt: "#777", hi: "#fff", dk: "#000", fixed: "#f5f5f5", bt: "#0c0c0c", nc: "#f5f5f5", np: "#0c0c0c", tf: "Montserrat,Arial,sans-serif", tw: 800, tk: 0.7, ts: 15 },
  blue:     { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Blueprint", bg: "#123f8c", ink: "#eaf3ff", mute: "#a9c8ff", ph: "#1d55b3", frame: "#eaf3ff", tape: "#e9e4cf", te: "#bfb89b", mt: "#9bb7e8", hi: "#fff", dk: "#071d45", fixed: "#eaf3ff", bt: "#123f8c", bs: 3, tt: 3, bd: 2, pf: 2 },
  forest:   { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Forest", bg: "#12261c", ink: "#e6f2e0", mute: "#a9c9b3", ph: "#1d3a2b", frame: "#7fbf8f", tape: "#c9b27a", te: "#9f8a55", mt: "#7a9684", hi: "#d6ecd8", dk: "#07130d", l: 0.55, sm: 0.6, bs: 3, tt: 2, bd: 2 },
  ocean:    { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Ocean", bg: "#07263b", ink: "#e8f6ff", mute: "#9fd0ea", ph: "#0d3a57", frame: "#3ad1ff", tape: "#f4e6b8", te: "#cdbb83", mt: "#5d8fae", hi: "#d8f1ff", dk: "#031521", fixed: "#3ad1ff", bt: "#07263b", bs: 4, tt: 3, bd: 2, pf: 2, tc: 1 },
  rust:     { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Rust", bg: "#3a1a0e", ink: "#ffe3c8", mute: "#e0a982", ph: "#52281a", frame: "#d9622b", tape: "#e8d3a5", te: "#bda877", mt: "#9a5a3a", hi: "#ffd6b5", dk: "#1e0c05", l: 0.55, sm: 0.7, bs: 1, tt: 2, pf: 1 },
  crimson:  { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Crimson club", bg: "#1a0508", ink: "#fff", mute: "#f0b6bd", ph: "#2d0a10", frame: "#e0182d", tape: "#e8e0d0", te: "#b8ad96", mt: "#8a3a44", hi: "#ffd0d5", dk: "#0b0204", fixed: "#e0182d", bt: "#fff", bs: 1, tt: 3, pf: 2 },
  luxe:     { grp: "Dark",     cat: "Dark · Moody & Ink",        n: "Luxe gold", bg: "#0d0d0d", ink: "#f4e3b2", mute: "#c9b27a", ph: "#1c1a14", frame: "#d4af37", tape: "#d4af37", te: "#8f741a", mt: "#8c7a42", hi: "#f7e7a8", dk: "#000", fixed: "#d4af37", bt: "#0d0d0d", tt: 3, bd: 2, pf: 2, tc: 1 },
  neon:     { grp: "Dark",     cat: "Dark · Neon & Retro",       n: "Neon night", bg: "#0b0720", ink: "#fff", mute: "#c4b8ff", ph: "#1a1240", frame: "#ff5ec4", tape: "#37e8ff", te: "#0fb5cc", mt: "#6a5cc4", hi: "#cfc6ff", dk: "#05030f", l: 0.62, sm: 0.95, bs: 4, tt: 1, bd: 1, pf: 1 },
  vapor:    { grp: "Dark",     cat: "Dark · Neon & Retro",       n: "Vaporwave", bg: "#2a0f4d", ink: "#fff", mute: "#ffb3ec", ph: "#3b1a69", frame: "#01cdfe", tape: "#05ffa1", te: "#03b574", mt: "#b967ff", hi: "#f1d9ff", dk: "#12052a", fixed: "#ff71ce", bt: "#2a0f4d", bs: 4, tt: 1, bd: 1, pf: 1, tc: 1 },
  sunset:   { grp: "Dark",     cat: "Dark · Neon & Retro",       n: "Sunset", bg: "#2b0f2e", ink: "#ffe9d6", mute: "#f2b38a", ph: "#431847", frame: "#ff8a3d", tape: "#ffd166", te: "#d9a63a", mt: "#a8606a", hi: "#ffd9c2", dk: "#14061a", fixed: "#ff8a3d", bt: "#2b0f2e", bs: 2, tt: 3, bd: 1, pf: 1 },
  terminal: { grp: "Dark",     cat: "Dark · Neon & Retro",       n: "Terminal", bg: "#020a04", ink: "#3dff7a", mute: "#22b857", ph: "#06190d", frame: "#3dff7a", tape: "#1e8a45", te: "#0f5a2b", mt: "#1f6a3a", hi: "#8dffb3", dk: "#000", fixed: "#3dff7a", bt: "#020a04", tf: "'Courier New',monospace", tw: 700, tk: 0.68, ts: 14, bs: 3, tt: 3, bd: 2, pf: 1 },

  gradd:    { grp: "Gradient", cat: "Gradient · Dual & Triple",  n: "Gradient dark → accent", grad: 1, gs: "#0b0b10", gl: 0.4, bg: "#0b0b10", ink: "#fff", mute: "#ececf4", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.75)", tape: "#e8d9b0", te: "#bfae80", mt: "#8c8c95", hi: "#d6d6dc", dk: "#0c0c0e", l: 0.62, sm: 0.6, bs: 4, tt: 3, bd: 1, pf: 1 },
  gradl:    { grp: "Gradient", cat: "Gradient · Dual & Triple",  n: "Gradient cream → accent", grad: 1, gs: "#f3ead8", gl: 0.72, bg: "#f3ead8", ink: "#14121a", mute: "#34303f", ph: "rgba(0,0,0,.07)", frame: "rgba(0,0,0,.75)", tape: "#e6d6a8", te: "#b8a574", mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723", l: 0.42, sm: 0.6, bt: "#fff", bs: 1, pf: 2 },
  gradd3:   { grp: "Gradient", cat: "Gradient · Dual & Triple",  n: "Triple dark → accent", grad: 1, gradType: "triple", gs: "#0b0b10", gl: 0.44, bg: "#0b0b10", ink: "#ffffff", mute: "#e6e6f0", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.78)", tape: "#e8d9b0", te: "#bfae80", mt: "#8c8c95", hi: "#d6d6dc", dk: "#0c0c0e", l: 0.64, sm: 0.6, bs: 5, tt: 3, bd: 1, pf: 1 },
  gradl3:   { grp: "Gradient", cat: "Gradient · Dual & Triple",  n: "Triple cream → accent", grad: 1, gradType: "triple", gs: "#f5efe2", gl: 0.72, bg: "#f5efe2", ink: "#14121a", mute: "#34303f", ph: "rgba(0,0,0,.07)", frame: "rgba(0,0,0,.75)", tape: "#e6d6a8", te: "#b8a574", mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723", l: 0.42, sm: 0.6, bt: "#fff", bs: 5, pf: 2 },
  raddark:  { grp: "Gradient", cat: "Gradient · Radial",         n: "Radial dark spotlight", grad: 1, gradType: "radial", gs: "#09090d", gl: 0.36, bg: "#09090d", ink: "#ffffff", mute: "#e2e2ec", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.78)", tape: "#e8d9b0", te: "#bfae80", mt: "#8c8c95", hi: "#d6d6dc", dk: "#08080a", l: 0.65, sm: 0.55, bs: 4, tt: 3, bd: 1 },
  radlight: { grp: "Gradient", cat: "Gradient · Radial",         n: "Radial cream aura", grad: 1, gradType: "radial", gs: "#fffaf0", gl: 0.76, bg: "#fffaf0", ink: "#16141a", mute: "#3d3948", ph: "rgba(0,0,0,.07)", frame: "rgba(0,0,0,.75)", tape: "#e6d6a8", te: "#b8a574", mt: "#a39a88", hi: "#ffffff", dk: "#2a2723", l: 0.42, sm: 0.55, bt: "#fff", bs: 4, pf: 2 },
  radhalo:  { grp: "Gradient", cat: "Gradient · Radial",         n: "Radial club halo (Dark)", grad: 1, gradType: "radial", gradStops: ["#5a1846", "#1d1135", "#07060f"], gs: "#5a1846", gl: 0.35, bg: "#140d24", ink: "#ffffff", mute: "#e8d8ff", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.75)", tape: "#ffd166", te: "#c79a34", mt: "#8d7ab0", hi: "#f1d9ff", dk: "#07060f", l: 0.64, sm: 0.5 },
  radpearl: { grp: "Gradient", cat: "Gradient · Radial",         n: "Radial pastel aura (Light)", grad: 1, gradType: "radial", gradStops: ["#fff8f0", "#f4defa", "#d8ecff"], gs: "#fff8f0", gl: 0.85, bg: "#f4defa", ink: "#1a1528", mute: "#463d61", ph: "rgba(0,0,0,.06)", frame: "rgba(26,21,40,.75)", tape: "#ffd6e0", te: "#d9a2b1", mt: "#8d82a8", hi: "#ffffff", dk: "#241d38", l: 0.42, sm: 0.5, bt: "#fff" },
  tridusk:  { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Triple twilight (Dark)", grad: 1, gradType: "triple", gradStops: ["#0f0924", "#47194b", "#9e3022"], gs: "#0f0924", gl: 0.38, bg: "#2b1236", ink: "#ffffff", mute: "#f2d8d0", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.78)", tape: "#ffd166", te: "#c99a32", mt: "#a87082", hi: "#ffe0d6", dk: "#0a0618", l: 0.64, sm: 0.55 },
  aurora:   { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Aurora borealis (Dark)", grad: 1, gradType: "triple", gradStops: ["#06131f", "#0b3d4a", "#146652"], gs: "#06131f", gl: 0.30, bg: "#0b3d4a", ink: "#effffa", mute: "#c6f2e7", ph: "rgba(255,255,255,.1)", frame: "rgba(239,255,250,.75)", tape: "#9ef0d8", te: "#5eb89e", mt: "#679c92", hi: "#e6fff8", dk: "#040d14", l: 0.62, sm: 0.55 },
  cyber:    { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Cyberpunk mist (Dark)", grad: 1, gradType: "triple", gradStops: ["#080a1c", "#1c1450", "#591254"], gs: "#080a1c", gl: 0.32, bg: "#1c1450", ink: "#f5f0ff", mute: "#dcd0ff", ph: "rgba(255,255,255,.1)", frame: "rgba(245,240,255,.78)", tape: "#05ffa1", te: "#03b574", mt: "#8d7fc4", hi: "#e9dcff", dk: "#050612", l: 0.65, sm: 0.65 },
  ember:    { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Volcanic ember (Dark)", grad: 1, gradType: "triple", gradStops: ["#0f0708", "#471116", "#8c2419"], gs: "#0f0708", gl: 0.32, bg: "#471116", ink: "#fff5f0", mute: "#f5d0c6", ph: "rgba(255,255,255,.1)", frame: "rgba(255,245,240,.75)", tape: "#ffd166", te: "#c79a34", mt: "#a6645e", hi: "#ffe3d9", dk: "#0a0405", l: 0.62, sm: 0.6 },
  midnight: { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Midnight chrome (Dark)", grad: 1, gradType: "triple", gradStops: ["#090c12", "#1e2638", "#3f4b63"], gs: "#090c12", gl: 0.34, bg: "#1e2638", ink: "#f4f7fb", mute: "#cdd7e6", ph: "rgba(255,255,255,.1)", frame: "rgba(244,247,251,.78)", tape: "#d2d8e4", te: "#929db0", mt: "#7f8ba1", hi: "#eef2f8", dk: "#06080d", l: 0.68, sm: 0 },
  synth:    { grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Synthwave sunset (Dark)", grad: 1, gradType: "triple", gradStops: ["#120624", "#591254", "#9e2934"], gs: "#120624", gl: 0.35, bg: "#421048", ink: "#ffffff", mute: "#ffd6dc", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.78)", tape: "#01cdfe", te: "#0195ba", mt: "#a46d96", hi: "#ffdff0", dk: "#0b0317", l: 0.64, sm: 0.6 },
  prismatic:{ grp: "Gradient", cat: "Gradient · Dark Presets",   n: "Prismatic stage (Dark)", grad: 1, gradType: "multi", gradStops: ["#0d0f2b", "#2f1454", "#681448", "#143d52"], gs: "#0d0f2b", gl: 0.32, bg: "#2f1454", ink: "#ffffff", mute: "#e4defc", ph: "rgba(255,255,255,.1)", frame: "rgba(255,255,255,.75)", tape: "#e6d8ff", te: "#a791cc", mt: "#8d82b0", hi: "#f0ebff", dk: "#070817", l: 0.64, sm: 0.55 },
  tridawn:  { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Triple pastel dawn (Light)", grad: 1, gradType: "triple", gradStops: ["#ffe6ee", "#ffdec2", "#d8f3dc"], gs: "#ffe6ee", gl: 0.82, bg: "#ffdec2", ink: "#1b1926", mute: "#474259", ph: "rgba(0,0,0,.06)", frame: "rgba(27,25,38,.75)", tape: "#b9f0e0", te: "#7ec4b0", mt: "#8d8499", hi: "#ffffff", dk: "#241f30", l: 0.40, sm: 0.5, bt: "#fff" },
  peach:    { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Peach fuzz (Light)", grad: 1, gradType: "triple", gradStops: ["#fff5eb", "#ffd9c4", "#ffbfa6"], gs: "#fff5eb", gl: 0.84, bg: "#ffd9c4", ink: "#26140d", mute: "#5c3426", ph: "rgba(0,0,0,.06)", frame: "rgba(38,20,13,.75)", tape: "#e6b89c", te: "#b88467", mt: "#9e7767", hi: "#fffaf5", dk: "#2e1810", l: 0.38, sm: 0.55, bt: "#fff" },
  matcha:   { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Matcha mist (Light)", grad: 1, gradType: "triple", gradStops: ["#f5faf2", "#dcefd1", "#b7dfb9"], gs: "#f5faf2", gl: 0.80, bg: "#dcefd1", ink: "#102818", mute: "#2c5439", ph: "rgba(0,0,0,.06)", frame: "rgba(16,40,24,.75)", tape: "#d8c49a", te: "#ab976b", mt: "#6c9178", hi: "#f9fcf7", dk: "#0d2114", l: 0.36, sm: 0.5, bt: "#fff" },
  lavender: { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Lavender haze (Light)", grad: 1, gradType: "triple", gradStops: ["#f6f2ff", "#e5d8fc", "#d1befa"], gs: "#f6f2ff", gl: 0.82, bg: "#e5d8fc", ink: "#20133a", mute: "#4b3575", ph: "rgba(0,0,0,.06)", frame: "rgba(32,19,58,.75)", tape: "#fff3a8", te: "#d1c166", mt: "#8472a8", hi: "#fbf9ff", dk: "#170d2b", l: 0.40, sm: 0.5, bt: "#fff" },
  sunsetl:  { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Cotton candy (Light)", grad: 1, gradType: "triple", gradStops: ["#dff2ff", "#f3e1ff", "#ffdce8"], gs: "#dff2ff", gl: 0.86, bg: "#f3e1ff", ink: "#1e162e", mute: "#4d3e66", ph: "rgba(0,0,0,.06)", frame: "rgba(30,22,46,.75)", tape: "#ffeaa7", te: "#d4ba6a", mt: "#897ba1", hi: "#ffffff", dk: "#1d142b", l: 0.40, sm: 0.55, bt: "#fff" },
  hologram: { grp: "Gradient", cat: "Gradient · Light Presets",  n: "Iridescent pearl (Light)", grad: 1, gradType: "multi", gradStops: ["#e6f7ff", "#f7e8ff", "#fff1df", "#dffae9"], gs: "#e6f7ff", gl: 0.88, bg: "#f7e8ff", ink: "#181822", mute: "#44445a", ph: "rgba(0,0,0,.06)", frame: "rgba(24,24,34,.75)", tape: "#ffd6e0", te: "#cfa0ac", mt: "#83839c", hi: "#ffffff", dk: "#1f1f2b", l: 0.40, sm: 0.45, bt: "#fff" }
};

export const TF = {
  pirata:      { f: "'Pirata One',Georgia,serif", w: 400, s: 17, k: 0.58 },
  playfair:    { f: "'Playfair Display',Georgia,serif", w: 900, s: 15, k: 0.72 },
  georgia:     { f: "Georgia,'Palatino Linotype','Times New Roman',serif", w: 700, s: 15, k: 0.68 },
  mont:        { f: "Montserrat,Arial,sans-serif", w: 800, s: 15, k: 0.7 },
  trebuchet:   { f: "'Trebuchet MS','Gill Sans','Segoe UI',sans-serif", w: 700, s: 15, k: 0.64 },
  bebas:       { f: "'Bebas Neue',Impact,sans-serif", w: 400, s: 20, k: 0.44 },
  impact:      { f: "'Oswald','Impact','Arial Narrow Bold',sans-serif", w: 700, s: 18.5, k: 0.47 },
  script:      { f: "'Caveat','Segoe Script','Brush Script MT','Bradley Hand',cursive", w: 700, s: 19, k: 0.48 },
  calligraphy: { f: "'Great Vibes','Edwardian Script ITC','French Script MT','Lucida Calligraphy',cursive", w: 400, s: 18.5, k: 0.48 },
  brush:       { f: "'Dancing Script','Brush Script MT','Lucida Handwriting','Segoe Script',cursive", w: 700, s: 17.5, k: 0.52 },
  marker:      { f: "'Permanent Marker','Segoe Print','Ink Free','Comic Sans MS',cursive", w: 400, s: 15.5, k: 0.66 },
  type:        { f: "'Special Elite','Courier New',monospace", w: 400, s: 14, k: 0.66 },
  courier:     { f: "'Courier New',monospace", w: 700, s: 14, k: 0.68 },
  consolas:    { f: "'Space Mono','Consolas','Lucida Console',monospace", w: 700, s: 13.5, k: 0.68 }
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
  const gradStops = Array.isArray(C.gradStops) && C.gradStops.length >= 2 ? C.gradStops.slice(0, 4) : undefined;
  const baseBg = isGrad ? ((gradStops && gradStops[0]) || C.gs || C.bg) : C.bg;

  return {
    grp,
    n: C.name || "My theme",
    bg: baseBg,
    grad: isGrad ? 1 : 0,
    ...(C.gradType ? { gradType: C.gradType } : {}),
    ...(gradStops ? { gradStops } : {}),
    gs: (gradStops && gradStops[0]) || C.gs || baseBg,
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

export const THEME_GROUP_ORDER = [
  "Light · Classic & Paper",
  "Light · Pastel & Pop",
  "Dark · Moody & Ink",
  "Dark · Neon & Retro",
  "Gradient · Dual & Triple",
  "Gradient · Radial",
  "Gradient · Dark Presets",
  "Gradient · Light Presets",
  "Saved Custom",
  "Custom"
];

export function getGroupedThemes() {
  refreshSavedThemes();
  const groups = Object.fromEntries(THEME_GROUP_ORDER.map(lbl => [lbl, []]));
  Object.entries(THEMES).forEach(([key, theme]) => {
    const label = theme.cat || (theme.grp === "Saved Custom" ? "Saved Custom" : (theme.grp === "Custom" ? "Custom" : "Light · Classic & Paper"));
    if (!groups[label]) groups[label] = [];
    groups[label].push([key, theme]);
  });
  return Object.entries(groups).filter(([, list]) => list.length > 0);
}

export function renderThemeThumbSvg(key, theme, scope = "th") {
  const safeId = `${scope}-${String(key).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  let fillAttr = theme.bg || "#f2eadb";
  let defs = "";
  if (theme.grad) {
    const stops = Array.isArray(theme.gradStops) && theme.gradStops.length >= 2
      ? theme.gradStops
      : [theme.gs || theme.bg || "#0b0b10", mix(theme.gs || theme.bg || "#0b0b10", theme.fixed || (theme.gl > 0.5 ? "#d8c0a0" : "#ff5a36"), theme.gradType ? 0.55 : 0.85)];
    const stopMarkup = stops.map((col, idx) => `<stop offset="${(idx / (stops.length - 1)).toFixed(2)}" stop-color="${col}"/>`).join("");
    if (theme.gradType === "radial") {
      defs = `<defs><radialGradient id="${safeId}" cx="50%" cy="42%" r="65%">${stopMarkup}</radialGradient></defs>`;
    } else {
      defs = `<defs><linearGradient id="${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">${stopMarkup}</linearGradient></defs>`;
    }
    fillAttr = `url(#${safeId})`;
  }
  const acc = theme.fixed || (theme.grad && theme.gl > 0.5 ? "#b87449" : "#ff5a36");
  const ink = theme.ink || "#ffffff";
  const mute = theme.mute || ink;
  const ph = theme.ph || "rgba(128,128,128,0.22)";
  const frame = theme.frame || ink;
  if (theme.polaroid) {
    return `<svg class="theme-thumb-svg" viewBox="0 0 24 32" aria-hidden="true">${defs}<rect width="24" height="32" rx="1.8" fill="${fillAttr}" stroke="${frame}" stroke-width="0.7"/><rect x="2.2" y="2.4" width="19.6" height="19.6" fill="${ph}" stroke="#000" stroke-opacity=".2" stroke-width="0.5"/><rect x="5.5" y="24.6" width="13" height="2" rx="0.6" fill="${ink}"/><rect x="8.5" y="28" width="7" height="1.3" rx="0.5" fill="${mute}" opacity="0.8"/></svg>`;
  }
  return `<svg class="theme-thumb-svg" viewBox="0 0 24 32" aria-hidden="true">${defs}<rect width="24" height="32" rx="2.5" fill="${fillAttr}"/><rect x="1.6" y="1.6" width="20.8" height="28.8" rx="1.5" fill="none" stroke="${acc}" stroke-width="1"/><rect x="4" y="4" width="16" height="14.5" fill="${ph}" stroke="${frame}" stroke-width="0.6"/><rect x="4" y="21" width="7" height="2" rx="0.8" fill="${acc}"/><rect x="4" y="24.8" width="14" height="2" rx="0.5" fill="${ink}"/><rect x="4" y="28" width="10" height="1.2" rx="0.5" fill="${mute}" opacity="0.8"/></svg>`;
}

export function populateThemeSelect(selectEl, includeEmptyOption = false) {
  const grouped = getGroupedThemes();
  const prefix = includeEmptyOption ? '<option value="">Same as sheet</option>' : "";
  selectEl.innerHTML = prefix + grouped
    .map(([lbl, entries]) => `<optgroup label="${escapeHtml(lbl)}">${entries.map(([k, v]) => `<option value="${k}">${escapeHtml(v.n)}</option>`).join("")}</optgroup>`)
    .join("");
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Initialize registry on module load
buildCustom();
refreshSavedThemes();

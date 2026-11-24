// Core SVG Card, Stamp, Frame, Texture, Cut-Template & Cutter Renderer
import { THEMES, TF, lum, hslLum } from "./themes.js?v=phase7";
import { hsl } from "./image-utils.js?v=phase7";
import { hasBorderOverrides, renderBorder, resolveBorderConfig } from "./borders.mjs?v=phase7";
import { resolveStampTransform } from "./stamps.mjs?v=phase7";

export const CW = 170;
export const SIZES = {
  ticket: [59.97, 84.31],
  poker:  [63.5, 88.9],
  credit: [54, 85.6],
  mini:   [45, 64],
  tarot:  [70, 120]
};

export const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const U = t => esc(String(t).toUpperCase());
export const abbr = t => String(t || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
export const hueOf = t => [...String(t)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
export const fit = (t, max, w, k = 0.64) => Math.max(3.4, Math.min(max, w / (Math.max(t.length, 1) * k))).toFixed(1);
export const displayText = (t, n) => {
  t = String(t || "");
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

export function titleLayout(title, font, maxWidth = 136, scale = 1) {
  const clean = String(title || "Add name");
  const requestedScale = Number(scale);
  const boundedScale = Number.isFinite(requestedScale) ? Math.max(0.7, Math.min(1, requestedScale)) : 1;
  const scaledFont = { ...font, s: font.s * boundedScale };
  const singleSize = Number(fit(clean, scaledFont.s, maxWidth, scaledFont.k));
  if (singleSize >= scaledFont.s - 0.05) return { lines: [clean], size: singleSize, wrapped: false };

  const maxChars = Math.max(4, Math.floor(maxWidth / (scaledFont.s * scaledFont.k)));
  const words = clean.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  const pushWord = word => {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  };

  words.forEach(word => {
    if (word.length <= maxChars) {
      pushWord(word);
      return;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    for (let index = 0; index < word.length; index += maxChars) {
      const chunk = word.slice(index, index + maxChars);
      if (index + maxChars < word.length) lines.push(chunk);
      else current = chunk;
    }
  });
  if (current) lines.push(current);

  const twoLines = lines.length > 1 ? lines.slice(0, 2) : lines;
  const size = Math.max(3.4, Math.min(scaledFont.s,
    ...twoLines.map(line => Number(fit(line, scaledFont.s, maxWidth, scaledFont.k)))
  ));
  return { lines: twoLines, size, wrapped: lines.length > 1 };
}

const FT = 'font-family="Montserrat,Arial,sans-serif"';

export function computeLayout(paperVal = "a4", csizeVal = "ticket") {
  const isLetter = paperVal === "letter";
  const P = isLetter ? [612, 792] : [595.276, 841.89];
  const W = P[0], H = P[1];
  const S = SIZES[csizeVal] || SIZES.ticket;
  const K = S[0] * 2.83465 / CW;
  const CH = Math.max(204, Math.min(309, Math.round(S[1] * 2.83465 / K * 10) / 10));
  const CWp = CW * K, CHp = CH * K;
  const GX = 22, GY = 20;
  const COLS = Math.max(1, Math.floor((W - 28 + GX) / (CWp + GX)));
  const ROWS = Math.max(1, Math.floor((H - 28 + GY) / (CHp + GY)));
  const PER = COLS * ROWS;
  const MX = (W - COLS * CWp - (COLS - 1) * GX) / 2;
  const MY = (H - ROWS * CHp - (ROWS - 1) * GY) / 2;

  return { W, H, K, CH, CWp, CHp, GX, GY, COLS, ROWS, PER, MX, MY, isLetter };
}

export function fitBox(c, CH = 239) {
  if (!c.iw || !c.ih) return null;
  const ph = 136 + CH - 239;
  const k = Math.max(136 / c.iw, ph / c.ih) * (c.zm || 1);
  const w = c.iw * k, h = c.ih * k;
  return { w, h, mx: (w - 136) / 2, my: (h - ph) / 2 };
}

const inkFilter = (id, seed, wear) => {
  if (wear <= 0) return "";
  return `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${seed}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="r"/><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed + 8}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.4 0 0 0 -${(0.15 + wear / 100 * 1.1).toFixed(2)}" result="g"/><feComposite in="r" in2="g" operator="in"/></filter>`;
};

function tape(x, y, r, sd, T) {
  let q = ((sd + 3) * 7919) % 233280;
  const R = () => (q = (q * 9301 + 49297) % 233280) / 233280;
  const L = 13 + R() * 2.5, E = 13 + R() * 2.5, h = 4.6, n = 11, P = [];
  for (let k = 0; k <= 3; k++) P.push([-L + (L + E) * k / 3, -h + (R() - 0.5) * 0.5]);
  for (let k = 1; k < n; k++) P.push([E + (k % 2 ? -(0.8 + R() * 1.9) : (0.3 + R() * 1.1)), -h + 2 * h * k / n + (R() - 0.5) * 0.5]);
  for (let k = 3; k >= 0; k--) P.push([-L + (L + E) * k / 3, h + (R() - 0.5) * 0.5]);
  for (let k = n - 1; k > 0; k--) P.push([-L + (k % 2 ? (0.8 + R() * 1.9) : -(0.3 + R() * 1.1)), -h + 2 * h * k / n + (R() - 0.5) * 0.5]);
  const pts = P.map(v => v[0].toFixed(2) + "," + v[1].toFixed(2)).join(" ");
  return `<g transform="translate(${x} ${y}) rotate(${r})"><polygon points="${pts}" fill="${T.tape}" fill-opacity=".86" stroke="${T.te}" stroke-width=".3" stroke-opacity=".7" stroke-linejoin="round"/><path d="M${(-L + 3).toFixed(1)} -1.4H${(E - 3).toFixed(1)}" stroke="#fff" stroke-opacity=".2" stroke-width="1.3" stroke-linecap="round"/><path d="M${(-L + 4).toFixed(1)} 1.8h5M${(E - 9).toFixed(1)} 2.4h4" stroke="${T.te}" stroke-opacity=".35" stroke-width=".3"/></g>`;
}

function gradDir(ga, gd, CH) {
  const t = ga * Math.PI / 180, dx = Math.sin(t), dy = -Math.cos(t);
  const e = (Math.abs(dx) * CW + Math.abs(dy) * CH) / 2, L = 2 * e * gd / 100;
  const x2 = CW / 2 + dx * e, y2 = CH / 2 + dy * e;
  return `x1="${(x2 - dx * L).toFixed(1)}" y1="${(y2 - dy * L).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`;
}

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

export const STAMPS = {
  round:   { o: '<circle r="17" stroke-width="1"/><circle r="14.5" stroke-width=".5"/>', yr: -5, nm: 3, w: 22, r: "M-7 7h14" },
  oval:    { o: '<ellipse rx="19" ry="12" stroke-width="1"/><ellipse rx="16.5" ry="9.5" stroke-width=".5"/>', yr: -2.5, nm: 4, w: 24, r: "M-7 6.5h14" },
  rect:    { o: '<rect x="-19" y="-11" width="38" height="22" rx="1.5" stroke-width="1"/><rect x="-16.5" y="-8.5" width="33" height="17" rx="1" stroke-width=".5"/>', yr: -2.5, nm: 5, w: 30 },
  tri:     { o: '<path d="M0 -19L18 12H-18Z" stroke-width="1" stroke-linejoin="round"/><path d="M0 -14.9L14.4 9.9H-14.4Z" stroke-width=".5" stroke-linejoin="round"/>', yr: 1, nm: 7.2, w: 19, ys: 3.4 },
  shield:  { o: '<path d="M-14 -15H14V2Q14 12 0 18Q-14 12 -14 2Z" stroke-width="1" stroke-linejoin="round"/><path d="M-11.5 -12.5H11.5V1.5Q11.5 9.5 0 14.8Q-11.5 9.5 -11.5 1.5Z" stroke-width=".5" stroke-linejoin="round"/>', yr: -6, nm: 1, w: 20, r: "M-6 4.5h12" },
  hex:     { o: `<polygon points="${hexp(17)}" stroke-width="1" stroke-linejoin="round"/><polygon points="${hexp(14.5)}" stroke-width=".5" stroke-linejoin="round"/>`, yr: -5, nm: 3, w: 22, r: "M-7 7h14" },
  diamond: { o: '<path d="M0 -19L19 0L0 19L-19 0Z" stroke-width="1" stroke-linejoin="round"/><path d="M0 -15.6L15.6 0L0 15.6L-15.6 0Z" stroke-width=".5" stroke-linejoin="round"/>', yr: -4.5, nm: 2.5, w: 20, r: "M-4.5 6.5h9" },
  seal:    { o: `<polygon points="${star(16, 17.6, 15.2)}" stroke-width=".9" stroke-linejoin="round"/><circle r="12.8" stroke-width=".5"/>`, yr: -4.5, nm: 3, w: 19, r: "M-6 6.5h12" },
  starburst: { o: `<polygon points="${star(12, 20, 14.5)}" stroke-width="1" stroke-linejoin="round"/><circle r="12" stroke-width=".5"/>`, yr: -4.5, nm: 3.5, w: 20, r: "M-6.5 7h13" },
  scallop: { o: `<polygon points="${star(20, 17.8, 16.2)}" stroke-width=".9" stroke-linejoin="round"/><circle r="13.5" stroke-width=".5"/>`, yr: -5, nm: 3, w: 20, r: "M-6 7h12" },
  ticket: { o: '<path d="M-20 -12H20V-7A7 7 0 0 0 20 7V12H-20V7A7 7 0 0 0-20-7Z" stroke-width="1" stroke-linejoin="round"/><rect x="-16.5" y="-8.5" width="33" height="17" rx="2" stroke-width=".5"/><path d="M-12 -5V5M12 -5V5" stroke-width=".5"/>', yr: -3, nm: 5.5, w: 27, r: "M-7 8h14" },
  arch: { o: '<path d="M-18 13V-3A18 18 0 0 1 18-3V13Z" stroke-width="1" stroke-linejoin="round"/><path d="M-14.5 10V-2A14.5 14.5 0 0 1 14.5-2V10Z" stroke-width=".5"/>', yr: -5, nm: 3, w: 21, r: "M-6 6.5h12" },
  ribbon: { o: '<path d="M-18 -12H18V8H7L4 14L0 8H-18Z" stroke-width="1" stroke-linejoin="round"/><rect x="-15" y="-9" width="30" height="14" rx="1" stroke-width=".5"/>', yr: -4, nm: 4.5, w: 25, r: "M-7 7h14" },
  burst: { o: `<polygon points="${star(16, 21, 17)}" stroke-width=".9" stroke-linejoin="round"/><circle r="13" stroke-width=".5"/>`, yr: -4.5, nm: 3.5, w: 19, r: "M-6 7h12" },
  cross: { o: '<path d="M-7 -18H7V-7H18V7H7V18H-7V7H-18V-7H-7Z" stroke-width="1" stroke-linejoin="round"/><path d="M-4.5 -14.5H4.5V-4.5H14.5V4.5H4.5V14.5H-4.5V4.5H-14.5V-4.5H-4.5Z" stroke-width=".5"/>', yr: -4.5, nm: 3.5, w: 19, r: "M-5.5 7h11" }
};
export const SKINDS = Object.keys(STAMPS);

function mount(tt, PX, PY, PS, PB, odd, i, A, T) {
  if (Array.isArray(T.mounts)) {
    return T.mounts.slice(0, 2).map((mountType, mountIndex) =>
      mountSingle(mountType, PX, PY, PS, PB, odd ^ (mountIndex === 1), i + mountIndex * 11, A, T)
    ).join("");
  }
  return mountSingle(tt, PX, PY, PS, PB, odd, i, A, T);
}

function mountSingle(tt, PX, PY, PS, PB, odd, i, A, T) {
  if (tt === 3) return "";
  if (tt === 1) {
    return [[PX + 5, PY + 5], [PX + PS - 5, PY + 5]].map(([a, b]) =>
      `<g><circle cx="${a + 0.6}" cy="${b + 1}" r="3.4" fill="#000" opacity=".3"/><circle cx="${a}" cy="${b}" r="3.4" fill="${A}" stroke="#000" stroke-opacity=".35" stroke-width=".4"/><circle cx="${a - 0.8}" cy="${b - 0.9}" r="1.1" fill="#fff" opacity=".6"/></g>`
    ).join("");
  }
  if (tt === 2) {
    return [[PX, PY, 1, 1], [PX + PS, PY, -1, 1], [PX, PB, 1, -1], [PX + PS, PB, -1, -1]].map(([a, b, dx, dy]) =>
      `<path d="M${a} ${b}h${dx * 14}l${-dx * 14} ${dy * 14}z" fill="${T.tape}" stroke="${T.te}" stroke-width=".4"/>`
    ).join("");
  }
  if (tt === 4) {
    const strips = odd ? [[PX + PS - 2, PY + 2, 34], [PX + 2, PB - 2, 34]] : [[PX + 2, PY + 2, -34], [PX + PS - 2, PB - 2, -34]];
    return strips.map(([wx, wy, wr]) =>
      `<g transform="translate(${wx} ${wy}) rotate(${wr})"><rect x="-12" y="-3.8" width="24" height="7.6" rx=".6" fill="${T.tape}" fill-opacity=".75" stroke="${T.te}" stroke-width=".3"/><path d="M-9 -3.8L-6 3.8M-3 -3.8L0 3.8M3 -3.8L6 3.8M9 -3.8L11.5 2.4" stroke="${A}" stroke-width="1.3" stroke-opacity=".55"/></g>`
    ).join("");
  }
  if (tt === 5) {
    return [[PX + 4.5, PY + 4.5], [PX + PS - 4.5, PY + 4.5], [PX + 4.5, PB - 4.5], [PX + PS - 4.5, PB - 4.5]].map(([bx, by], k) =>
      `<g transform="translate(${bx} ${by}) rotate(${(i * 37 + k * 53) % 180})"><circle cx=".3" cy=".5" r="2.6" fill="#000" opacity=".28"/><circle r="2.6" fill="${T.mt}" stroke="${T.dk}" stroke-width=".35"/><circle r="1.8" fill="none" stroke="${T.hi}" stroke-width=".3" opacity=".75"/><path d="M-1.5 0H1.5" stroke="${T.dk}" stroke-width=".45"/></g>`
    ).join("");
  }
  if (tt === 6) {
    const cx = odd ? PX + PS - 22 : PX + 22;
    return `<g transform="translate(${cx} ${PY})"><path d="M-3 12V-2.5A3.2 3.2 0 0 1 3.4-2.5V14.5A2.2 2.2 0 0 1-1 14.5V1.5A1.2 1.2 0 0 1 1.4 1.5V11" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.4" stroke-linecap="round" transform="translate(.6 .8)"/><path d="M-3 12V-2.5A3.2 3.2 0 0 1 3.4-2.5V14.5A2.2 2.2 0 0 1-1 14.5V1.5A1.2 1.2 0 0 1 1.4 1.5V11" fill="none" stroke="${T.hi}" stroke-width="1.15" stroke-linecap="round"/><path d="M-3 12V-2.5A3.2 3.2 0 0 1 3.4-2.5V14.5" fill="none" stroke="${T.mt}" stroke-width=".45" stroke-linecap="round"/></g>`;
  }
  if (tt === 7) {
    return [[PX + 9, PY + 5, -35], [PX + PS - 9, PY + 5, 35]].map(([sx, sy, sr]) =>
      `<g transform="translate(${sx} ${sy}) rotate(${sr})"><circle cx="-4.2" cy=".4" r=".7" fill="#000" opacity=".4"/><circle cx="4.2" cy=".4" r=".7" fill="#000" opacity=".4"/><path d="M-4.2 .4H4.2" stroke="#000" stroke-opacity=".35" stroke-width="1.1" stroke-linecap="round" transform="translate(.4 .6)"/><path d="M-4.2 0H4.2" stroke="${T.hi}" stroke-width="1.05" stroke-linecap="round"/><path d="M-3.4 -.2H3.4" stroke="#fff" stroke-opacity=".5" stroke-width=".35" stroke-linecap="round"/></g>`
    ).join("");
  }
  if (tt === 8) {
    const wx = odd ? PX + 11 : PX + PS - 11, wy = PB - 10;
    return `<g transform="translate(${wx} ${wy})"><circle cx=".8" cy="1" r="6.8" fill="#000" opacity=".28"/><path d="M0 -7.2Q4.2 -7.4 6.5 -3.6Q7.8 .5 5.4 4.8Q2 7.5 -2.8 6.4Q-7 4.4 -6.8 -0.6Q-6.2 -5.8 0 -7.2Z" fill="${A}" stroke="#000" stroke-opacity=".35" stroke-width=".45"/><circle r="4.5" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".55"/><circle r="4.1" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width=".35"/></g>`;
  }
  return odd
    ? tape(PX + PS - 2, PY + 2, 35, i * 2, T) + tape(PX + 2, PB - 2, 35, i * 2 + 1, T)
    : tape(PX + 2, PY + 2, -35, i * 2, T) + tape(PX + PS - 2, PB - 2, -35, i * 2 + 1, T);
}

/**
 * Renders a single SVG <g> card element
 * @param {Object} c0 - Card data
 * @param {Number} i - Card index
 * @param {Object} cfg - Global rendering settings & layout
 */
export function renderCard(c0, i, cfg) {
  const { K = 1, CH = 239, COLS = 3, PER = 9, GX = 22, GY = 20, MX = 0, MY = 0, CWp = 170, CHp = 239 } = cfg.lay || {};
  const c = {
    ...c0,
    title: c0.title || "Add name",
    genre: c0.genre || "Genre",
    loc: c0.loc || "Place",
    year: c0.year || "Year"
  };

  const li = i % PER, col = li % COLS, row = Math.floor(li / COLS);
  const x = cfg.one ? 0 : MX + col * (CWp + GX);
  const y = cfg.one ? 0 : MY + row * (CHp + GY);
  const bl = cfg.one ? 0 : (cfg.bleed ? 3 / K : 0);
  const D = CH - 239;

  const T = cfg.themeObj || THEMES[cfg.themeForce || c0.theme || cfg.style] || THEMES.cream;
  const design = {
    borderStyle: cfg.borderStyle ?? 0,
    photoMounts: Array.isArray(cfg.photoMounts) ? cfg.photoMounts.slice(0, 2) : [0],
    yearBadge: cfg.yearBadge ?? 0,
    tearStyle: cfg.tearStyle ?? 0,
    centerTitle: Boolean(cfg.centerTitle),
    photoFilter: cfg.photoFilter ?? 0,
    halftone: Boolean(cfg.halftone)
  };
  const effS = Math.min(1, Math.max(T.sm || 0, c.s ?? 0.75));
  const effL = T.l || 0.52;
  const A = T.fixed || hsl(c.h ?? 35, effS, effL);
  const bgF = T.grad ? `url(#bgg${i})` : T.bg;
  const ink = T.ink, mute = T.mute;

  const accLum = T.fixed ? lum(T.fixed) : hslLum(c.h ?? 35, effS, effL);
  const bt = T.bt || (accLum > 0.52 ? "#111" : "#fff");

  const odd = i % 2, PX = 17, PY = 16, PS = 136, PH = 136 + D, PB = PY + PH, PM = PX + PS / 2, PMY = PY + PH / 2;

  const b = c.img && fitBox(c, CH);
  const ph = c.img
    ? `<g clip-path="url(#cc${i})"><image id="photo${i}" href="${esc(c.img)}" ${b ? `x="${(PX + PS / 2 - b.w / 2 + (c.px || 0) / 100 * b.mx).toFixed(2)}" y="${(PMY - b.h / 2 + (c.py || 0) / 100 * b.my).toFixed(2)}" width="${b.w.toFixed(2)}" height="${b.h.toFixed(2)}" preserveAspectRatio="xMidYMid slice"` : `x="${PX}" y="${PY}" width="${PS}" height="${PH}" preserveAspectRatio="xMidYMid slice"`}${design.photoFilter ? ` filter="url(#np${i})"` : ""}/></g>`
    : `<rect x="${PX}" y="${PY}" width="${PS}" height="${PH}" fill="${T.ph}"/><text x="${PM}" y="${PMY}" text-anchor="middle" fill="${A}" font-size="9" ${FT}>Add photo</text>`;

  const tp = mount(0, PX, PY, PS, PB, odd, i, A, { ...T, mounts: design.photoMounts });
  const ss = (cfg.stampSize || 100) / 100;
  const rn = k => { const v = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

  const skw = c0.sk || cfg.stampShape || "round";
  const sk = skw === "mixed" ? SKINDS[Math.floor(rn(4) * SKINDS.length)] : skw;
  const sd = STAMPS[sk] || STAMPS.round;
  const sco = cfg.stampAuto ? A : (cfg.stampColor || "#d9322f");

  const mkS = (d, txt, yr, sz, px, py, r, si) =>
    `<g${cfg.moveStamps && !cfg.one ? ` id="st${si}-${i}"` : ""}${(cfg.stampWear || 0) > 0 ? ` filter="url(#ink${i})"` : ""} transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${sz})" fill="none" stroke="${sco}" opacity=".95">${d.o}${yr ? `<text y="${d.yr}" text-anchor="middle" fill="${sco}" stroke="none" font-size="${d.ys || 4}" font-weight="700" ${FT}>${U(yr)}</text>` : ""}<text y="${d.nm}" text-anchor="middle" fill="${sco}" stroke="none" font-size="${fit(txt, 5.4, d.w, 0.7)}" font-weight="800" ${FT}>${U(txt)}</text>${d.r ? `<path d="${d.r}" stroke-width=".5"/>` : ""}</g>`;

  const st0 = resolveStampTransform({ index: i, stampIndex: 0, CW, CH, stampSize: cfg.stampSize || 100, override: c0.stampPos });
  const st1 = resolveStampTransform({ index: i, stampIndex: 1, CW, CH, stampSize: cfg.stampSize || 100, override: c0.stamp2Pos });
  const st0Scale = st0.isOverridden ? Number(st0.scale.toFixed(3)) : ss;
  const st1Scale = st1.isOverridden ? Number(st1.scale.toFixed(3)) : ss * 0.85;

  const stamp = skw === "none" ? "" : mkS(sd, c0.stx || cfg.stamp || "Soul Fuel", cfg.stampYear || "2026", st0Scale, st0.x, st0.y, st0.r, 0);
  const stamp2 = cfg.stamp2 ? mkS(STAMPS.rect, cfg.stamp2, "", st1Scale, st1.x, st1.y, st1.r, 1) : "";

  const mkStUi = (si, st, sz) => {
    const bw = Math.max(28, 42 * sz);
    const bh = Math.max(28, 36 * sz);
    const hw = Math.max(74, bw + 12);
    const hh = Math.max(74, bh + 12);
    const isSel = cfg.selectedCard === i && (cfg.selectedStamp ?? 0) === si;
    const label = `Card ${i + 1} ${si === 0 ? "primary" : "second"} stamp position`;
    const vText = `${Math.round(st.nx * 100)}% across, ${Math.round(st.ny * 100)}% down, ${Math.round(st.r)} degrees`;
    return `<g class="st-ui${isSel ? " is-selected" : ""}" data-ci="${i}" data-si="${si}" transform="translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)})"><rect class="st-outline" x="${(-bw / 2).toFixed(1)}" y="${(-bh / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3"/><line class="st-rot-stem" x1="0" y1="${(-bh / 2).toFixed(1)}" x2="0" y2="${(-bh / 2 - 14).toFixed(1)}"/><rect class="st-hit" data-ci="${i}" data-si="${si}" tabindex="0" role="slider" aria-label="${label}" aria-valuetext="${vText}" x="${(-hw / 2).toFixed(1)}" y="${(-hh / 2).toFixed(1)}" width="${hw.toFixed(1)}" height="${hh.toFixed(1)}" fill="transparent"/><circle class="st-rot-hit" data-ci="${i}" data-si="${si}" cx="0" cy="${(-bh / 2 - 14).toFixed(1)}" r="20" fill="transparent"/><circle class="st-rot-knob" cx="0" cy="${(-bh / 2 - 14).toFixed(1)}" r="4.8"/></g>`;
  };
  const stampUi = cfg.moveStamps && !cfg.one
    ? `${skw === "none" ? "" : mkStUi(0, st0, st0Scale)}${cfg.stamp2 ? mkStUi(1, st1, st1Scale) : ""}`
    : "";

  const tf = TF[cfg.titleFont] || TF.pirata;
  const lumB = lum(T.bg), dkp = lumB < 0.45, tcol = dkp ? "#fff" : "#3a2a18";
  const tr = dkp ? 1 : 0.15, tg = dkp ? 1 : 0.1, tb = dkp ? 1 : 0.05;

  const serial = cfg.serials ? `<text x="${CW - 17}" y="${158.5 + D}" text-anchor="end" fill="${mute}" opacity=".85" font-size="3.8" font-weight="700" letter-spacing=".5" ${FT}>№ ${String(i + 1).padStart(4, "0")}</text>` : "";

  let cre = "";
  const crVal = cfg.creases || 0;
  if (crVal) {
    const o = (crVal / 100 * 0.5).toFixed(2);
    for (let k = 0; k < (crVal > 60 ? 2 : 1); k++) {
      const v = k ? 1 : rn(6) < 0.5, pp = 0.28 + rn(7 + k) * 0.44, q = (rn(9 + k) - 0.5) * 26;
      const d2 = v ? `M${CW * pp} 0L${CW * pp + q} ${CH}` : `M0 ${CH * pp}L${CW} ${CH * pp + q}`;
      cre += `<path d="${d2}" stroke="${tcol}" stroke-width=".5" opacity="${o}" fill="none"/><path d="${d2}" transform="translate(${v ? 0.7 : 0} ${v ? 0 : 0.7})" stroke="${dkp ? "#000" : "#fff"}" stroke-width=".4" opacity="${(o * 0.9).toFixed(2)}" fill="none"/>`;
    }
  }

  const grVal = cfg.grain || 0, ewVal = cfg.edgeWear || 0, scVal = cfg.scuffs || 0;
  let texDefs = "";
  if (grVal) texDefs += `<filter id="gr${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${i + 5}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 1.6 0 0 0 -.45"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
  if (scVal) texDefs += `<filter id="sc${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .7" numOctaves="2" seed="${i + 9}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 7 0 0 0 -4.1"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
  if (ewVal) texDefs += `<filter id="ew${i}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>`;

  const tex = (grVal || ewVal || crVal || scVal)
    ? `<g clip-path="url(#ck${i})" pointer-events="none">${texDefs ? `<defs>${texDefs}</defs>` : ""}${grVal ? `<rect width="${CW}" height="${CH}" fill="#000" filter="url(#gr${i})" opacity="${(grVal / 100 * 0.55).toFixed(2)}"/>` : ""}${ewVal ? `<rect width="${CW}" height="${CH}" fill="none" stroke="${tcol}" stroke-width="12" filter="url(#ew${i})" opacity="${(ewVal / 100 * 0.55).toFixed(2)}"/>` : ""}${scVal ? `<g transform="rotate(${Math.round(rn(5) * 60 - 30)} ${CW / 2} ${CH / 2})"><rect x="-60" y="-60" width="${CW + 120}" height="${CH + 120}" fill="#000" filter="url(#sc${i})" opacity="${(scVal / 100 * 0.7).toFixed(2)}"/></g>` : ""}${cre}</g>`
    : "";

  let nfc = "";
  if (cfg.nfc) {
    let ar = "";
    for (let k = 1; k <= 3; k++) {
      const px = 7 + k * 2.6, h = 2 + k * 1.5;
      ar += `<path d="M${px} ${-h}Q${(px + h * 0.8).toFixed(1)} 0 ${px} ${h}" fill="none" stroke="${A}" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    nfc = `<g transform="translate(${CW - 38} ${209 + D})"><circle r="5.6" fill="${T.nc || "#d9322f"}"/><circle r="4" fill="none" stroke="${T.np || "#fff"}" stroke-width=".7"/><path d="M-1.2 -2L2 0L-1.2 2Z" fill="${T.np || "#fff"}"/>${ar}</g>`;
  }
  if (cfg.punchHole) {
    nfc += `<g aria-label="NFC punch hole" transform="translate(${CW / 2} ${PMY})"><circle r="3.4" fill="#fff" stroke="${T.frame}" stroke-width=".6"/><circle r="1.7" fill="#e7e4dc" stroke="${A}" stroke-width=".35"/></g>`;
  }

  let mk = "";
  if (cfg.cropMarks && !cfg.one) {
    [[0, 0, -1, -1], [CW, 0, 1, -1], [0, CH, -1, 1], [CW, CH, 1, 1]].forEach(([mx, my, dx, dy]) => {
      const o = bl + 2;
      mk += `<path d="M${mx + dx * o} ${my}h${dx * 7}M${mx} ${my + dy * o}v${dy * 7}" stroke="#000" stroke-width=".4" fill="none"/>`;
    });
  }

  const gl = `${c.genre} // ${c.loc}`;
  const no = `NO. ${c0.year || "0000"}-${c0.code || abbr(c0.title) || "XXXX"}`;

  let sc = "";
  [[9, 9], [CW - 9, 9], [9, CH - 9], [CW - 9, CH - 9]].forEach(([bx, by], k) => {
    const ang = (i * 47 + k * 61) % 180, mt = T.mt, hi = T.hi, dk = T.dk, ph = (i + k) % 2;
    sc += `<g transform="translate(${bx} ${by})"><circle cx=".35" cy=".5" r="2.5" fill="#000" opacity=".3"/><circle r="2.5" fill="${mt}" stroke="${dk}" stroke-width=".35"/><circle r="1.9" fill="none" stroke="${hi}" stroke-width=".3" opacity=".7"/><circle cx="-.7" cy="-.8" r=".7" fill="${hi}" opacity=".55"/><g transform="rotate(${ang})" stroke="${dk}" stroke-width=".42" stroke-linecap="round"><path d="M-1.5 0H1.5"/>${ph ? '<path d="M0 -1.5V1.5"/>' : ''}</g></g>`;
  });

  const bw = `EST. ${c.year}`.length * 4.5, bdg = design.yearBadge, pf = design.tearStyle, tcn = design.centerTitle ? 1 : 0;
  const tx = tcn ? CW / 2 : 17, ta = tcn ? ' text-anchor="middle"' : "";
  const badge = `<rect x="17" y="168" width="${(bw + 9).toFixed(1)}" height="10" rx="${bdg === 1 ? 5 : 0}" fill="${bdg === 2 ? "none" : A}"${bdg === 2 ? ` stroke="${A}" stroke-width=".8"` : ""}/><text x="21.5" y="175.2" fill="${bdg === 2 ? A : bt}" font-size="6" font-weight="800" textLength="${bw.toFixed(1)}" lengthAdjust="spacingAndGlyphs" ${FT}>EST. ${esc(c.year)}</text>`;
  const perf = `<path d="M9 161H${CW - 9}" stroke="${mute}" stroke-width="${pf === 1 ? 1.3 : 0.6}"${pf === 0 ? ' stroke-dasharray="2 2"' : pf === 1 ? ' stroke-dasharray="0.1 3" stroke-linecap="round"' : ""}/>` + (pf === 2 ? "" : `<circle cx="0" cy="161" r="3.6" fill="#fff"/><circle cx="${CW}" cy="161" r="3.6" fill="#fff"/>`);
  const drag = cfg.drag && !cfg.one ? `<rect class="pp" data-ci="${i}" x="${PX}" y="${PY}" width="${PS}" height="${PH}" fill="transparent"/>` : "";

  const cleanTitle = String(c.title || "Add name");
  const titleLayoutResult = titleLayout(cleanTitle, tf, 136, cfg.titleScale ?? 0.85);
  const titleLines = titleLayoutResult.lines;
  const titleSize = titleLayoutResult.size;
  const titleMarkup = titleLayoutResult.wrapped
    ? titleLines.map((line, lineIndex) =>
        `<text x="${tx}" y="${(191 + lineIndex * 11).toFixed(1)}"${ta} fill="${ink}" font-family="${tf.f}" font-weight="${tf.w}" font-size="${titleSize.toFixed(1)}" letter-spacing=".6">${U(line)}</text>`
      ).join("")
    : `<text x="${tx}" y="199"${ta} fill="${ink}" font-family="${tf.f}" font-weight="${tf.w}" font-size="${titleSize.toFixed(1)}" letter-spacing=".6">${U(titleLines[0])}</text>`;

  const resolvedBorder = resolveBorderConfig(cfg, c0);
  const borderRendered = renderBorder({
    index: i,
    CW,
    CH,
    accent: A,
    theme: T,
    border: resolvedBorder,
    scope: cfg.borderScope || "",
    seed: i + 21
  });

  if (cfg.minimalLayout === true) {
    const useCustomMinimalBorder = resolvedBorder.style !== 0 || hasBorderOverrides(resolvedBorder);
    const minimalBorderDefs = useCustomMinimalBorder ? borderRendered.defs : "";
    const minimalBorderMarkup = useCustomMinimalBorder
      ? borderRendered.markup
      : `<rect x=".25" y=".25" width="${CW - 0.5}" height="${CH - 0.5}" fill="none" stroke="${T.frame}" stroke-width=".5"/>`;
    const minimalTitleMarkup = titleLayoutResult.wrapped
      ? titleLines.map((line, lineIndex) => `<text x="17" y="${(188 + lineIndex * 11 + D).toFixed(1)}" fill="${ink}" font-family="${tf.f}" font-weight="${tf.w}" font-size="${titleSize.toFixed(1)}">${esc(line)}</text>`).join("")
      : `<text x="17" y="${188 + D}" fill="${ink}" font-family="${tf.f}" font-weight="${tf.w}" font-size="${titleSize.toFixed(1)}">${esc(titleLines[0])}</text>`;
    return `<g data-ci="${i}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${cfg.one ? 1 : K})"><defs>${minimalBorderDefs}<clipPath id="cc${i}"><rect x="${PX}" y="${PY}" width="${PS}" height="${PH}"/></clipPath><clipPath id="ck${i}"><rect x="${-bl}" y="${-bl}" width="${CW + 2 * bl}" height="${CH + 2 * bl}"/></clipPath></defs><g clip-path="url(#ck${i})"><rect x="${-bl}" y="${-bl}" width="${CW + 2 * bl}" height="${CH + 2 * bl}" fill="${bgF}"/></g>${minimalBorderMarkup}${ph}${minimalTitleMarkup}<text x="17" y="${201 + D}" fill="${mute}" font-size="${fit(gl, 5.6, 96)}" font-weight="500" letter-spacing=".3" ${FT}>${esc(gl)}</text><text x="17" y="${CH - 13}" fill="${mute}" font-size="5" font-weight="500" letter-spacing=".5" ${FT}>${esc(c.year)}</text>${nfc}${tex}${drag}${mk}</g>`;
  }

  const gradDef = T.grad ? `<linearGradient id="bgg${i}" gradientUnits="userSpaceOnUse" ${gradDir(cfg.gradientAngle ?? 180, cfg.gradientSpread ?? 32, CH)}><stop offset="0" stop-color="${T.gs}"/><stop offset="1" stop-color="${hsl(c.h ?? 35, Math.min(1, Math.max(0.5, c.s ?? 0.75)), T.gl)}"/></linearGradient>` : "";
  const grayDef = design.photoFilter ? `<filter id="np${i}" color-interpolation-filters="sRGB">${design.photoFilter === 2 ? `<feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0 0.349 0.686 0.168 0 0 0.272 0.534 0.131 0 0 0 0 0 1 0"/>` : `<feColorMatrix type="saturate" values="0"/>`}<feComponentTransfer><feFuncR type="linear" slope="1.3" intercept="-.12"/><feFuncG type="linear" slope="1.3" intercept="-.12"/><feFuncB type="linear" slope="1.3" intercept="-.12"/></feComponentTransfer></filter>` : "";
  const halftoneDef = design.halftone ? `<pattern id="ht${i}" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="1.2" cy="1.2" r=".6" fill="#000" opacity=".3"/></pattern>` : "";
  const borderDefs = borderRendered.isLegacy ? inkFilter("bd" + i, i + 21, cfg.borderWear || 0) : borderRendered.defs;

  return `<g data-ci="${i}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${cfg.one ? 1 : K})">
   <defs>${gradDef}${inkFilter("ink" + i, i + 3, cfg.stampWear || 0)}${borderDefs}${grayDef}${halftoneDef}
   <clipPath id="cc${i}"><rect x="${PX}" y="${PY}" width="${PS}" height="${PH}"/></clipPath>
   <clipPath id="ck${i}"><rect x="${-bl}" y="${-bl}" width="${CW + 2 * bl}" height="${CH + 2 * bl}"/></clipPath></defs>
   <g clip-path="url(#ck${i})"><rect x="${-bl}" y="${-bl}" width="${CW + 2 * bl}" height="${CH + 2 * bl}" fill="${bgF}"/></g>
   ${borderRendered.markup}${sc}
   <text x="17" y="11.5" fill="${A}" font-size="5.2" font-weight="800" letter-spacing=".5" ${FT}>★ ADMIT ONE</text>
   <text x="${CW - 17}" y="11.5" text-anchor="end" fill="${ink}" font-size="5.2" font-weight="800" letter-spacing=".4" ${FT}>${U(cfg.doors || "Doors 7PM")}</text>
   <text transform="translate(13 ${PMY}) rotate(-90)" text-anchor="middle" fill="${mute}" font-size="4.4" font-weight="700" letter-spacing=".6" ${FT}>${U(no)}</text>
   <text transform="translate(${CW - 13} ${PMY}) rotate(90)" text-anchor="middle" fill="${A}" font-size="4.4" font-weight="700" letter-spacing=".6" ${FT}>${U(cfg.side || "Dope-Amine")}</text>
   ${ph}${design.halftone ? `<rect x="${PX}" y="${PY}" width="${PS}" height="${PH}" fill="url(#ht${i})"/>` : ""}<rect x="${PX}" y="${PY}" width="${PS}" height="${PH}" fill="none" stroke="${T.frame}" stroke-width="1"/>${tp}
   <g transform="translate(0 ${D})">${perf}
   ${badge}
   <text x="${CW - 17}" y="175.2" text-anchor="end" fill="${A}" font-size="5.2" font-weight="800" letter-spacing=".5" ${FT}>AUDIO PASS</text>
   ${titleMarkup}
   <text x="${tx}" y="214"${ta} fill="${mute}" font-size="${fit(gl, 5.8, tcn ? 72 : 96)}" font-weight="700" letter-spacing=".4" ${FT}>${U(gl)}</text>
   </g>${nfc}${serial}${tex}${stamp}${stamp2}${drag}${mk}${stampUi}</g>`;
}

export function regMarksSvg(W, H, enabled) {
  if (!enabled) return "";
  const m = 14, len = 28;
  return `<g stroke="#000" stroke-width="1.2" fill="none">
    <rect x="${m}" y="${m}" width="12" height="12" fill="#000"/>
    <path d="M${W - m - len} ${m}H${W - m}V${m + len}"/>
    <path d="M${m} ${H - m - len}V${H - m}H${m + len}"/>
    <path d="M${W - m - len} ${H - m}H${W - m}V${H - m - len}"/>
  </g>`;
}

export function tplSvg(lay, regEnabled = false) {
  const { W, H, K, CH, COLS, PER, GX, GY, MX, MY, CWp, CHp } = lay;
  let o = "";
  const D = CH - 239;
  for (let j = 0; j < PER; j++) {
    const x = (MX + (j % COLS) * (CWp + GX)).toFixed(2);
    const y = (MY + Math.floor(j / COLS) * (CHp + GY)).toFixed(2);
    const cx = 17 + 68, cy = 16 + (136 + D) / 2;
    o += `<g transform="translate(${x} ${y}) scale(${K})"><rect width="${CW}" height="${CH}" fill="none" stroke="#000" stroke-width=".6"/><rect x="17" y="16" width="136" height="${136 + D}" fill="none" stroke="#555" stroke-width=".5" stroke-dasharray="3 2"/><path d="M${cx - 4.5} ${cy}h9M${cx} ${cy - 4.5}v9" stroke="#d9322f" stroke-width=".6"/><text x="${cx}" y="${cy + 9}" text-anchor="middle" fill="#d9322f" font-size="4.2" font-weight="800" ${FT}>POKE ME</text></g>`;
  }
  return `<svg class="sheet" data-name="cut-template" width="${(W / 2.83465).toFixed(2)}mm" height="${(H / 2.83465).toFixed(2)}mm" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#fff"/>${regMarksSvg(W, H, regEnabled)}${o}</svg>`;
}

export function cutSvg(lay, cornerRadiusMm = 0, regEnabled = false) {
  const { W, H, K, CH, COLS, PER, GX, GY, MX, MY, CWp, CHp } = lay;
  const D = CH - 239, rx = (+cornerRadiusMm) * 2.83465;
  let c = "", p = "";
  for (let j = 0; j < PER; j++) {
    const x = MX + (j % COLS) * (CWp + GX), y = MY + Math.floor(j / COLS) * (CHp + GY);
    c += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${CWp.toFixed(2)}" height="${CHp.toFixed(2)}" rx="${rx}"/>`;
    p += `<circle cx="${(x + 85 * K).toFixed(2)}" cy="${(y + (16 + (136 + D) / 2) * K).toFixed(2)}" r="1.4"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${(W / 2.83465).toFixed(2)}mm" height="${(H / 2.83465).toFixed(2)}mm">${regMarksSvg(W, H, regEnabled)}<g id="cut" fill="none" stroke="#ff0000" stroke-width=".25">${c}</g><g id="punch" fill="none" stroke="#0000ff" stroke-width=".25">${p}</g></svg>`;
}

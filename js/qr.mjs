// Lightweight zero-dependency ISO/IEC 18004 QR Code matrix & SVG renderer (Byte mode, ECC Level M, Versions 1-6)

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(deg) {
  let poly = [1];
  for (let i = 0; i < deg; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef === 0) continue;
    for (let j = 1; j < gen.length; j++) {
      res[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return Array.from(res.slice(data.length));
}

// Version 1..6 specs for ECC Level M: [totalCodewords, ecPerBlock, blocksG1, dataG1, blocksG2, dataG2, alignCenters]
const QR_SPECS_M = [
  null,
  { total: 26, ec: 10, g1: [1, 16], g2: [0, 0], align: [] },
  { total: 44, ec: 16, g1: [1, 28], g2: [0, 0], align: [6, 18] },
  { total: 70, ec: 26, g1: [1, 44], g2: [0, 0], align: [6, 22] },
  { total: 100, ec: 18, g1: [2, 32], g2: [0, 0], align: [6, 26] },
  { total: 134, ec: 24, g1: [2, 43], g2: [0, 0], align: [6, 30] },
  { total: 172, ec: 16, g1: [4, 27], g2: [0, 0], align: [6, 34] }
];

function encodeUtf8Bytes(str) {
  if (typeof TextEncoder !== "undefined") return Array.from(new TextEncoder().encode(str));
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) out.push(c);
    else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
    else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
  }
  return out;
}

function chooseVersion(byteLen) {
  for (let v = 1; v < QR_SPECS_M.length; v++) {
    const s = QR_SPECS_M[v];
    const dataCapBytes = s.g1[0] * s.g1[1] + s.g2[0] * s.g2[1];
    const headerBits = 4 + 8; // Mode (0100) + char count (8 bits for v1..9)
    if (headerBits + byteLen * 8 <= dataCapBytes * 8) return v;
  }
  return 6;
}

function buildCodewords(text) {
  let bytes = encodeUtf8Bytes(String(text || ""));
  let version = chooseVersion(bytes.length);
  const spec = QR_SPECS_M[version];
  const dataCapBytes = spec.g1[0] * spec.g1[1] + spec.g2[0] * spec.g2[1];
  const maxBytes = Math.floor((dataCapBytes * 8 - 12) / 8);
  if (bytes.length > maxBytes) bytes = bytes.slice(0, maxBytes);

  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);

  const maxBits = dataCapBytes * 8;
  const term = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < term; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataWords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let k = 0; k < 8; k++) v = (v << 1) | bits[i + k];
    dataWords.push(v);
  }
  const padBytes = [0xec, 0x11];
  let pi = 0;
  while (dataWords.length < dataCapBytes) {
    dataWords.push(padBytes[pi % 2]);
    pi++;
  }

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < spec.g1[0]; b++) {
    const slice = dataWords.slice(offset, offset + spec.g1[1]);
    offset += spec.g1[1];
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, spec.ec));
  }
  const finalWords = [];
  const maxDataLen = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) if (i < blk.length) finalWords.push(blk[i]);
  }
  for (let i = 0; i < spec.ec; i++) {
    for (const blk of ecBlocks) finalWords.push(blk[i]);
  }
  return { version, codewords: finalWords };
}

function makeEmptyMatrix(size) {
  return Array.from({ length: size }, () => new Int8Array(size).fill(-1));
}

function placeFinder(mat, fn, r0, c0) {
  const size = mat.length;
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const r = r0 + dr, c = c0 + dc;
      if (r < 0 || c < 0 || r >= size || c >= size) continue;
      const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
      const dark = inBox && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
      mat[r][c] = dark ? 1 : 0;
      fn[r][c] = 1;
    }
  }
}

function placeAlignment(mat, fn, cr, cc) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
      mat[cr + dr][cc + dc] = dark ? 1 : 0;
      fn[cr + dr][cc + dc] = 1;
    }
  }
}

function reserveFormatAndTiming(mat, fn, version) {
  const size = mat.length;
  for (let i = 8; i < size - 8; i++) {
    if (!fn[6][i]) { mat[6][i] = i % 2 === 0 ? 1 : 0; fn[6][i] = 1; }
    if (!fn[i][6]) { mat[i][6] = i % 2 === 0 ? 1 : 0; fn[i][6] = 1; }
  }
  const aligns = QR_SPECS_M[version].align;
  for (const r of aligns) {
    for (const c of aligns) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
      placeAlignment(mat, fn, r, c);
    }
  }
  // Format information slots
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      fn[8][i] = 1;
      fn[i][8] = 1;
    }
    if (i < 8) {
      fn[8][size - 1 - i] = 1;
      fn[size - 1 - i][8] = 1;
    }
  }
  mat[4 * version + 9][8] = 1; // Dark module
  fn[4 * version + 9][8] = 1;
}

const FORMAT_BITS_M = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b,
  0x45f9, 0x40ce, 0x4f97, 0x4aa0
];

function applyFormat(mat, maskId) {
  const size = mat.length;
  const bits = FORMAT_BITS_M[maskId];
  for (let i = 0; i < 15; i++) {
    const v = (bits >> i) & 1;
    if (i < 6) mat[8][i] = v;
    else if (i < 8) mat[8][i + 1] = v;
    else mat[8][size - 15 + i] = v;

    if (i < 8) mat[size - 1 - i][8] = v;
    else if (i < 9) mat[7][8] = v;
    else mat[14 - i][8] = v;
  }
}

const MASK_FNS = [
  (r, c) => (r + c) % 2 === 0,
  r => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r, c) => (((r * c) % 2 + (r * c) % 3) % 2) === 0,
  (r, c) => (((r + c) % 2 + (r * c) % 3) % 2) === 0
];

function penaltyScore(mat) {
  const n = mat.length;
  let score = 0;
  // Rule 1: horizontal & vertical runs >= 5
  for (let r = 0; r < n; r++) {
    let runH = 1, runV = 1;
    for (let c = 1; c < n; c++) {
      if (mat[r][c] === mat[r][c - 1]) runH++;
      else { if (runH >= 5) score += 3 + (runH - 5); runH = 1; }
      if (mat[c][r] === mat[c - 1][r]) runV++;
      else { if (runV >= 5) score += 3 + (runV - 5); runV = 1; }
    }
    if (runH >= 5) score += 3 + (runH - 5);
    if (runV >= 5) score += 3 + (runV - 5);
  }
  // Rule 2: 2x2 same-color blocks
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = mat[r][c];
      if (v === mat[r][c + 1] && v === mat[r + 1][c] && v === mat[r + 1][c + 1]) score += 3;
    }
  }
  return score;
}

export function encodeQrMatrix(text) {
  const { version, codewords } = buildCodewords(text);
  const size = version * 4 + 17;
  const base = makeEmptyMatrix(size);
  const fn = makeEmptyMatrix(size).map(row => row.fill(0));
  placeFinder(base, fn, 0, 0);
  placeFinder(base, fn, 0, size - 7);
  placeFinder(base, fn, size - 7, 0);
  reserveFormatAndTiming(base, fn, version);

  const bitStream = [];
  for (const w of codewords) {
    for (let b = 7; b >= 0; b--) bitStream.push((w >> b) & 1);
  }

  let bestMat = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = base.map(row => Int8Array.from(row));
    let bitIdx = 0;
    let dir = -1;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let step = 0; step < size; step++) {
        const row = dir === -1 ? size - 1 - step : step;
        for (let dx = 0; dx < 2; dx++) {
          const c = col - dx;
          if (fn[row][c]) continue;
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
          m[row][c] = MASK_FNS[mask](row, c) ? (bit ^ 1) : bit;
        }
      }
      dir = -dir;
    }
    applyFormat(m, mask);
    const sc = penaltyScore(m);
    if (sc < bestScore) {
      bestScore = sc;
      bestMat = m;
    }
  }
  return bestMat;
}

export function renderQrSvgMarkup(text, { x = 0, y = 0, size = 24, fg = "#111111", bg = "#ffffff", radius = 1.5 } = {}) {
  const mat = encodeQrMatrix(text);
  const n = mat.length;
  const quiet = 1;
  const mod = size / (n + quiet * 2);
  let d = "";
  for (let r = 0; r < n; r++) {
    let runStart = -1;
    for (let c = 0; c <= n; c++) {
      const on = c < n && mat[r][c] === 1;
      if (on && runStart < 0) runStart = c;
      else if (!on && runStart >= 0) {
        const px = (x + (runStart + quiet) * mod).toFixed(2);
        const py = (y + (r + quiet) * mod).toFixed(2);
        const rw = ((c - runStart) * mod).toFixed(2);
        const rh = (mod + 0.02).toFixed(2);
        d += `M${px} ${py}h${rw}v${rh}h-${rw}z`;
        runStart = -1;
      }
    }
  }
  const rxAttr = radius > 0 ? ` rx="${radius}"` : "";
  return `<g class="vc-qr" aria-label="QR code"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}"${rxAttr} fill="${bg}"/><path d="${d}" fill="${fg}"/></g>`;
}

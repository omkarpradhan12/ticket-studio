import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  clearCardStylingRecord,
  contrastRatio,
  ensureContrastHex,
  hasCustomCardStyling,
  relativeLuminance,
  sanitizeCardStyleOverrides
} from "../js/card-styles.mjs";
import {
  DEFAULT_SURPRISE_PREFS,
  mulberry32,
  normalizeSurprisePrefs,
  pickSafeStampNorm,
  surpriseCardsBatch
} from "../js/randomiser.mjs";
import { STAMP_MIN_NORM, STAMP_MAX_NORM, stampNormBounds } from "../js/stamps.mjs";

const TEST_THEMES = {
  cream: { grp: "Light", n: "Cream", bg: "#f2eadb", ink: "#1b1a19", mute: "#3a3733" },
  kraft: { grp: "Light", n: "Kraft paper", bg: "#c9a56b", ink: "#2b1a0a", mute: "#4a3519", l: 0.3 },
  min:   { grp: "Light", n: "Minimal", bg: "#ffffff", ink: "#111111", mute: "#777777" },
  dark:  { grp: "Dark", n: "Dark", bg: "#18181c", ink: "#ffffff", mute: "#cfcfd6" },
  neon:  { grp: "Dark", n: "Neon night", bg: "#0b0720", ink: "#ffffff", mute: "#c4b8ff", l: 0.62 },
  gradd: { grp: "Gradient", n: "Gradient dark", grad: 1, gs: "#0b0b10", gl: 0.4, bg: "#0b0b10", ink: "#ffffff", mute: "#ececf4" },
  gradl: { grp: "Gradient", n: "Gradient light", grad: 1, gs: "#f3ead8", gl: 0.72, bg: "#f3ead8", ink: "#14121a", mute: "#34303f" }
};

const SAMPLE = [
  {
    title: "Three Days Grace",
    genre: "Alt-Rock",
    loc: "Canada",
    year: "1997",
    code: "TDG",
    img: "data:image/png;base64,AAA",
    imgUrl: "",
    corsLimited: false,
    h: 345,
    s: 0.8,
    zm: 1.4,
    px: -25,
    py: 18
  },
  {
    title: "Linkin Park",
    genre: "Nu Metal",
    loc: "California",
    year: "1996",
    code: "LP",
    img: "https://example.com/lp.jpg",
    imgUrl: "https://example.com/lp.jpg",
    corsLimited: true,
    h: 210,
    s: 0.75,
    zm: 1,
    px: 0,
    py: 0
  }
];

// 1. Seeded RNG reproducibility
{
  const a = mulberry32(424242);
  const b = mulberry32(424242);
  const c = mulberry32(999999);
  const seqA = Array.from({ length: 10 }, () => a());
  const seqB = Array.from({ length: 10 }, () => b());
  const seqC = Array.from({ length: 10 }, () => c());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);

  const prefs = normalizeSurprisePrefs({
    scope: { colors: true, border: true, stamps: true, wear: true, font: true },
    strength: 2
  });
  const run1 = surpriseCardsBatch({ cards: SAMPLE, count: 2, seed: 123456, cfg: { style: "cream", stampSize: 100 }, prefs, themes: TEST_THEMES });
  const run2 = surpriseCardsBatch({ cards: SAMPLE, count: 2, seed: 123456, cfg: { style: "cream", stampSize: 100 }, prefs, themes: TEST_THEMES });
  assert.deepEqual(run1.cards, run2.cards);
  const run3 = surpriseCardsBatch({ cards: SAMPLE, count: 2, seed: 654321, cfg: { style: "cream", stampSize: 100 }, prefs, themes: TEST_THEMES });
  assert.notDeepEqual(run1.cards[0].theme + run1.cards[0].sk, run3.cards[0].theme + run3.cards[0].sk);
}

// 2. Non-style data isolation (text, photos, zoom/crop, sampled h/s, count, order untouched)
{
  const prefs = normalizeSurprisePrefs({
    scope: { colors: true, border: true, stamps: true, wear: true, font: true },
    strength: 2
  });
  const result = surpriseCardsBatch({ cards: SAMPLE, count: 2, seed: 777111, cfg: { style: "cream", nfc: true }, prefs, themes: TEST_THEMES });
  for (let i = 0; i < SAMPLE.length; i++) {
    const before = SAMPLE[i];
    const after = result.cards[i];
    for (const k of ["title", "genre", "loc", "year", "code", "img", "imgUrl", "corsLimited", "h", "s", "zm", "px", "py"]) {
      assert.equal(after[k], before[k], `non-style key ${k} must remain untouched`);
    }
    assert.equal(hasCustomCardStyling(after), true);
  }
}

// 3. Contrast >= 4.5:1 across all themes and strengths (solid & gradient stops)
{
  const manyCards = Array.from({ length: 60 }, (_, idx) => ({
    ...SAMPLE[idx % 2],
    h: (idx * 29) % 360,
    s: 0.35 + ((idx % 5) * 0.12)
  }));
  for (const strength of [0, 1, 2]) {
    const prefs = normalizeSurprisePrefs({
      scope: { colors: true, border: true, stamps: true, wear: true, font: true },
      strength
    });
    const res = surpriseCardsBatch({ cards: manyCards, count: 60, seed: 333000 + strength, cfg: { style: "cream", pageThemes: ["gradd", "cream"] }, prefs, themes: TEST_THEMES });
    for (const card of res.cards) {
      const theme = TEST_THEMES[card.theme] || TEST_THEMES.cream;
      const bg = card.palette?.bg || theme.bg;
      const stops = theme.grad ? [theme.gs, card.palette?.gradEnd || bg] : [bg];
      for (const stop of stops) {
        if (!/^#[\da-f]{6}$/i.test(String(stop))) continue;
        assert.ok(contrastRatio(card.palette.ink, stop) >= 4.5, `ink ${card.palette.ink} vs ${stop} below 4.5 at strength ${strength}`);
        assert.ok(contrastRatio(card.palette.mute, stop) >= 4.5, `mute ${card.palette.mute} vs ${stop} below 4.5 at strength ${strength}`);
      }
      if (card.border) {
        if (card.border.width !== undefined) assert.ok(card.border.width >= 0.75, "border width >= 0.75");
        if (card.border.opacity !== undefined) assert.ok(card.border.opacity >= 55, "border opacity >= 55");
        if (card.border.style === 14) assert.ok(relativeLuminance(bg) <= 0.52, "neon glow avoids light backgrounds");
      }
    }
  }
}

// 4. Strict stamp boundary clamping & anti-title overlap guard rails
{
  const boundsTicket = stampNormBounds({ CW: 170, CH: 239, effScale: 1 });
  const boundsTarot = stampNormBounds({ CW: 170, CH: 291.4, effScale: 1 });
  const rng = mulberry32(88888);
  for (let k = 0; k < 50; k++) {
    const stT = pickSafeStampNorm({ rng, strength: k % 3, stampIndex: 0, CH: 239, CW: 170, effScale: 1, hasNfc: true });
    assert.ok(stT.x >= boundsTicket.minNx && stT.x <= boundsTicket.maxNx);
    assert.ok(stT.y >= boundsTicket.minNy && stT.y <= boundsTicket.maxNy);
    // Primary stamp zones avoid title band at y=182..220 on Ticket unless top/tear margin
    assert.ok(stT.y * 239 < 178, `Ticket stamp y=${stT.y * 239} should clear title zone`);

    const stTar = pickSafeStampNorm({ rng, strength: k % 3, stampIndex: 0, CH: 291.4, CW: 170, effScale: 1, hasNfc: true });
    assert.ok(stTar.x >= boundsTarot.minNx && stTar.x <= boundsTarot.maxNx);
    assert.ok(stTar.y >= boundsTarot.minNy && stTar.y <= boundsTarot.maxNy);
  }
}

// 5. Locks, keepMovedStamps, keepTheme, and clearCardStylingRecord
{
  const cardsWithLockAndManualStamp = [
    { ...SAMPLE[0], locked: true, theme: "dark", titleFont: "courier" },
    { ...SAMPLE[1], stampPos: { x: 0.75, y: 0.65, r: 10, scale: 1.1 } },
    { ...SAMPLE[0], stampPos: { x: 0.25, y: 0.62, r: -10, scale: 1 } }
  ];

  // Keep moved stamps on -> stamps unticked or keepMovedStamps=true preserves stampPos
  const keepManualRes = surpriseCardsBatch({
    cards: cardsWithLockAndManualStamp,
    count: 3,
    seed: 555,
    cfg: { style: "cream", stampSize: 100 },
    prefs: { scope: { colors: true, border: true, stamps: true, wear: false, font: false }, strength: 1, keepTheme: true, keepMovedStamps: true },
    themes: TEST_THEMES
  });
  assert.equal(keepManualRes.cards[0].theme, "dark");
  assert.equal(keepManualRes.cards[0].locked, true);
  assert.equal(keepManualRes.skippedLocked, 1);
  assert.equal(keepManualRes.surprisedCount, 2);
  assert.equal(keepManualRes.replacedStampCount, 0);
  assert.deepEqual(keepManualRes.cards[1].stampPos, cardsWithLockAndManualStamp[1].stampPos);
  assert.equal(keepManualRes.cards[1].theme, undefined, "keepTheme preserves inherited theme when no card override");

  // Keep moved stamps off -> replaces moved stamps and reports replacedStampCount === 2
  const replaceRes = surpriseCardsBatch({
    cards: cardsWithLockAndManualStamp,
    count: 3,
    seed: 555,
    cfg: { style: "cream", stampSize: 100 },
    prefs: { scope: { colors: false, border: false, stamps: true, wear: false, font: false }, strength: 1, keepTheme: false, keepMovedStamps: false },
    themes: TEST_THEMES
  });
  assert.equal(replaceRes.replacedStampCount, 2);
  assert.notDeepEqual(replaceRes.cards[1].stampPos, cardsWithLockAndManualStamp[1].stampPos);

  // Clear styling restores non-style fields only
  const cleared = clearCardStylingRecord(replaceRes.cards[1]);
  assert.equal(hasCustomCardStyling(cleared), false);
  assert.equal(cleared.title, SAMPLE[1].title);
  assert.equal(cleared.imgUrl, SAMPLE[1].imgUrl);
  assert.equal(cleared.h, SAMPLE[1].h);
}

// 6. Sanitization & contrast adjuster edge cases
{
  const fixedInk = ensureContrastHex("#777777", ["#111111", "#888888"], 4.5);
  assert.ok(contrastRatio(fixedInk, "#111111") >= 4.5 || fixedInk === "#ffffff");
  const clean = sanitizeCardStyleOverrides({
    theme: "neon",
    palette: { bg: "#101010", ink: "#ffffff", acc: "#FF5A36", grad: 1, gl: 0.99 },
    tape: "#D8B46B",
    photoMounts: [4, 7, 99],
    titleFont: "bebas",
    titleScale: 1.5,
    grain: 150,
    stampPos: { x: 2, y: -1, r: 400, scale: 5 },
    locked: true
  }, TEST_THEMES);
  assert.equal(clean.theme, "neon");
  assert.equal(clean.palette.acc, "#ff5a36");
  assert.equal(clean.palette.gl, 0.85);
  assert.deepEqual(clean.photoMounts, [4, 7]);
  assert.equal(clean.titleFont, "bebas");
  assert.equal(clean.titleScale, 1);
  assert.equal(clean.grain, 100);
  assert.ok(clean.stampPos.x <= STAMP_MAX_NORM && clean.stampPos.y >= STAMP_MIN_NORM);
  assert.equal(clean.locked, true);
}

// 7. 200-card batch performance check
{
  const twoHundred = Array.from({ length: 200 }, (_, i) => ({
    ...SAMPLE[i % 2],
    title: `Band ${i + 1}`,
    h: (i * 19) % 360
  }));
  const t0 = performance.now();
  const res = surpriseCardsBatch({
    cards: twoHundred,
    count: 200,
    seed: 200200,
    cfg: { style: "cream", stampSize: 100, nfc: true },
    prefs: { ...DEFAULT_SURPRISE_PREFS, scope: { colors: true, border: true, stamps: true, wear: true, font: true }, strength: 2 },
    themes: TEST_THEMES
  });
  const dt = performance.now() - t0;
  assert.equal(res.surprisedCount, 200);
  assert.equal(res.cards.length, 200);
  assert.ok(dt < 500, `200-card batch took ${dt.toFixed(1)}ms, expected < 500ms`);
  console.log(`Randomiser module tests passed (200-card generation: ${dt.toFixed(1)}ms).`);
}

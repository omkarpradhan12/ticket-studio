import assert from "node:assert/strict";
import { encodeQrMatrix, renderQrSvgMarkup } from "../js/qr.mjs";
import { autoStampGeometry, resolveStampTransform, snapStampNorm } from "../js/stamps.mjs";
import { pickSafeStampNorm, surpriseSingleCard } from "../js/randomiser.mjs";
import { cardSearchHaystack, filterCardIndices } from "../js/search.mjs";
import { BORDER_STYLES, renderBorder } from "../js/borders.mjs";
import { clearCardStylingRecord, hasCustomCardStyling, sanitizeCardStyleOverrides } from "../js/card-styles.mjs";

// 1. QR matrix structure and SVG generation
{
  const mat = encodeQrMatrix("https://northlightsound.co");
  assert.ok(mat.length >= 25 && mat.length <= 41);
  // Top-left, top-right, bottom-left 7x7 finder centers
  assert.equal(mat[3][3], 1);
  assert.equal(mat[3][mat.length - 4], 1);
  assert.equal(mat[mat.length - 4][3], 1);
  const svg = renderQrSvgMarkup("https://northlightsound.co", { x: 11, y: 60, size: 24 });
  assert.ok(svg.includes('class="vc-qr"'));
  assert.ok(svg.includes('<path d="M'));
  assert.equal(svg.includes("NaN"), false);
}

// 2. Landscape CH < 204 stamp auto-placement & snapping stays safely inside card
{
  for (const CH of [110.0, 97.4, 94.4]) {
    const st0 = autoStampGeometry({ index: 0, stampIndex: 0, CH, stampSize: 100 });
    const st1 = autoStampGeometry({ index: 1, stampIndex: 1, CH, stampSize: 100 });
    assert.ok(st0.x > 10 && st0.x < 160, `st0.x in bounds: ${st0.x}`);
    assert.ok(st0.y > 10 && st0.y < CH - 10, `st0.y in bounds at CH=${CH}: ${st0.y}`);
    assert.ok(st1.y > 10 && st1.y < CH - 10, `st1.y in bounds at CH=${CH}: ${st1.y}`);
    const snapped = snapStampNorm(0.5, 0.5, { CW: 170, CH, effScale: 1, snapEnabled: true });
    assert.equal(snapped.snappedX, true);
    assert.equal(snapped.snappedY, true);
    const resolved = resolveStampTransform({ index: 0, stampIndex: 0, CW: 170, CH, stampSize: 100, override: null });
    assert.ok(resolved.ny > 0.05 && resolved.ny < 0.95);
  }
}

// 3. Surprise me supports visiting landscape CH=110 & new border styles 16 & 17
{
  const result = surpriseSingleCard({
    card: { kind: "visiting", title: "Maya Linwood", role: "Creative Director", company: "Northlight" },
    index: 0,
    seed: 12345,
    CH: 110.0,
    CW: 170,
    prefs: { scope: { colors: true, border: true, stamps: true, wear: true, font: true }, strength: 2, keepTheme: false, keepMovedStamps: false }
  });
  assert.ok(result.card.stampPos.y > 0.1 && result.card.stampPos.y < 0.9);
  for (const styleId of [16, 17]) {
    const meta = BORDER_STYLES[styleId];
    const rendered = renderBorder({ index: 0, CW: 170, CH: 110.0, accent: "#ff5a36", border: { ...meta.defaults, style: styleId, wear: 0 } });
    assert.ok(rendered.markup.includes("<g"));
    assert.equal(rendered.markup.includes("NaN"), false);
  }
}

// 4. Local search indexes visiting card metadata fields
{
  const cards = [
    { kind: "visiting", title: "Maya Linwood", role: "Creative Director", company: "Northlight Soundworks", phone: "+1 206 555 0148", email: "maya@northlight.co", website: "northlightsound.co", address: "Seattle" },
    { title: "Linkin Park", genre: "Nu Metal", loc: "California" }
  ];
  assert.ok(cardSearchHaystack(cards[0]).includes("seattle"));
  assert.deepEqual(filterCardIndices(cards, 2, "northlightsound.co").matchedIndices, [0]);
  assert.deepEqual(filterCardIndices(cards, 2, "creative director").matchedIndices, [0]);
  assert.deepEqual(filterCardIndices(cards, 2, "0148").matchedIndices, [0]);
}

// 5. Per-card border, corner hardware, mounts, distress & ticket overrides round-trip and reset cleanly
{
  const overrides = sanitizeCardStyleOverrides({
    border: { style: 17, width: 2.2, corner: "notched", ornament: "diamond", wear: 15, inner: true, opacity: 80, glow: 25 },
    cornerHardware: "rivets",
    photoMounts: [4, 8],
    fxClaw: true,
    fxBullet: true,
    doors: "VIP 6PM",
    side: "Tour 26",
    nfc: false,
    nfcWithYt: false,
    nfcScale: 130,
    serials: true,
    punchHole: true,
    stampYear: "1999",
    stamp2: "BACKSTAGE",
    vcBadge: "qr"
  });
  assert.equal(overrides.border.style, 17);
  assert.equal(overrides.border.corner, "notched");
  assert.equal(overrides.border.opacity, 80);
  assert.equal(overrides.cornerHardware, "rivets");
  assert.deepEqual(overrides.photoMounts, [4, 8]);
  assert.equal(overrides.fxClaw, true);
  assert.equal(overrides.fxBullet, true);
  assert.equal(overrides.doors, "VIP 6PM");
  assert.equal(overrides.nfc, false);
  assert.equal(overrides.nfcScale, 130);
  assert.equal(overrides.vcBadge, "qr");
  assert.equal(hasCustomCardStyling(overrides), true);
  const cleared = clearCardStylingRecord({ title: "Test Band", ...overrides });
  assert.equal(hasCustomCardStyling(cleared), false);
  assert.equal(cleared.title, "Test Band");
}

console.log("Phase 10 visiting card, QR, borders 16-17, and card back prep tests passed.");

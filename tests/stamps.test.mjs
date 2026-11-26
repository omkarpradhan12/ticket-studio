import assert from "node:assert/strict";
import {
  SKINDS,
  STAMP_OPTIONS,
  STAMPS,
  autoStampGeometry,
  clampStampNorm,
  clampStampScale,
  compactStampStyle,
  hasStampStyleOverrides,
  normalizeAngle,
  renderStampMarkup,
  renderStampSwatchSvg,
  resolveStampStyle,
  resolveStampTransform,
  sanitizeStampOverride,
  snapStampNorm,
  uniqueStampPresetName
} from "../js/stamps.mjs";

// 1. Auto placement matches legacy deterministic math
{
  const g0 = autoStampGeometry({ index: 0, stampIndex: 0, CH: 239, stampSize: 100 });
  const r0 = resolveStampTransform({ index: 0, stampIndex: 0, CW: 170, CH: 239, stampSize: 100, override: null });
  assert.equal(r0.isOverridden, false);
  assert.equal(r0.x, g0.x);
  assert.equal(r0.y, g0.y);
  assert.equal(r0.r, g0.r);
  assert.equal(r0.scale, g0.scale);
}

// 2. Card-relative normalization survives card size changes (Ticket -> Tarot)
{
  const override = { x: 0.5, y: 0.75, r: -15, scale: 1.25 };
  const ticket = resolveStampTransform({ index: 0, stampIndex: 0, CW: 170, CH: 239, stampSize: 100, override });
  const tarot = resolveStampTransform({ index: 0, stampIndex: 0, CW: 170, CH: 291.4, stampSize: 100, override });
  assert.equal(ticket.x, 85);
  assert.equal(tarot.x, 85);
  assert.ok(Math.abs(ticket.y / 239 - 0.75) < 1e-6);
  assert.ok(Math.abs(tarot.y / 291.4 - 0.75) < 1e-6);
  assert.equal(tarot.r, -15);
  assert.equal(tarot.scale, 1.25);
}

// 3. Clamping keeps stamps strictly inside the card boundary
{
  const clamped = clampStampNorm(-0.5, 2.5);
  assert.equal(clamped.nx, 0.04);
  assert.equal(clamped.ny, 0.96);
  const edge = resolveStampTransform({ index: 0, stampIndex: 0, CW: 170, CH: 239, stampSize: 100, override: { x: 0, y: 1 } });
  assert.ok(edge.x >= 18 && edge.x <= 152);
  assert.ok(edge.y >= 18 && edge.y <= 221);
  assert.equal(clampStampScale(0.1), 0.4);
  assert.equal(clampStampScale(4.0), 2.5);
  assert.equal(normalizeAngle(195), -165);
  assert.equal(normalizeAngle(-195), 165);
}

// 4. Snapping aligns within threshold and bypasses when requested
{
  const snapped = snapStampNorm(83.5 / 170, 118.5 / 239, { CW: 170, CH: 239, snapEnabled: true, bypass: false });
  assert.equal(snapped.snappedX, true);
  assert.equal(snapped.snappedY, true);
  assert.equal(snapped.snapPxX, 85);
  assert.equal(snapped.snapPxY, 119.5);

  const bypassed = snapStampNorm(83.5 / 170, 118.5 / 239, { CW: 170, CH: 239, snapEnabled: true, bypass: true });
  assert.equal(bypassed.snappedX, false);
  assert.equal(bypassed.snappedY, false);
}

// 5. Sanitization bounds and rejects invalid values
{
  assert.equal(sanitizeStampOverride(null), undefined);
  assert.deepEqual(
    sanitizeStampOverride({ x: 2, y: -1, r: 370, scale: 9 }),
    { x: 0.96, y: 0.04, r: 10, scale: 2.5 }
  );
}

// 6. Stamp shapes (owner catalog + mixed + none) & swatch rendering
{
  assert.equal(SKINDS.length, 31);
  assert.equal(STAMP_OPTIONS.length, 33);
  for (const key of ["vinyl", "pick", "octagon", "banner", "badge", "bolt"]) {
    assert.ok(STAMPS[key], `missing new stamp shape ${key}`);
  }
  for (const opt of STAMP_OPTIONS) {
    const svg = renderStampSwatchSvg(opt.id, "#ff5a36", { bg: "#141211", ink: "#ffffff" });
    assert.ok(svg.startsWith("<svg ") && svg.endsWith("</svg>"));
    assert.equal(svg.includes("NaN"), false);
  }
}

// 7. Exact legacy stamp markup when style has no overrides
{
  const legacyRound = `<g filter="url(#ink0)" transform="translate(85.0 152.0) rotate(12.5) scale(1)" fill="none" stroke="#d9322f" opacity=".95"><circle r="17" stroke-width="1"/><circle r="14.5" stroke-width=".5"/><text y="-5" text-anchor="middle" fill="#d9322f" stroke="none" font-size="4" font-weight="700" font-family="Montserrat,Arial,sans-serif">2026</text><text y="3" text-anchor="middle" fill="#d9322f" stroke="none" font-size="5.4" font-weight="800" font-family="Montserrat,Arial,sans-serif">SOUL</text><path d="M-7 7h14" stroke-width=".5"/></g>`;
  const rendered = renderStampMarkup({
    shapeKey: "round",
    text: "Soul",
    year: "2026",
    scale: 1,
    px: 85,
    py: 152,
    rotation: 12.5,
    color: "#d9322f",
    wear: 35,
    filterId: "ink0",
    style: resolveStampStyle({}, null)
  });
  assert.equal(rendered, legacyRound);
}

// 8. Stamp Customise modes (solid, tinted, dashed, weight, opacity, innerRing, showYear) & compacting
{
  assert.equal(compactStampStyle({ fillMode: "outline", weight: 1, pattern: "solid", opacity: 95, innerRing: true, showYear: true }), undefined);
  const custom = resolveStampStyle({ stampStyle: { fillMode: "solid", weight: 1.5, pattern: "dashed", opacity: 80, innerRing: false, showYear: false } });
  assert.equal(hasStampStyleOverrides(custom), true);
  const markup = renderStampMarkup({
    shapeKey: "vinyl",
    text: "LIVE",
    year: "2026",
    scale: 1,
    px: 85,
    py: 152,
    rotation: 0,
    color: "#112233",
    style: custom,
    themeBg: "#f2eadb"
  });
  assert.ok(markup.includes('fill="#112233"'));
  assert.ok(markup.includes('stroke-dasharray="3.2 2.2"'));
  assert.ok(markup.includes('stroke-width="1.5"'));
  assert.ok(markup.includes('opacity=".80"'));
  assert.equal(markup.includes("2026"), false);
  assert.equal(uniqueStampPresetName("Badge", ["badge"]), "Badge (2)");
}

console.log("Stamp module tests passed.");

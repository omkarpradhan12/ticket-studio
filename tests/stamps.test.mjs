import assert from "node:assert/strict";
import {
  autoStampGeometry,
  clampStampNorm,
  clampStampScale,
  normalizeAngle,
  resolveStampTransform,
  sanitizeStampOverride,
  snapStampNorm
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

// 3. Clamping allows slight edge overlap (-0.04..1.04) but never off card
{
  const clamped = clampStampNorm(-0.5, 2.5);
  assert.equal(clamped.nx, -0.04);
  assert.equal(clamped.ny, 1.04);
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
    { x: 1.04, y: -0.04, r: 10, scale: 2.5 }
  );
}

console.log("Stamp module tests passed.");

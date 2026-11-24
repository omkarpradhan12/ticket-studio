// Stamp placement math, card-relative normalization, clamping, snapping & overlay helpers

export const STAMP_MIN_NORM = -0.04;
export const STAMP_MAX_NORM = 1.04;
export const STAMP_MIN_SCALE = 0.4;
export const STAMP_MAX_SCALE = 2.5;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(deg) {
  const n = Number(deg);
  if (!Number.isFinite(n)) return 0;
  let wrapped = ((n + 180) % 360 + 360) % 360 - 180;
  if (wrapped === -180) wrapped = 180;
  return Math.round(wrapped * 10) / 10;
}

export function clampStampNorm(nx, ny) {
  return {
    nx: clamp(Number(nx) || 0, STAMP_MIN_NORM, STAMP_MAX_NORM),
    ny: clamp(Number(ny) || 0, STAMP_MIN_NORM, STAMP_MAX_NORM)
  };
}

export function clampStampScale(scale) {
  const n = Number(scale);
  return Number.isFinite(n) ? clamp(n, STAMP_MIN_SCALE, STAMP_MAX_SCALE) : 1;
}

export function autoStampGeometry({ index = 0, stampIndex = 0, CH = 239, stampSize = 100 }) {
  const D = CH - 239;
  const PX = 17, PY = 16, PS = 136, PH = 136 + D, PB = PY + PH;
  const ss = (stampSize || 100) / 100;
  const rr = 17 * ss;
  const rn = k => {
    const v = Math.sin((index + 1) * 127.1 + k * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  if (stampIndex === 1) {
    return {
      x: PX + 30 + rn(8) * (PS - 60),
      y: PB + 32 + rn(9) * 26,
      r: (rn(10) - 0.5) * 30,
      scale: ss * 0.85
    };
  }
  return {
    x: PX + rr * 0.6 + rn(1) * (PS - rr * 1.2),
    y: PB + (rn(2) - 0.5) * 8,
    r: (rn(3) - 0.5) * 50,
    scale: ss
  };
}

export function resolveStampTransform({ index = 0, stampIndex = 0, CW = 170, CH = 239, stampSize = 100, override = null }) {
  const auto = autoStampGeometry({ index, stampIndex, CH, stampSize });
  const hasOverride = Boolean(
    override && typeof override === "object"
    && (Number.isFinite(override.x) || Number.isFinite(override.y) || Number.isFinite(override.r) || Number.isFinite(override.scale))
  );
  if (!hasOverride) {
    return {
      x: auto.x,
      y: auto.y,
      r: auto.r,
      scale: auto.scale,
      nx: auto.x / CW,
      ny: auto.y / CH,
      mult: 1,
      isOverridden: false
    };
  }
  const nx = Number.isFinite(override.x) ? clamp(override.x, STAMP_MIN_NORM, STAMP_MAX_NORM) : auto.x / CW;
  const ny = Number.isFinite(override.y) ? clamp(override.y, STAMP_MIN_NORM, STAMP_MAX_NORM) : auto.y / CH;
  const r = Number.isFinite(override.r) ? normalizeAngle(override.r) : auto.r;
  const mult = Number.isFinite(override.scale) ? clampStampScale(override.scale) : 1;
  return {
    x: nx * CW,
    y: ny * CH,
    r,
    scale: auto.scale * mult,
    nx,
    ny,
    mult,
    isOverridden: true
  };
}

export function sanitizeStampOverride(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  if (Number.isFinite(Number(raw.x))) out.x = Number(clamp(Number(raw.x), STAMP_MIN_NORM, STAMP_MAX_NORM).toFixed(4));
  if (Number.isFinite(Number(raw.y))) out.y = Number(clamp(Number(raw.y), STAMP_MIN_NORM, STAMP_MAX_NORM).toFixed(4));
  if (Number.isFinite(Number(raw.r))) out.r = normalizeAngle(raw.r);
  if (Number.isFinite(Number(raw.scale))) out.scale = Number(clampStampScale(raw.scale).toFixed(3));
  return Object.keys(out).length ? out : undefined;
}

export function snapStampNorm(nx, ny, { CW = 170, CH = 239, snapEnabled = true, bypass = false } = {}) {
  const clamped = clampStampNorm(nx, ny);
  if (!snapEnabled || bypass) {
    return { nx: clamped.nx, ny: clamped.ny, snappedX: false, snappedY: false, snapPxX: null, snapPxY: null };
  }
  const D = CH - 239;
  const PMY = 16 + (136 + D) / 2;
  const px = clamped.nx * CW;
  const py = clamped.ny * CH;
  const threshold = 3.5;

  const targetsX = [CW / 2, 26, CW - 26];
  const targetsY = [CH / 2, PMY, 26, CH - 26];

  let outNx = clamped.nx;
  let outNy = clamped.ny;
  let snappedX = false;
  let snappedY = false;
  let snapPxX = null;
  let snapPxY = null;

  let bestDx = threshold;
  for (const tx of targetsX) {
    const d = Math.abs(px - tx);
    if (d <= bestDx) {
      bestDx = d;
      outNx = tx / CW;
      snappedX = true;
      snapPxX = tx;
    }
  }

  let bestDy = threshold;
  for (const ty of targetsY) {
    const d = Math.abs(py - ty);
    if (d <= bestDy) {
      bestDy = d;
      outNy = ty / CH;
      snappedY = true;
      snapPxY = ty;
    }
  }

  return { nx: outNx, ny: outNy, snappedX, snappedY, snapPxX, snapPxY };
}

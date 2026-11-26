import assert from "node:assert/strict";
import {
  CORNER_HARDWARE_OPTIONS,
  normalizeCornerHardware,
  renderCornerHardware,
  renderSurfaceFx
} from "../js/corners.mjs";

// 1. Legacy byte-for-byte parity for default corner bolts
{
  const CW = 170;
  const CH = 239;
  const T = { mt: "#a39a88", hi: "#f6efe0", dk: "#2a2723" };
  let legacy = "";
  [[9, 9], [CW - 9, 9], [9, CH - 9], [CW - 9, CH - 9]].forEach(([bx, by], k) => {
    const i = 2;
    const ang = (i * 47 + k * 61) % 180, mt = T.mt, hi = T.hi, dk = T.dk, ph = (i + k) % 2;
    legacy += `<g transform="translate(${bx} ${by})"><circle cx=".35" cy=".5" r="2.5" fill="#000" opacity=".3"/><circle r="2.5" fill="${mt}" stroke="${dk}" stroke-width=".35"/><circle r="1.9" fill="none" stroke="${hi}" stroke-width=".3" opacity=".7"/><circle cx="-.7" cy="-.8" r=".7" fill="${hi}" opacity=".55"/><g transform="rotate(${ang})" stroke="${dk}" stroke-width=".42" stroke-linecap="round"><path d="M-1.5 0H1.5"/>${ph ? '<path d="M0 -1.5V1.5"/>' : ''}</g></g>`;
  });
  const actual = renderCornerHardware({ style: "bolts", index: 2, CW, CH, accent: "#ff5a36", theme: T });
  assert.equal(actual, legacy, "bolts hardware must remain byte-for-byte identical to legacy bolts");
}

// 2. All corner hardware styles & normalization
{
  assert.equal(normalizeCornerHardware("staples"), "staples");
  assert.equal(normalizeCornerHardware("bad"), "bolts");
  assert.equal(renderCornerHardware({ style: "none" }), "");
  for (const opt of CORNER_HARDWARE_OPTIONS) {
    const markup = renderCornerHardware({ style: opt.id, index: 1, CW: 170, CH: 239, accent: "#e04f33", theme: { mt: "#888", hi: "#fff", dk: "#111" } });
    assert.equal(markup.includes("NaN"), false, `${opt.id} must not produce NaN`);
    if (opt.id !== "none") assert.ok(markup.includes("<g "), `${opt.id} should produce SVG group`);
  }
}

// 3. Fun surface FX (claw, tear, bullet, blood)
{
  assert.equal(renderSurfaceFx({ fx: {} }), "");
  for (const key of ["claw", "tear", "bullet", "blood"]) {
    const markup = renderSurfaceFx({ index: 3, CW: 170, CH: 239, theme: { hi: "#fff", dk: "#111" }, fx: { [key]: true } });
    assert.ok(markup.includes("<g "), `surface fx ${key} should render SVG group`);
    assert.equal(markup.includes("NaN"), false, `surface fx ${key} must not produce NaN`);
  }
}

console.log("Corner hardware & surface FX tests passed.");

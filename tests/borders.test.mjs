import assert from "node:assert/strict";
import {
  BORDER_STYLES,
  compactBorderOverrides,
  getBorderStyleMeta,
  hasBorderOverrides,
  renderBorder,
  renderBorderSwatchSvg,
  resolveBorderConfig,
  sanitizeBorderPatch,
  uniquePresetName
} from "../js/borders.mjs";

// 1. Style catalog continuity: 0..4 preserved, 5..15 appended
assert.equal(BORDER_STYLES.length, 16);
assert.deepEqual(
  BORDER_STYLES.slice(0, 5).map(s => s.key),
  ["double", "thick", "brackets", "dashed", "rounded"]
);

// 2. Exact legacy output for styles 0..4 when unmodified
const legacyExpected = {
  0: `<g filter="url(#bd0)" fill="none" stroke="#ff5a36"><rect x="2.5" y="2.5" width="165" height="234" stroke-width="1.5"/><rect x="5.8" y="5.8" width="158.4" height="227.4" stroke-width=".7" opacity=".8"/></g>`,
  1: `<g filter="url(#bd0)" fill="none" stroke="#ff5a36"><rect x="3" y="3" width="164" height="233" stroke-width="2.6"/></g>`,
  2: `<g filter="url(#bd0)" fill="none" stroke="#ff5a36"><path d="M3 25V3H25" stroke-width="2.2"/><path d="M167 25V3H145" stroke-width="2.2"/><path d="M3 214V236H25" stroke-width="2.2"/><path d="M167 214V236H145" stroke-width="2.2"/></g>`,
  3: `<g filter="url(#bd0)" fill="none" stroke="#ff5a36"><rect x="4" y="4" width="162" height="231" stroke-width="1.1" stroke-dasharray="4 2.5"/></g>`,
  4: `<g filter="url(#bd0)" fill="none" stroke="#ff5a36"><rect x="2.5" y="2.5" width="165" height="234" rx="9" stroke-width="1.5"/><rect x="5.8" y="5.8" width="158.4" height="227.4" rx="6" stroke-width=".7" opacity=".8"/></g>`
};

for (let bs = 0; bs <= 4; bs++) {
  const resolved = resolveBorderConfig({ borderStyle: bs, borderWear: 35 }, null);
  assert.equal(hasBorderOverrides(resolved), false, `style ${bs} should have no default overrides`);
  const rendered = renderBorder({ index: 0, CW: 170, CH: 239, accent: "#ff5a36", border: resolved });
  assert.equal(rendered.isLegacy, true);
  assert.equal(rendered.defs, "");
  assert.equal(rendered.markup, legacyExpected[bs]);
}

// 3. All 16 styles render cleanly across Ticket (239), Mini (241.8), and Tarot (291.4)
for (const CH of [239, 241.8, 291.4]) {
  for (const style of BORDER_STYLES) {
    const resolved = resolveBorderConfig({ borderStyle: style.id, borderWear: 25 }, null);
    const rendered = renderBorder({ index: 3, CW: 170, CH, accent: "#e04f33", theme: { bg: "#141211", ink: "#fff", frame: "#ccc", mute: "#888", hi: "#fff" }, border: resolved });
    if (style.id === 15) {
      assert.equal(rendered.markup, "");
      assert.equal(rendered.defs, "");
    } else {
      assert.ok(rendered.markup.includes("<g"), `style ${style.key} at CH=${CH} should emit SVG group`);
      assert.equal(rendered.markup.includes("NaN"), false, `style ${style.key} must not emit NaN`);
      assert.equal(rendered.defs.includes("NaN"), false, `style ${style.key} defs must not emit NaN`);
    }
    const swatch = renderBorderSwatchSvg(style.id, "#e04f33", { bg: "#141211", ink: "#fff" });
    assert.ok(swatch.startsWith("<svg ") && swatch.endsWith("</svg>"));
    assert.equal(swatch.includes("NaN"), false);
  }
}

// 4. ID uniqueness across multiple cards and scopes
{
  const seenIds = new Set();
  for (let i = 0; i < 18; i++) {
    for (const styleId of [12, 13, 14]) {
      const resolved = resolveBorderConfig({ borderStyle: styleId, borderWear: 40 }, { border: { glow: 50 } });
      const { defs, markup } = renderBorder({
        index: i,
        CW: 170,
        CH: 239,
        accent: "#ff5a36",
        theme: { hi: "#ffffff" },
        border: resolved,
        scope: `s${styleId}`
      });
      const ids = [...defs.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
      assert.ok(ids.length > 0);
      for (const id of ids) {
        assert.equal(seenIds.has(id), false, `duplicate def id ${id}`);
        seenIds.add(id);
        assert.ok(markup.includes(`#${id}`), `markup should reference #${id}`);
      }
    }
  }
}

// 5. Customisations: corners, patterns, inner border, ornaments, custom hex, opacity
{
  const resolved = resolveBorderConfig({
    borderStyle: 1,
    borderWear: 0,
    border: {
      width: 3.2,
      inset: 4.5,
      colorMode: "custom",
      color: "#12ab34",
      opacity: 80,
      pattern: "dashdot",
      dash: 6,
      gap: 3,
      corner: "chamfered",
      cornerSize: 10,
      inner: true,
      innerWidth: 0.8,
      innerGap: 2.5,
      innerColorMode: "ink",
      ornament: "diamond",
      ornamentSize: 6,
      glow: 40
    }
  }, null);
  const rendered = renderBorder({ index: 2, CW: 170, CH: 239, accent: "#ff0000", theme: { ink: "#eeeeee" }, border: resolved });
  assert.equal(rendered.isLegacy, false);
  assert.ok(rendered.defs.includes('id="bgl2"'));
  assert.ok(rendered.markup.includes('opacity="0.80"'));
  assert.ok(rendered.markup.includes('stroke="#12ab34"'));
  assert.ok(rendered.markup.includes('stroke="#eeeeee"'));
  assert.ok(rendered.markup.includes('stroke-dasharray="6 3 0.1 3"'));
  assert.ok(rendered.markup.includes("<polygon points="));
  assert.ok(rendered.markup.includes("<path d="));
}

// 6. Per-card border inheritance vs style switch & compacting
{
  const sheet = { borderStyle: 0, borderWear: 35, border: { lineGap: 5, width: 2.2 } };
  // Same style override inherits sheet overrides
  const sameStyle = resolveBorderConfig(sheet, { border: { colorMode: "custom", color: "#00ffaa" } });
  assert.equal(sameStyle.style, 0);
  assert.equal(sameStyle.lineGap, 5);
  assert.equal(sameStyle.color, "#00ffaa");

  // Different style override starts from that style's defaults (doesn't leak sheet's double-line width/gap)
  const diffStyle = resolveBorderConfig(sheet, { border: { style: 14 } });
  assert.equal(diffStyle.style, 14);
  assert.equal(diffStyle.width, getBorderStyleMeta(14).defaults.width);
  assert.equal(diffStyle.glow, 65);
  assert.equal(diffStyle.wear, 35);

  // Compact omits defaults
  assert.equal(compactBorderOverrides(0, { width: 1.5, inset: 2.5 }), undefined);
  assert.deepEqual(compactBorderOverrides(0, { width: 2.0, inset: 2.5 }), { width: 2 });
  assert.equal(sanitizeBorderPatch({ style: 999 }), undefined);
  assert.equal(uniquePresetName("Gold", ["gold", "Gold (2)"]), "Gold (3)");
}

console.log("Border module tests passed.");

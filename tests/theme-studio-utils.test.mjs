import assert from "node:assert/strict";
import {
  PREVIEW_OPTIONS,
  configForTheme,
  nextCustomThemeName,
  themeBaseName,
  uniqueThemeName
} from "../js/theme-studio-utils.mjs";

assert.equal(themeBaseName("Dark - Custom v12"), "Dark");
assert.equal(nextCustomThemeName("Dark - Custom v1", ["Dark - Custom v1"]), "Dark - Custom v2");
assert.equal(nextCustomThemeName("Dark", ["Dark - Custom v1", "Dark - Custom v3"]), "Dark - Custom v2");
assert.equal(uniqueThemeName("Dark", ["dark"]), "Dark - Custom v1");
assert.equal(uniqueThemeName("Ocean", ["Dark"]), "Ocean");

const defaults = { name: "My theme", bg: "#fff", ink: "#000", acc: "#e8833a", frame: "#000", tape: "#ddd", pa: false, grad: false, gs: "#000", gl: 0.45 };
assert.deepEqual(configForTheme("dark", { n: "Dark", bg: "#111", ink: "#fff", fixed: "#f00", frame: "#aaa", tape: "#bbb" }, defaults), {
  ...defaults, name: "Dark", bg: "#111111", ink: "#ffffff", acc: "#ff0000", frame: "#aaaaaa", tape: "#bbbbbb", pa: false, gs: "#111111"
});
assert.equal(configForTheme("gradient", { n: "Gradient", bg: "#000", ink: "#fff", frame: "rgba(255,255,255,.75)", grad: 1, gs: "#111", gl: 0.4 }, defaults).frame, "#ffffff");
assert.equal("gradientAngle" in PREVIEW_OPTIONS, true);
assert.equal("gradientAngle" in defaults, false);

console.log("Theme Studio utility tests passed.");

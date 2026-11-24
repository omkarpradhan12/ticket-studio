import assert from "node:assert/strict";
import { normalizeHex } from "../js/color-controls.mjs";

assert.equal(normalizeHex("#A1b2C3"), "#a1b2c3");
assert.equal(normalizeHex(" #ffffff "), "#ffffff");
assert.equal(normalizeHex("#abc"), null);
assert.equal(normalizeHex("123456"), null);
assert.equal(normalizeHex("#12xz56"), null);

console.log("Color control tests passed.");

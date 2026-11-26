import assert from "node:assert/strict";
import { History } from "../js/history.mjs";
import {
  cardSearchHaystack,
  debounce,
  filterCardIndices,
  formatSearchCount,
  normalizeSearchText
} from "../js/search.mjs";

const CARDS = [
  { title: "Björk", genre: "Art Pop", loc: "Reykjavík, Iceland", year: "1993", code: "BJOK", stx: "Debut" },
  { title: "Sigur Rós", genre: "Post-Rock", loc: "Mosfellsbær", year: "1999", code: "SIGR", stx: "Ágætis" },
  { title: "Radiohead", genre: "Alternative Rock", loc: "Abingdon, UK", year: "1997", code: "RH97", stx: "OKC" },
  { title: "Mötley Crüe", genre: "Glam Metal", loc: "Los Angeles", year: "1981", code: "MCRU", stx: "" },
  { title: "Portishead", genre: "Trip Hop", loc: "Bristol, UK", year: "1994", code: "PORT", imgUrl: "https://example.org/dummy.jpg" },
  { title: "Café Tacvba", genre: "Rock en Español", loc: "Ciudad Satélite", year: "1994", code: "CAFE" }
];

// 1. Accent- and case-insensitive normalization & matching across all text fields
{
  assert.equal(normalizeSearchText("  Mötley Crüe  "), "motley crue");
  assert.equal(cardSearchHaystack(CARDS[0]).includes("reykjavik"), true);

  // Title with accents
  const rBjork = filterCardIndices(CARDS, CARDS.length, "bjork");
  assert.deepEqual(rBjork.matchedIndices, [0]);
  assert.equal(formatSearchCount(rBjork.matchCount, rBjork.totalCount), "1 of 6");

  // Multi-word across genre + origin
  const rUk = filterCardIndices(CARDS, CARDS.length, "uk 1994");
  assert.deepEqual(rUk.matchedIndices, [4]);

  // Accent-insensitive stamp text & abbreviation & origin
  assert.deepEqual(filterCardIndices(CARDS, CARDS.length, "agaetis").matchedIndices, [1]);
  assert.deepEqual(filterCardIndices(CARDS, CARDS.length, "rh97").matchedIndices, [2]);
  assert.deepEqual(filterCardIndices(CARDS, CARDS.length, "satelite").matchedIndices, [5]);
  assert.deepEqual(filterCardIndices(CARDS, CARDS.length, "dummy.jpg").matchedIndices, [4]);
}

// 2. Original order preserved & zero matches handled cleanly
{
  const expanded = Array.from({ length: 18 }, (_, i) => ({
    ...CARDS[i % CARDS.length],
    year: i < 3 ? "1994" : "2001",
    loc: i < 3 ? "Bristol, UK" : "Tokyo"
  }));
  const res = filterCardIndices(expanded, 18, "bristol");
  assert.deepEqual(res.matchedIndices, [0, 1, 2]);
  assert.equal(formatSearchCount(res.matchCount, res.totalCount), "3 of 18");

  const empty = filterCardIndices(expanded, 18, "nonexistentband");
  assert.deepEqual(empty.matchedIndices, []);
  assert.equal(formatSearchCount(empty.matchCount, empty.totalCount), "0 of 18");
}

// 3. Explicit isolation: filtering never mutates cards, order, or History state
{
  const snapshotBefore = JSON.stringify(CARDS);
  const history = new History();
  history.initialize({ cards: CARDS.map(c => ({ ...c })), count: CARDS.length });
  const initialSnap = history.present;

  const filtered = filterCardIndices(CARDS, CARDS.length, "metal");
  assert.deepEqual(filtered.matchedIndices, [3]);
  assert.equal(JSON.stringify(CARDS), snapshotBefore, "search must never mutate card array or order");
  assert.equal(history.canUndo, false, "search must never push onto undo history");
  assert.equal(history.canRedo, false);
  assert.equal(history.present, initialSnap);
}

// 4. Performance at 300 cards + debounce behavior
{
  const many = Array.from({ length: 300 }, (_, i) => ({
    title: `Artist ${i + 1}`,
    genre: i % 2 === 0 ? "Indie Rock" : "Synth Pop",
    loc: i % 3 === 0 ? "London, UK" : "Berlin",
    year: String(1980 + (i % 45)),
    code: `A${i}`
  }));
  const t0 = performance.now();
  const res = filterCardIndices(many, 300, "london indie");
  const dt = performance.now() - t0;
  assert.equal(res.matchCount, 50);
  assert.ok(dt < 50, `filtering 300 cards took ${dt.toFixed(1)}ms, expected < 50ms`);

  let calls = 0;
  let lastVal = "";
  const deb = debounce(v => { calls++; lastVal = v; }, 25);
  deb("r");
  deb("ra");
  deb("rad");
  deb.flush();
  assert.equal(calls, 1);
  assert.equal(lastVal, "rad");
  deb("cancel");
  deb.cancel();
  assert.equal(calls, 1);
}

console.log("Search module tests passed.");

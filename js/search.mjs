// Phase 9 Part A: Pure, non-destructive local card search helpers.
// Filtering must never mutate cards, ordering, page layout, exports, or undo history.

const EXTRA_LATIN = { æ: "ae", ø: "o", œ: "oe", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th" };

export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[æøœßłđðþ]/g, ch => EXTRA_LATIN[ch] || ch)
    .trim();
}

export function tokenizeSearchQuery(rawQuery) {
  const norm = normalizeSearchText(rawQuery);
  return norm ? norm.split(/\s+/).filter(Boolean) : [];
}

export function cardSearchHaystack(card) {
  if (!card || typeof card !== "object") return "";
  return normalizeSearchText([
    card.title,
    card.genre,
    card.loc,
    card.year,
    card.code,
    card.role,
    card.company,
    card.phone,
    card.email,
    card.website,
    card.address,
    card.qrText,
    card.stx,
    card.imgUrl
  ].filter(Boolean).join(" "));
}

export function matchesSearchTokens(haystack, tokens) {
  if (!tokens.length) return true;
  if (!haystack) return false;
  return tokens.every(token => haystack.includes(token));
}

export function filterCardIndices(cards, count, rawQuery) {
  const totalCount = Math.max(0, Math.min(Number(count) || 0, Array.isArray(cards) ? cards.length : 0));
  const tokens = tokenizeSearchQuery(rawQuery);
  const isActive = tokens.length > 0;
  const matchedIndices = [];
  for (let index = 0; index < totalCount; index++) {
    if (!isActive || matchesSearchTokens(cardSearchHaystack(cards[index]), tokens)) {
      matchedIndices.push(index);
    }
  }
  return {
    query: String(rawQuery ?? ""),
    tokens,
    isActive,
    totalCount,
    matchCount: matchedIndices.length,
    matchedIndices,
    matchedSet: new Set(matchedIndices)
  };
}

export function formatSearchCount(matchCount, totalCount) {
  return `${Math.max(0, Number(matchCount) || 0)} of ${Math.max(0, Number(totalCount) || 0)}`;
}

export function debounce(fn, delayMs = 120) {
  let timerId = null;
  let lastArgs = null;
  const run = () => {
    timerId = null;
    const args = lastArgs;
    lastArgs = null;
    fn(...args);
  };
  const debounced = (...args) => {
    lastArgs = args;
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(run, delayMs);
  };
  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
  };
  debounced.flush = (...args) => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (args.length) lastArgs = args;
    if (lastArgs !== null) run();
  };
  return debounced;
}

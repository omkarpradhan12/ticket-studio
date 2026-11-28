// Isolated Online Band Lookup Provider Module (Phase 9 Part B)
// Keep all external API endpoints, rate limits, normalization & caches here so
// providers can be swapped or disabled cleanly without touching the Sheet Editor.

export const LOOKUP_FEATURE_CONFIG = {
  enabled: true,
  defaultProvider: "musicbrainz", // "musicbrainz" | "theaudiodb" | "itunes" | "wikipedia"
  minMbGapMs: 1250,
  requestTimeoutMs: 10000
};

const IGNORED_MB_TAGS = new Set(["seen live", "fixme", "my favourite", "favorites", "check", "under 2000 listeners"]);
const searchCache = new Map();
const photoCache = new Map();
let mbQueue = Promise.resolve();
let lastMbAt = 0;

function titleCaseTag(raw) {
  return String(raw || "")
    .trim()
    .split(/\s+/)
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : "")
    .join(" ");
}

export function extractYear(rawDate) {
  const m = String(rawDate || "").match(/\b(\d{4})\b/);
  return m ? m[1] : "";
}

export function makeBandAbbr(name) {
  return String(name || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
}

export function clearLookupCaches() {
  searchCache.clear();
  photoCache.clear();
}

export function parseMusicBrainzArtists(json) {
  const list = Array.isArray(json?.artists) ? json.artists : [];
  return list.map(a => {
    const cleanTags = (Array.isArray(a.tags) ? a.tags : [])
      .filter(t => t && t.name && !IGNORED_MB_TAGS.has(String(t.name).toLowerCase()))
      .sort((x, y) => (Number(y.count) || 0) - (Number(x.count) || 0))
      .slice(0, 2)
      .map(t => titleCaseTag(t.name));
    const locParts = [];
    const primaryArea = a["begin-area"]?.name || a.area?.name || "";
    if (primaryArea) locParts.push(primaryArea);
    if (a.country && !primaryArea.includes(a.country) && locParts.length === 0) locParts.push(a.country);
    else if (a.country && a.area?.name && a["begin-area"]?.name && a.area.name !== a["begin-area"].name) {
      locParts.push(a.country);
    }
    return {
      id: `mb:${a.id || a.name}`,
      mbid: a.id || "",
      source: "MusicBrainz",
      name: String(a.name || "").trim(),
      disambiguation: String(a.disambiguation || a.type || "").trim(),
      genre: cleanTags.join(" / "),
      loc: locParts.join(", "),
      year: extractYear(a["life-span"]?.begin),
      code: makeBandAbbr(a.name),
      score: Number(a.score) || 0,
      licenseNote: "Metadata: MusicBrainz (CC0)"
    };
  }).filter(item => item.name);
}

export function parseWikipediaSearch(json) {
  const list = Array.isArray(json?.query?.search) ? json.query.search : [];
  const decodeBasic = s => s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return list.map(entry => {
    const cleanSnippet = decodeBasic(String(entry.snippet || ""));
    const rawTitle = String(entry.title || "").trim();
    const cleanName = rawTitle.replace(/\s*\((?:band|musician|singer|group|duo)\)\s*$/i, "").trim();
    return {
      id: `wp:${entry.pageid || rawTitle}`,
      wikiPageTitle: rawTitle,
      source: "Wikipedia",
      name: cleanName || rawTitle,
      disambiguation: cleanSnippet.slice(0, 96) + (cleanSnippet.length > 96 ? "…" : ""),
      genre: "",
      loc: "",
      year: "",
      code: makeBandAbbr(cleanName || rawTitle),
      score: 100,
      licenseNote: "Summary & photo: Wikipedia / Wikimedia Commons"
    };
  }).filter(item => item.name);
}

export function parseTheAudioDbArtists(json) {
  const list = Array.isArray(json?.artists) ? json.artists : [];
  return list.map(a => {
    const name = String(a?.strArtist || "").trim();
    const genre = [a?.strGenre, a?.strStyle]
      .map(s => String(s || "").trim())
      .filter((s, idx, arr) => s && arr.indexOf(s) === idx)
      .slice(0, 2)
      .join(" / ");
    return {
      id: `tadb:${a.idArtist || name}`,
      mbid: a.strMusicBrainzID || "",
      source: "TheAudioDB",
      name,
      disambiguation: String(a?.strLabel || "").trim(),
      genre,
      loc: String(a?.strCountry || "").trim(),
      year: extractYear(a?.intFormedYear || a?.intBornYear),
      code: makeBandAbbr(name),
      photoUrl: String(a?.strArtistThumb || "").trim(),
      score: 100,
      licenseNote: "Metadata: TheAudioDB"
    };
  }).filter(item => item.name);
}

export function parseItunesArtists(json) {
  const list = Array.isArray(json?.results) ? json.results : [];
  return list
    .filter(item => item && item.wrapperType === "artist" && item.artistName)
    .map(item => {
      const name = String(item.artistName || "").trim();
      return {
        id: `it:${item.artistId || name}`,
        mbid: "",
        source: "iTunes",
        name,
        disambiguation: item.artistType ? String(item.artistType) : "",
        genre: String(item.primaryGenreName || "").trim(),
        loc: "",
        year: "",
        code: makeBandAbbr(name),
        score: 100,
        licenseNote: "Metadata: Apple / iTunes Search API"
      };
    });
}

async function fetchJsonWithTimeout(url, fetchImpl, timeoutMs, options = {}) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const resp = await fetchImpl(url, ctrl ? { ...options, signal: ctrl.signal } : options);
    if (!resp.ok) {
      const err = new Error(
        resp.status === 503
          ? "MusicBrainz is temporarily rate-limiting browser requests (HTTP 503). Wait a moment or switch to TheAudioDB / iTunes."
          : resp.status === 429
            ? "Rate limit reached (HTTP 429). Please wait before searching again."
            : `Lookup request failed (HTTP ${resp.status}).`
      );
      err.httpStatus = resp.status;
      throw err;
    }
    return await resp.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function enqueueMb(taskFn, minGapMs = LOOKUP_FEATURE_CONFIG.minMbGapMs) {
  const run = mbQueue.then(async () => {
    const wait = Math.max(0, lastMbAt + minGapMs - Date.now());
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastMbAt = Date.now();
    return taskFn();
  });
  mbQueue = run.catch(() => {});
  return run;
}

export async function searchOnlineBands(rawQuery, {
  provider = LOOKUP_FEATURE_CONFIG.defaultProvider,
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = LOOKUP_FEATURE_CONFIG.requestTimeoutMs
} = {}) {
  if (!LOOKUP_FEATURE_CONFIG.enabled) {
    throw new Error("Online band lookup is currently disabled.");
  }
  const query = String(rawQuery || "").trim();
  if (!query) return { query: "", provider, results: [], fromCache: false };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("You appear to be offline. Connect to the internet or use Manual URL / Bulk Upload.");
  }

  const cacheKey = `${provider}:${query.toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return { ...searchCache.get(cacheKey), fromCache: true };
  }

  if (provider === "theaudiodb") {
    const url = `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(query)}`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    const out = { query, provider: "theaudiodb", results: parseTheAudioDbArtists(json), fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  if (provider === "itunes") {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=musicArtist&limit=10`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    const out = { query, provider: "itunes", results: parseItunesArtists(json), fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  if (provider === "wikipedia") {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " band music")}&srlimit=6&format=json&origin=*`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    const out = { query, provider: "wikipedia", results: parseWikipediaSearch(json), fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  const mbUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(query)}&fmt=json&limit=6`;
  const json = await enqueueMb(() => fetchJsonWithTimeout(mbUrl, fetchImpl, timeoutMs));
  const out = { query, provider: "musicbrainz", results: parseMusicBrainzArtists(json), fromCache: false };
  searchCache.set(cacheKey, out);
  return out;
}

export async function fetchWikipediaPhotoForArtist({
  name,
  wikiPageTitle = "",
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = LOOKUP_FEATURE_CONFIG.requestTimeoutMs
} = {}) {
  const cleanName = String(wikiPageTitle || name || "").trim();
  if (!cleanName) return null;
  const cacheKey = cleanName.toLowerCase();
  if (photoCache.has(cacheKey)) return photoCache.get(cacheKey);

  const candidates = wikiPageTitle
    ? [wikiPageTitle]
    : [cleanName, `${cleanName}_(band)`];

  let found = null;
  for (const title of candidates) {
    const slug = encodeURIComponent(title.replace(/\s+/g, "_"));
    try {
      const data = await fetchJsonWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, fetchImpl, timeoutMs);
      if (data?.type === "disambiguation") continue;
      if (data?.thumbnail?.source) {
        found = {
          pageTitle: data.title || cleanName,
          description: data.description || "",
          thumbUrl: data.thumbnail.source,
          originalUrl: data.originalimage?.source || data.thumbnail.source,
          pageUrl: data.content_urls?.desktop?.page || "",
          licenseNote: "Wikimedia Commons via Wikipedia (verify file license before commercial print reuse)"
        };
        break;
      }
    } catch {
      // Try next title candidate or return null cleanly
    }
  }
  photoCache.set(cacheKey, found);
  return found;
}

export function mergeCardLookupFields(existingCard = {}, incomingFields = {}, { overwrite = false } = {}) {
  const next = { ...existingCard };
  const textKeys = ["title", "genre", "loc", "year", "code"];
  for (const key of textKeys) {
    const val = String(incomingFields[key] ?? "").trim();
    if (!val) continue;
    const cur = String(next[key] ?? "").trim();
    if (overwrite || !cur) next[key] = val;
  }
  if (incomingFields.imgUrl) {
    const hasPhoto = Boolean(String(next.img || "").trim() || String(next.imgUrl || "").trim());
    if (overwrite || !hasPhoto) {
      next.img = incomingFields.imgUrl;
      next.imgUrl = incomingFields.imgUrl;
      if (incomingFields.corsLimited !== undefined) next.corsLimited = Boolean(incomingFields.corsLimited);
      if (Number.isFinite(incomingFields.h)) next.h = incomingFields.h;
      if (Number.isFinite(incomingFields.s)) next.s = incomingFields.s;
    }
  }
  return next;
}

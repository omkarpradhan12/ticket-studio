// Isolated Online Album Lookup Provider Module (Option 2 Standalone Workspace)
// Searches MusicBrainz release-groups (Album Name, Artist Name, Release Year) & Cover Art Archive / Wikipedia.
// Intentionally excludes studio-album ordinal calculation per owner instruction.

export const ALBUM_LOOKUP_CONFIG = {
  enabled: true,
  defaultProvider: "musicbrainz", // "musicbrainz" | "wikipedia"
  minMbGapMs: 1250,
  requestTimeoutMs: 10000
};

const searchCache = new Map();
const coverCache = new Map();
let mbQueue = Promise.resolve();
let lastMbAt = 0;

export function makeAlbumAbbr(title) {
  return String(title || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
}

export function extractReleaseYear(rawDate) {
  const m = String(rawDate || "").match(/\b(\d{4})\b/);
  return m ? m[1] : "";
}

export function clearAlbumLookupCaches() {
  searchCache.clear();
  coverCache.clear();
}

function escapeLuceneTerm(str) {
  return String(str || "").trim().replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseMusicBrainzReleaseGroups(json) {
  const list = Array.isArray(json?.["release-groups"]) ? json["release-groups"] : [];
  return list.map(rg => {
    const artistNames = (Array.isArray(rg["artist-credit"]) ? rg["artist-credit"] : [])
      .map(c => c?.name || c?.artist?.name || "")
      .filter(Boolean)
      .join(", ");
    const pType = String(rg["primary-type"] || "Album").trim();
    const secTypes = Array.isArray(rg["secondary-types"]) ? rg["secondary-types"].filter(Boolean) : [];
    const typeLabel = secTypes.length ? `${pType} · ${secTypes.join(", ")}` : pType;
    const title = String(rg.title || "").trim();
    return {
      id: `rg:${rg.id || title}`,
      mbid: rg.id || "",
      source: "MusicBrainz",
      albumName: title,
      artistName: artistNames,
      year: extractReleaseYear(rg["first-release-date"]),
      code: makeAlbumAbbr(artistNames || title),
      releaseType: typeLabel,
      score: Number(rg.score) || 0,
      licenseNote: "Metadata: MusicBrainz Release Group (CC0)"
    };
  }).filter(item => item.albumName);
}

export function parseWikipediaAlbumSearch(json, artistHint = "") {
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
    const cleanAlbum = rawTitle.replace(/\s*\([^)]*album[^)]*\)\s*$/i, "").trim();
    return {
      id: `wp-alb:${entry.pageid || rawTitle}`,
      mbid: "",
      wikiPageTitle: rawTitle,
      source: "Wikipedia",
      albumName: cleanAlbum || rawTitle,
      artistName: String(artistHint || "").trim(),
      year: extractReleaseYear(cleanSnippet),
      code: makeAlbumAbbr(artistHint || cleanAlbum || rawTitle),
      releaseType: "Album",
      score: 100,
      disambiguation: cleanSnippet.slice(0, 96) + (cleanSnippet.length > 96 ? "…" : ""),
      licenseNote: "Summary & cover: Wikipedia / Wikimedia"
    };
  }).filter(item => item.albumName);
}

async function fetchWithTimeout(url, fetchImpl, timeoutMs, options = {}) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(url, ctrl ? { ...options, signal: ctrl.signal } : options);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchJsonWithTimeout(url, fetchImpl, timeoutMs) {
  const resp = await fetchWithTimeout(url, fetchImpl, timeoutMs);
  if (!resp.ok) {
    const err = new Error(
      resp.status === 503
        ? "MusicBrainz is temporarily rate-limiting browser requests (HTTP 503). Retry in a moment or switch to Wikipedia lookup."
        : resp.status === 429
          ? "Rate limit reached (HTTP 429). Please wait before searching again."
          : `Album lookup failed (HTTP ${resp.status}).`
    );
    err.httpStatus = resp.status;
    throw err;
  }
  return await resp.json();
}

function enqueueMb(taskFn, minGapMs = ALBUM_LOOKUP_CONFIG.minMbGapMs) {
  const run = mbQueue.then(async () => {
    const wait = Math.max(0, lastMbAt + minGapMs - Date.now());
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastMbAt = Date.now();
    return taskFn();
  });
  mbQueue = run.catch(() => {});
  return run;
}

export async function searchOnlineAlbums(rawAlbumQuery, {
  artist = "",
  provider = ALBUM_LOOKUP_CONFIG.defaultProvider,
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = ALBUM_LOOKUP_CONFIG.requestTimeoutMs
} = {}) {
  if (!ALBUM_LOOKUP_CONFIG.enabled) {
    throw new Error("Album lookup is currently disabled.");
  }
  const albumQuery = String(rawAlbumQuery || "").trim();
  const artistQuery = String(artist || "").trim();
  if (!albumQuery) return { query: "", artist: artistQuery, provider, results: [], fromCache: false };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("You appear to be offline. Connect to the internet or upload local cover art.");
  }

  const cacheKey = `${provider}:${albumQuery.toLowerCase()}::${artistQuery.toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return { ...searchCache.get(cacheKey), fromCache: true };
  }

  if (provider === "wikipedia") {
    const qStr = [albumQuery, artistQuery, "album"].filter(Boolean).join(" ");
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qStr)}&srlimit=8&format=json&origin=*`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    const out = { query: albumQuery, artist: artistQuery, provider: "wikipedia", results: parseWikipediaAlbumSearch(json, artistQuery), fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  const parts = [`releasegroup:${escapeLuceneTerm(albumQuery)}`];
  if (artistQuery) parts.push(`artist:${escapeLuceneTerm(artistQuery)}`);
  parts.push("primarytype:album");
  const lucene = parts.join(" AND ");
  const mbUrl = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(lucene)}&fmt=json&limit=8`;
  const json = await enqueueMb(() => fetchJsonWithTimeout(mbUrl, fetchImpl, timeoutMs));
  const out = { query: albumQuery, artist: artistQuery, provider: "musicbrainz", results: parseMusicBrainzReleaseGroups(json), fromCache: false };
  searchCache.set(cacheKey, out);
  return out;
}

export async function fetchAlbumCoverArt({
  mbid = "",
  albumName = "",
  artistName = "",
  wikiPageTitle = "",
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = ALBUM_LOOKUP_CONFIG.requestTimeoutMs
} = {}) {
  const key = `${mbid}|${wikiPageTitle}|${albumName}|${artistName}`.toLowerCase();
  if (coverCache.has(key)) return coverCache.get(key);

  let found = null;
  if (mbid) {
    const caaUrl = `https://coverartarchive.org/release-group/${encodeURIComponent(mbid)}/front-500`;
    try {
      const resp = await fetchWithTimeout(caaUrl, fetchImpl, timeoutMs, { method: "GET" });
      if (resp.ok) {
        found = {
          coverUrl: resp.url || caaUrl,
          source: "Cover Art Archive",
          licenseNote: "Cover Art Archive (verify album artwork rights before commercial distribution)"
        };
      }
    } catch {
      // Fall through cleanly to Wikipedia album cover summary
    }
  }

  if (!found && (wikiPageTitle || albumName)) {
    const candidates = wikiPageTitle
      ? [wikiPageTitle]
      : [
          ...(artistName ? [`${albumName}_(${artistName}_album)`] : []),
          `${albumName}_(album)`,
          albumName
        ];
    for (const title of candidates) {
      const slug = encodeURIComponent(title.replace(/\s+/g, "_"));
      try {
        const data = await fetchJsonWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, fetchImpl, timeoutMs);
        if (data?.type === "disambiguation") continue;
        if (data?.thumbnail?.source) {
          found = {
            coverUrl: data.thumbnail.source,
            source: "Wikipedia / Wikimedia",
            licenseNote: "Wikipedia / Wikimedia (verify artwork copyright before printing/distributing)"
          };
          break;
        }
      } catch {
        // Try next candidate
      }
    }
  }

  coverCache.set(key, found);
  return found;
}

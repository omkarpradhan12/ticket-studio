// Isolated Online Album Lookup Provider Module
// Searches iTunes/Apple Music (fast zero-key + cover art), MusicBrainz release-groups (CC0),
// Spotify Web API (optional Bearer token from referenced music APIs list), or Wikipedia.
// Intentionally excludes studio-album ordinal calculation per owner instruction.

export const ALBUM_LOOKUP_CONFIG = {
  enabled: true,
  defaultProvider: "musicbrainz", // "musicbrainz" | "itunes" | "spotify" | "wikipedia"
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

function formatLuceneField(field, value) {
  const clean = escapeLuceneTerm(value);
  if (!clean) return "";
  return clean.includes(" ") ? `${field}:"${clean}"` : `${field}:${clean}`;
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

export function upgradeItunesArtworkUrl(rawUrl, size = 600) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  return s.replace(/\/(\d+x\d+bb)(?=\.[a-z0-9]+(?:\?|$))/i, `/${size}x${size}bb`);
}

export function parseItunesAlbums(json, { artistQuery = "" } = {}) {
  const list = Array.isArray(json?.results) ? json.results : [];
  const normArtist = String(artistQuery || "").trim().toLowerCase();
  const mapped = list
    .filter(item => item && (item.wrapperType === "collection" || item.collectionType === "Album") && item.collectionName)
    .map(item => {
      const albumName = String(item.collectionName || "").trim();
      const artistName = String(item.artistName || "").trim();
      const isEp = /\s*-\s*EP$/i.test(albumName);
      const isSingle = /\s*-\s*Single$/i.test(albumName) || (Number(item.trackCount) > 0 && Number(item.trackCount) <= 3);
      const releaseType = isSingle ? "Single" : (isEp ? "EP" : String(item.collectionType || "Album"));
      const coverUrl = upgradeItunesArtworkUrl(item.artworkUrl100 || item.artworkUrl60 || "", 600);
      const artistMatch = normArtist
        ? (artistName.toLowerCase() === normArtist ? 2 : (artistName.toLowerCase().includes(normArtist) ? 1 : 0))
        : 1;
      return {
        id: `it-alb:${item.collectionId || albumName}`,
        mbid: "",
        source: "iTunes",
        albumName,
        artistName,
        year: extractReleaseYear(item.releaseDate),
        code: makeAlbumAbbr(artistName || albumName),
        releaseType,
        coverUrl,
        score: artistMatch === 2 ? 100 : (artistMatch === 1 ? 85 : 65),
        disambiguation: item.primaryGenreName ? String(item.primaryGenreName) : "",
        licenseNote: "Metadata & cover: Apple / iTunes Search API",
        _artistMatch: artistMatch,
        _isStudioLp: releaseType === "Album" ? 0 : 1
      };
    });

  const seen = new Set();
  const deduped = [];
  for (const item of mapped) {
    const key = `${item.albumName.toLowerCase()}::${item.artistName.toLowerCase()}::${item.year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export function parseSpotifyAlbums(json, fallbackArtist = "") {
  const list = Array.isArray(json?.albums?.items)
    ? json.albums.items
    : (Array.isArray(json?.items) ? json.items : []);
  return list
    .filter(item => item && item.name)
    .map(item => {
      const artistName = (Array.isArray(item.artists) ? item.artists : [])
        .map(a => a?.name || "")
        .filter(Boolean)
        .join(", ") || String(fallbackArtist || "").trim();
      const images = Array.isArray(item.images) ? item.images : [];
      const coverUrl = images[0]?.url || images[images.length - 1]?.url || "";
      const albumName = String(item.name || "").trim();
      const rawType = String(item.album_type || "album").toLowerCase();
      const releaseType = rawType ? rawType[0].toUpperCase() + rawType.slice(1) : "Album";
      return {
        id: `sp-alb:${item.id || albumName}`,
        mbid: "",
        source: "Spotify",
        albumName,
        artistName,
        year: extractReleaseYear(item.release_date),
        code: makeAlbumAbbr(artistName || albumName),
        releaseType,
        coverUrl,
        score: 100,
        disambiguation: item.total_tracks ? `${item.total_tracks} tracks` : "",
        licenseNote: "Metadata & cover: Spotify Web API"
      };
    });
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

async function fetchJsonWithTimeout(url, fetchImpl, timeoutMs, options = {}) {
  const resp = await fetchWithTimeout(url, fetchImpl, timeoutMs, options);
  if (!resp.ok) {
    const err = new Error(
      resp.status === 401
        ? "Authorization failed (HTTP 401). Check your Spotify Bearer token or switch to iTunes / MusicBrainz."
        : resp.status === 503
          ? "MusicBrainz is temporarily rate-limiting browser requests (HTTP 503). Wait a moment or switch to iTunes / Wikipedia."
          : resp.status === 429
            ? "Rate limit reached (HTTP 429). Please wait or switch source."
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
  spotifyToken = "",
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = ALBUM_LOOKUP_CONFIG.requestTimeoutMs
} = {}) {
  if (!ALBUM_LOOKUP_CONFIG.enabled) {
    throw new Error("Album lookup is currently disabled.");
  }
  const albumQuery = String(rawAlbumQuery || "").trim();
  const artistQuery = String(artist || "").trim();
  if (!albumQuery && !artistQuery) return { query: "", artist: "", provider, results: [], fromCache: false };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("You appear to be offline. Connect to the internet or upload local cover art.");
  }

  const cleanToken = String(spotifyToken || "").trim().replace(/^Bearer\s+/i, "");
  if (provider === "spotify" && !cleanToken) {
    throw new Error("Spotify Web API requires a Bearer token. Paste a token or switch to iTunes (fast, no key).");
  }

  const cacheKey = `${provider}:${albumQuery.toLowerCase()}::${artistQuery.toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return { ...searchCache.get(cacheKey), fromCache: true };
  }

  const artistOnly = !albumQuery && Boolean(artistQuery);

  if (provider === "itunes") {
    const term = [albumQuery, artistQuery].filter(Boolean).join(" ");
    const params = new URLSearchParams({
      term,
      media: "music",
      entity: "album",
      limit: artistOnly ? "50" : "25"
    });
    if (artistOnly) params.set("attribute", "artistTerm");
    const url = `https://itunes.apple.com/search?${params.toString()}`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    let results = parseItunesAlbums(json, { artistQuery });
    if (artistQuery) {
      const matched = results.filter(r => r._artistMatch > 0);
      if (matched.length) results = matched;
    }
    if (artistOnly) {
      results.sort((a, b) => {
        if (b._artistMatch !== a._artistMatch) return b._artistMatch - a._artistMatch;
        if (a._isStudioLp !== b._isStudioLp) return a._isStudioLp - b._isStudioLp;
        const aYear = Number(a.year) || 9999;
        const bYear = Number(b.year) || 9999;
        if (aYear !== bYear) return aYear - bYear;
        return a.albumName.localeCompare(b.albumName);
      });
    } else if (artistQuery) {
      results.sort((a, b) => (b._artistMatch - a._artistMatch) || (a._isStudioLp - b._isStudioLp));
    }
    results = results.map(({ _artistMatch, _isStudioLp, ...clean }) => clean);
    const out = { query: albumQuery, artist: artistQuery, provider: "itunes", results, fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  if (provider === "spotify") {
    const headers = { Authorization: `Bearer ${cleanToken}` };
    let results = [];
    if (artistOnly) {
      const searchRes = await fetchJsonWithTimeout(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistQuery)}&type=artist&limit=5`,
        fetchImpl,
        timeoutMs,
        { headers }
      );
      const artists = Array.isArray(searchRes?.artists?.items) ? searchRes.artists.items : [];
      const exactArtist = artists.find(a => String(a.name || "").toLowerCase() === artistQuery.toLowerCase()) || artists[0];
      if (exactArtist?.id) {
        const albJson = await fetchJsonWithTimeout(
          `https://api.spotify.com/v1/artists/${encodeURIComponent(exactArtist.id)}/albums?include_groups=album,compilation&limit=50`,
          fetchImpl,
          timeoutMs,
          { headers }
        );
        results = parseSpotifyAlbums(albJson, exactArtist.name || artistQuery).sort((a, b) => {
          const aStd = a.releaseType === "Album" ? 0 : 1;
          const bStd = b.releaseType === "Album" ? 0 : 1;
          if (aStd !== bStd) return aStd - bStd;
          return (Number(a.year) || 9999) - (Number(b.year) || 9999);
        });
      }
    } else {
      const qParts = [];
      if (albumQuery) qParts.push(`album:${albumQuery}`);
      if (artistQuery) qParts.push(`artist:${artistQuery}`);
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(qParts.join(" "))}&type=album&limit=25`;
      const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs, { headers });
      results = parseSpotifyAlbums(json, artistQuery);
    }
    const out = { query: albumQuery, artist: artistQuery, provider: "spotify", results, fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  if (provider === "wikipedia") {
    const qStr = artistOnly
      ? `${artistQuery} "studio album"`
      : [albumQuery, artistQuery, "album"].filter(Boolean).join(" ");
    const limit = artistOnly ? 16 : 8;
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(qStr)}&srlimit=${limit}&format=json&origin=*`;
    const json = await fetchJsonWithTimeout(url, fetchImpl, timeoutMs);
    let results = parseWikipediaAlbumSearch(json, artistQuery);
    if (artistOnly) {
      results = results.filter(item => !/\((band|musician|singer|songwriter|group|rapper|discography)\)|\bdiscography$/i.test(item.wikiPageTitle || item.albumName));
    }
    const out = { query: albumQuery, artist: artistQuery, provider: "wikipedia", results, fromCache: false };
    searchCache.set(cacheKey, out);
    return out;
  }

  const parts = [];
  if (albumQuery) parts.push(`releasegroup:${escapeLuceneTerm(albumQuery)}`);
  if (artistQuery) parts.push(formatLuceneField("artist", artistQuery));
  parts.push("primarytype:album");
  const lucene = parts.join(" AND ");
  const mbLimit = artistOnly ? 50 : 8;
  const mbUrl = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(lucene)}&fmt=json&limit=${mbLimit}`;
  const json = await enqueueMb(() => fetchJsonWithTimeout(mbUrl, fetchImpl, timeoutMs));
  let results = parseMusicBrainzReleaseGroups(json);
  if (artistOnly) {
    const seen = new Set();
    results = results
      .filter(item => {
        const key = `${item.albumName.toLowerCase()}::${item.year || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aStudio = a.releaseType === "Album" ? 0 : 1;
        const bStudio = b.releaseType === "Album" ? 0 : 1;
        if (aStudio !== bStudio) return aStudio - bStudio;
        const aYear = Number(a.year) || 9999;
        const bYear = Number(b.year) || 9999;
        if (aYear !== bYear) return aYear - bYear;
        return (b.score || 0) - (a.score || 0);
      });
  }
  const out = { query: albumQuery, artist: artistQuery, provider: "musicbrainz", results, fromCache: false };
  searchCache.set(cacheKey, out);
  return out;
}

export async function fetchAlbumCoverArt({
  mbid = "",
  albumName = "",
  artistName = "",
  wikiPageTitle = "",
  coverUrl = "",
  source = "",
  fetchImpl = (...args) => fetch(...args),
  timeoutMs = ALBUM_LOOKUP_CONFIG.requestTimeoutMs
} = {}) {
  const directUrl = String(coverUrl || "").trim();
  if (/^https?:\/\//i.test(directUrl)) {
    return {
      coverUrl: directUrl,
      source: source || "Album provider",
      licenseNote: `${source || "Provider"} cover artwork (verify rights before commercial print)`
    };
  }
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

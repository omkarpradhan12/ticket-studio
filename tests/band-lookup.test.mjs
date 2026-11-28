import assert from "node:assert/strict";
import {
  clearLookupCaches,
  extractYear,
  fetchWikipediaPhotoForArtist,
  mergeCardLookupFields,
  parseItunesArtists,
  parseMusicBrainzArtists,
  parseTheAudioDbArtists,
  parseWikipediaSearch,
  searchOnlineBands
} from "../js/band-lookup-providers.mjs";

// 1. Parse MusicBrainz multi-match artists safely
{
  const parsed = parseMusicBrainzArtists({
    artists: [
      {
        id: "mb-1",
        name: "Nirvana",
        disambiguation: "1980s–1990s US grunge band",
        country: "US",
        area: { name: "United States" },
        "begin-area": { name: "Aberdeen" },
        "life-span": { begin: "1987-01" },
        tags: [{ name: "seen live", count: 99 }, { name: "grunge", count: 50 }, { name: "alternative rock", count: 35 }],
        score: 100
      },
      {
        id: "mb-2",
        name: "Nirvana",
        disambiguation: "60s UK psychedelic pop band",
        country: "GB",
        area: { name: "United Kingdom" },
        "begin-area": { name: "London" },
        "life-span": { begin: "1967" },
        tags: [{ name: "psychedelic pop", count: 20 }],
        score: 82
      }
    ]
  });
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, "Nirvana");
  assert.equal(parsed[0].genre, "Grunge / Alternative Rock");
  assert.equal(parsed[0].loc, "Aberdeen, US");
  assert.equal(parsed[0].year, "1987");
  assert.equal(parsed[0].code, "NIRV");
  assert.equal(parsed[1].year, "1967");
  assert.equal(extractYear("1991-05-01"), "1991");
}

// 2. Parse Wikipedia fallback results
{
  const wiki = parseWikipediaSearch({
    query: {
      search: [
        { pageid: 1, title: "Muse (band)", snippet: "English <span>rock</span> &quot;band&quot; from Teignmouth." }
      ]
    }
  });
  assert.equal(wiki.length, 1);
  assert.equal(wiki[0].name, "Muse");
  assert.equal(wiki[0].wikiPageTitle, "Muse (band)");
  assert.ok(wiki[0].disambiguation.includes('"band"'));
}

// 3. Session cache + 503 error reporting (zero real network calls)
{
  clearLookupCaches();
  let calls = 0;
  const mockFetch = async () => {
    calls++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ artists: [{ id: "1", name: "Radiohead", country: "GB", "begin-area": { name: "Abingdon" }, "life-span": { begin: "1991" }, tags: [{ name: "rock", count: 10 }], score: 100 }] })
    };
  };
  const r1 = await searchOnlineBands("Radiohead", { provider: "musicbrainz", fetchImpl: mockFetch });
  const r2 = await searchOnlineBands("radiohead", { provider: "musicbrainz", fetchImpl: mockFetch });
  assert.equal(r1.fromCache, false);
  assert.equal(r2.fromCache, true);
  assert.equal(calls, 1, "session cache should prevent duplicate requests");

  let caught503 = null;
  try {
    await searchOnlineBands("ThrottleTest", {
      provider: "musicbrainz",
      fetchImpl: async () => ({ ok: false, status: 503 })
    });
  } catch (e) {
    caught503 = e;
  }
  assert.equal(caught503?.httpStatus, 503);
  assert.ok(caught503?.message.includes("503"));
}

// 4. Wikipedia photo lookup handles disambiguation safely & falls back to _(band)
{
  clearLookupCaches();
  const seenUrls = [];
  const res = await fetchWikipediaPhotoForArtist({
    name: "Muse",
    fetchImpl: async url => {
      seenUrls.push(url);
      if (url.endsWith("/Muse")) {
        return { ok: true, status: 200, json: async () => ({ type: "disambiguation" }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          type: "standard",
          title: "Muse (band)",
          description: "English rock band",
          thumbnail: { source: "https://thumb.wikimedia.org/muse.jpg" }
        })
      };
    }
  });
  assert.equal(seenUrls.length, 2);
  assert.equal(res.thumbUrl, "https://thumb.wikimedia.org/muse.jpg");
}

// 5. Merge rules never overwrite already-edited fields unless overwrite=true
{
  const existing = { title: "My Custom Band", genre: "", loc: "Seattle", year: "" };
  const filledEmptyOnly = mergeCardLookupFields(existing, {
    title: "Radiohead",
    genre: "Alternative Rock",
    loc: "Abingdon",
    year: "1991"
  }, { overwrite: false });
  assert.equal(filledEmptyOnly.title, "My Custom Band");
  assert.equal(filledEmptyOnly.loc, "Seattle");
  assert.equal(filledEmptyOnly.genre, "Alternative Rock");
  assert.equal(filledEmptyOnly.year, "1991");

  const replaced = mergeCardLookupFields(existing, {
    title: "Radiohead",
    genre: "Alternative Rock",
    loc: "Abingdon",
    year: "1991"
  }, { overwrite: true });
  assert.equal(replaced.title, "Radiohead");
  assert.equal(replaced.loc, "Abingdon");
}

// 6. Fast zero-key TheAudioDB / iTunes & optional-token Spotify providers
{
  clearLookupCaches();
  const tadb = await searchOnlineBands("Skillet", {
    provider: "theaudiodb",
    fetchImpl: async url => {
      assert.ok(url.includes("theaudiodb.com/api/v1/json/123/search.php?s=Skillet"));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          artists: [{ idArtist: "111902", strArtist: "Skillet", strGenre: "Hard Rock", strStyle: "Rock", strCountry: "Memphis, USA", intFormedYear: "1996", strArtistThumb: "https://r2.theaudiodb.com/thumb.jpg", strLabel: "Atlantic" }]
        })
      };
    }
  });
  assert.equal(tadb.results[0].name, "Skillet");
  assert.equal(tadb.results[0].loc, "Memphis, USA");
  assert.equal(tadb.results[0].year, "1996");
  assert.equal(tadb.results[0].code, "SKIL");
  assert.equal(tadb.results[0].photoUrl, "https://r2.theaudiodb.com/thumb.jpg");

  const it = await searchOnlineBands("Skillet", {
    provider: "itunes",
    fetchImpl: async url => {
      assert.ok(url.includes("itunes.apple.com/search"));
      return {
        ok: true,
        status: 200,
        json: async () => ({ results: [{ wrapperType: "artist", artistId: 1750802, artistName: "Skillet", primaryGenreName: "Hard Rock", artistType: "Artist" }] })
      };
    }
  });
  assert.equal(it.results[0].genre, "Hard Rock");
  assert.equal(it.results[0].code, "SKIL");
}

console.log("Band lookup provider tests passed.");

import assert from "node:assert/strict";
import {
  clearAlbumLookupCaches,
  extractReleaseYear,
  fetchAlbumCoverArt,
  parseMusicBrainzReleaseGroups,
  parseWikipediaAlbumSearch,
  searchOnlineAlbums
} from "../js/album-lookup-providers.mjs";

// 1. MusicBrainz release-group parsing (Album Name, Artist Name, Release Year, no ordinal)
{
  const parsed = parseMusicBrainzReleaseGroups({
    "release-groups": [
      {
        id: "b1392450-e666-3926-a536-22c65f834433",
        title: "OK Computer",
        "primary-type": "Album",
        "secondary-types": [],
        "first-release-date": "1997-05-21",
        "artist-credit": [{ name: "Radiohead" }],
        score: 100
      }
    ]
  });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].albumName, "OK Computer");
  assert.equal(parsed[0].artistName, "Radiohead");
  assert.equal(parsed[0].year, "1997");
  assert.equal(parsed[0].code, "RADI");
  assert.equal("albumOrdinal" in parsed[0], false);
  assert.equal(extractReleaseYear("2013-05-17"), "2013");
}

// 2. Wikipedia fallback HTML entity decode & formatting (uses band/artist hint for abbreviation)
{
  const wiki = parseWikipediaAlbumSearch({
    query: {
      search: [{ pageid: 42, title: "OK Computer (album)", snippet: "Third album by &quot;Radiohead&quot; released in 1997." }]
    }
  }, "Radiohead");
  assert.equal(wiki[0].albumName, "OK Computer");
  assert.equal(wiki[0].artistName, "Radiohead");
  assert.equal(wiki[0].year, "1997");
  assert.equal(wiki[0].code, "RADI");
  assert.ok(wiki[0].disambiguation.includes('"Radiohead"'));
}

// 3. Query URL construction includes artist filter + primarytype:album and session cache works
{
  clearAlbumLookupCaches();
  const seenUrls = [];
  const mockFetch = async url => {
    seenUrls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({ "release-groups": [{ id: "rg1", title: "Discovery", "artist-credit": [{ name: "Daft Punk" }], "first-release-date": "2001", score: 100 }] })
    };
  };
  const r1 = await searchOnlineAlbums("Discovery", { artist: "Daft Punk", fetchImpl: mockFetch });
  const r2 = await searchOnlineAlbums("discovery", { artist: "daft punk", fetchImpl: mockFetch });
  assert.equal(r1.fromCache, false);
  assert.equal(r2.fromCache, true);
  assert.equal(seenUrls.length, 1);
  assert.ok(seenUrls[0].includes("primarytype%3Aalbum"));
  assert.ok(seenUrls[0].includes("Daft%20Punk"));
}

// 4. Cover Art Archive lookup with Wikipedia fallback on 404
{
  clearAlbumLookupCaches();
  const res = await fetchAlbumCoverArt({
    mbid: "missing-caa",
    albumName: "OK Computer",
    artistName: "Radiohead",
    fetchImpl: async url => {
      if (url.includes("coverartarchive.org")) return { ok: false, status: 404 };
      if (url.includes("Radiohead_album")) return { ok: false, status: 404 };
      if (url.includes("_(album)")) return { ok: true, status: 200, json: async () => ({ type: "standard", thumbnail: { source: "https://thumb.wikimedia.org/ok.png" } }) };
      return { ok: false, status: 404 };
    }
  });
  assert.equal(res.coverUrl, "https://thumb.wikimedia.org/ok.png");
}

console.log("Album lookup provider tests passed.");

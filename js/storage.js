// Unified Session Storage (IndexedDB + localStorage fallback)

export const DB_NAME = "ticketgen_db";
export const STORE_NAME = "sessions";
export const SESSION_KEY = "ticketgen.v1";

export const SEED_DATA = [
  ["Three Days Grace", "Alt-Rock", "Canada", "1997", "TDG", 345, 0.8],
  ["Linkin Park", "Nu Metal", "California", "1996", "LP", 325, 0.8],
  ["Skillet", "Hard Rock", "Tennessee", "1996", "SKLT", 18, 0.85],
  ["Breaking Benjamin", "Hard Rock", "PA", "1999", "BB", 30, 0.7],
  ["Simple Plan", "Pop-Punk", "Quebec", "1999", "SP", 203, 0.85],
  ["Saint Asonia", "Alt-Metal", "Ontario", "2015", "SA", 355, 0.7],
  ["Sum 41", "Punk Rock", "Ontario", "1996", "SUM", 2, 0.85],
  ["Citizen Soldier", "Alt-Rock", "Utah", "2016", "CS", 220, 0.25],
  ["Daughtry", "Post-Grunge", "NC", "2006", "DGHT", 32, 0.45]
];

export const SET0 = {
  style: "cream",
  doors: "Doors 7PM",
  side: "Dope-Amine",
  stamp: "Soul Fuel",
  stampYear: "2026",
  stampSize: 100,
  stampShape: "round",
  stampColor: "#d9322f",
  stampAuto: true,
  stamp2: "",
  stampWear: 35,
  borderWear: 35,
  gradientAngle: 180,
  gradientSpread: 32,
  titleFont: "theme",
  paper: "a4",
  cardSize: "ticket",
  cutterCorners: "0",
  grain: 15,
  edgeWear: 0,
  creases: 0,
  scuffs: 0,
  serials: false,
  cropMarks: true,
  bleed: true,
  regMarks: false,
  nfc: true,
  cutTemplate: true,
  punchHole: false,
  pageThemes: [],
  borderStyle: 0,
  photoMounts: [0],
  yearBadge: 0,
  tearStyle: 0,
  photoFilter: 0,
  centerTitle: false,
  halftone: false
};

export const blankCard = () => ({
  title: "",
  genre: "",
  loc: "",
  year: "",
  code: "",
  img: null,
  imgUrl: "",
  corsLimited: false,
  h: Math.floor(Math.random() * 360),
  s: 0.75
});

export const SAMPLE_CARDS = SEED_DATA.map(s => ({
  title: s[0],
  genre: s[1],
  loc: s[2],
  year: s[3],
  code: s[4],
  img: null,
  imgUrl: "",
  corsLimited: false,
  h: s[5],
  s: s[6]
}));

export const DEFAULT_CARDS = SAMPLE_CARDS.map(c => ({
  ...c,
  title: "",
  genre: "",
  loc: "",
  year: "",
  code: ""
}));

function idbOp(mode, fn) {
  return new Promise((res, rej) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return rej(new Error("No IndexedDB"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE_NAME, mode);
      const out = fn(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => res(out.result);
      tx.onerror = () => rej(tx.error);
    };
    req.onerror = () => rej(req.error);
  });
}

export async function loadSession() {
  let restored = null;
  try {
    restored = await idbOp("readonly", st => st.get(SESSION_KEY));
  } catch {}
  if (!restored) {
    try {
      restored = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {}
  }
  return restored;
}

export async function persistSession(payload) {
  try {
    await idbOp("readwrite", st => st.put(payload, SESSION_KEY));
    return "Saved locally";
  } catch {
    try {
      // Strip heavy data URIs if falling back to localStorage, keep external URLs
      const lightCards = payload.cards.map(c => ({
        ...c,
        img: c.img && c.img.startsWith("data:") ? null : c.img
      }));
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...payload, cards: lightCards }));
      return "Saved (embedded photos exceeded localStorage)";
    } catch {
      return "Not saved";
    }
  }
}

export async function clearSession() {
  try {
    await idbOp("readwrite", st => st.delete(SESSION_KEY));
  } catch {}
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

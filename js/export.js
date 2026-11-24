// Vector SVG, 300 DPI PNG, 300 DPI Raster PDF, Cutter SVG & JSON Export Helpers
import { FONTCSS } from "./fonts.js?v=phase6";
import { hslToHex } from "./image-utils.js?v=phase6";
import { abbr } from "./svg-engine.js?v=phase6";

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function serializeSheetSvg(el, W, H) {
  const t = el.cloneNode(true);
  t.querySelectorAll(".pp").forEach(n => n.remove());
  t.setAttribute("width", (W / 2.83465).toFixed(2) + "mm");
  t.setAttribute("height", (H / 2.83465).toFixed(2) + "mm");
  const st = document.createElementNS("http://www.w3.org/2000/svg", "style");
  st.textContent = FONTCSS;
  t.insertBefore(st, t.firstChild);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(t);
}

export function rasterizeSvg(svgStr, w, h) {
  return new Promise((res, rej) => {
    const im = new Image();
    const u = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml" }));
    im.onload = () => setTimeout(() => {
      try {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        if (!x) {
          URL.revokeObjectURL(u);
          return rej(new Error("Canvas context unavailable"));
        }
        x.fillStyle = "#fff";
        x.fillRect(0, 0, w, h);
        x.drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(u);
        res(c);
      } catch (err) {
        URL.revokeObjectURL(u);
        rej(err);
      }
    }, 180);
    im.onerror = () => {
      URL.revokeObjectURL(u);
      rej(new Error("SVG rasterization failed (external URL may block CORS)"));
    };
    im.src = u;
  });
}

export function exportAllSvgs(sheets, W, H, onStatus) {
  sheets.forEach((el, p) => {
    const name = (el.dataset.name || `ticket-cards-p${p + 1}`) + ".svg";
    setTimeout(() => triggerDownload(new Blob([serializeSheetSvg(el, W, H)], { type: "image/svg+xml" }), name), p * 400);
  });
  if (onStatus) onStatus(`Downloading ${sheets.length} vector SVG page(s)…`);
}

export async function exportAllPngs(sheets, W, H, onStatus) {
  try {
    for (let p = 0; p < sheets.length; p++) {
      if (onStatus) onStatus(`Rendering PNG ${p + 1}/${sheets.length}…`);
      const c = await rasterizeSvg(serializeSheetSvg(sheets[p], W, H), Math.round(W / 72 * 300), Math.round(H / 72 * 300));
      const name = (sheets[p].dataset.name || `ticket-cards-p${p + 1}`) + ".png";
      await new Promise((r, rej) => c.toBlob(b => b ? (triggerDownload(b, name), r()) : rej(new Error("Canvas tainted by CORS image"))));
      await new Promise(r => setTimeout(r, 350));
    }
    if (onStatus) onStatus("PNG export done (300 dpi)");
  } catch (e) {
    if (onStatus) onStatus("PNG export failed: " + e.message + " — use Download SVG or Print / PDF.");
  }
}

export async function exportPdf(sheets, W, H, onStatus) {
  try {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) {
      if (onStatus) onStatus("PDF library offline. Use 'Print / save PDF' instead.");
      return;
    }
    const d = new J({ unit: "pt", format: [W, H], orientation: "portrait" });
    for (let p = 0; p < sheets.length; p++) {
      if (onStatus) onStatus(`Rendering PDF page ${p + 1}/${sheets.length}…`);
      const c = await rasterizeSvg(serializeSheetSvg(sheets[p], W, H), Math.round(W / 72 * 300), Math.round(H / 72 * 300));
      if (p) d.addPage([W, H], "portrait");
      d.addImage(c.toDataURL("image/jpeg", 0.93), "JPEG", 0, 0, W, H);
    }
    d.save("ticket-cards.pdf");
    if (onStatus) onStatus("PDF saved (300 dpi). For infinite vector sharpness, use Print / save PDF.");
  } catch (e) {
    if (onStatus) onStatus("PDF export failed: " + e.message + " — use Print / save PDF.");
  }
}

export function exportProjectJson(settings, cards, count) {
  const payload = {
    settings,
    cards: cards.slice(0, count).map(c => {
      const r = {
        name: c.title,
        year: c.year,
        genre: c.genre,
        place: c.loc,
        abbreviation: c.code || abbr(c.title),
        accent: hslToHex(c)
      };
      if (c.img) {
        r.photo = c.img;
        if (c.imgUrl && !c.img.startsWith("http")) r.photoUrl = c.imgUrl;
        if (c.zm && c.zm !== 1) r.photoZoom = +c.zm.toFixed(2);
        if (c.px) r.photoX = Math.round(c.px);
        if (c.py) r.photoY = Math.round(c.py);
      }
      if (c.theme) r.theme = c.theme;
      if (c.sk) r.stampShape = c.sk;
      if (c.stx) r.stampText = c.stx;
      if (c.border && typeof c.border === "object") r.border = c.border;
      return r;
    })
  };
  triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "ticket-cards.json");
}

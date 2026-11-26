// Image Loading (Local Files + Direct URLs with CORS Fallback) & Color Sampling

export const hsl = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

export function hslToHex(p) {
  if (p?.accent && /^#[\da-f]{6}$/i.test(String(p.accent).trim())) {
    return String(p.accent).trim().toLowerCase();
  }
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = hsl(p.h ?? 35, p.s ?? 0.75, 0.52);
  return c.fillStyle;
}

export function hexToHS(hex) {
  let clean = String(hex || "").trim();
  if (/^#[\da-f]{3}$/i.test(clean)) {
    const [, rr, gg, bb] = clean;
    clean = `#${rr}${rr}${gg}${gg}${bb}${bb}`;
  }
  if (!/^#[\da-f]{6}$/i.test(clean)) return { h: 35, s: 0.75 };
  clean = clean.toLowerCase();
  const r = parseInt(clean.slice(1, 3), 16) / 255;
  const g = parseInt(clean.slice(3, 5), 16) / 255;
  const b = parseInt(clean.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn, l = (mx + mn) / 2;
  if (!df) return { h: 0, s: 0, accent: clean };
  const h = mx === r ? ((g - b) / df) % 6 : mx === g ? (b - r) / df + 2 : (r - g) / df + 4;
  const denom = 1 - Math.abs(2 * l - 1) || 1;
  return {
    h: (h * 60 + 360) % 360,
    s: Math.max(0, Math.min(1, df / denom)),
    accent: clean
  };
}

export function sampleImageColor(img) {
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, 24, 24);
  const d = x.getImageData(0, 0, 24, 24).data;
  let sx = 0, sy = 0, sw = 0, ss = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, df = mx - mn;
    if (!df) continue;
    const s = df / (1 - Math.abs(2 * l - 1) || 1);
    let h = mx === r ? ((g - b) / df) % 6 : mx === g ? (b - r) / df + 2 : (r - g) / df + 4;
    h *= 60 * Math.PI / 180;
    const w = s * (1 - Math.abs(2 * l - 1)) * df;
    sx += Math.cos(h) * w;
    sy += Math.sin(h) * w;
    sw += w;
    ss += s * w;
  }
  if (sw < 0.5) return { h: 35, s: 0.35 };
  return {
    h: (Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360,
    s: Math.min(0.9, Math.max(0.55, ss / sw))
  };
}

/**
 * Loads a local File object into compressed JPEG dataURL + dimensions + sampled accent
 */
export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Choose a valid image file."));
    }
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error("Image is larger than 15 MB. Please choose a smaller file."));
    }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Could not read image file."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error("Image could not be decoded."));
      im.onload = () => {
        const m = Math.min(1, 900 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * m));
        c.height = Math.max(1, Math.round(im.height * m));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        const color = sampleImageColor(im);
        resolve({
          img: c.toDataURL("image/jpeg", 0.9),
          imgUrl: "",
          iw: c.width,
          ih: c.height,
          zm: 1,
          px: 0,
          py: 0,
          corsLimited: false,
          ...color
        });
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/**
 * Loads an external http(s) Image URL.
 * First attempts CORS-enabled load so we can compress & sample accent color.
 * If host blocks CORS, falls back cleanly to raw URL for SVG preview/export.
 */
export function processImageUrl(rawUrl) {
  return new Promise((resolve, reject) => {
    const url = String(rawUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      return reject(new Error("Enter a valid http:// or https:// image URL."));
    }

    // Attempt 1: CORS anonymous (allows canvas pixel sampling & offline caching)
    const corsImg = new Image();
    corsImg.crossOrigin = "anonymous";
    corsImg.onload = () => {
      try {
        const m = Math.min(1, 900 / Math.max(corsImg.width, corsImg.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(corsImg.width * m));
        c.height = Math.max(1, Math.round(corsImg.height * m));
        c.getContext("2d").drawImage(corsImg, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.9);
        const color = sampleImageColor(corsImg);
        resolve({
          img: dataUrl,
          imgUrl: url,
          iw: c.width,
          ih: c.height,
          zm: 1,
          px: 0,
          py: 0,
          corsLimited: false,
          ...color
        });
      } catch {
        fallbackDirectLoad();
      }
    };
    corsImg.onerror = () => fallbackDirectLoad();
    corsImg.src = url;

    // Attempt 2: Direct load without CORS (works for live SVG & vector SVG download)
    function fallbackDirectLoad() {
      const plainImg = new Image();
      plainImg.onload = () => {
        resolve({
          img: url,
          imgUrl: url,
          iw: plainImg.naturalWidth || 600,
          ih: plainImg.naturalHeight || 600,
          zm: 1,
          px: 0,
          py: 0,
          corsLimited: true
        });
      };
      plainImg.onerror = () => {
        reject(new Error("Could not load image from that URL. Check that it links directly to an image."));
      };
      plainImg.src = url;
    }
  });
}

export function cleanFilenameToTitle(filename) {
  return String(filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w/g, ch => ch.toUpperCase());
}

// Corner hardware styles (bolts, push pins, staples, eyelet rivets, none)
// and optional surface distress effects (claw marks, corner tear, bullet hole, blood spatter).

export const CORNER_HARDWARE_OPTIONS = [
  { id: "bolts", name: "Bolts (Default)" },
  { id: "pins", name: "Push pins" },
  { id: "staples", name: "Corner staples" },
  { id: "rivets", name: "Eyelet rivets" },
  { id: "none", name: "None (Clean corners)" }
];

const VALID_HARDWARE = new Set(CORNER_HARDWARE_OPTIONS.map(o => o.id));

export function normalizeCornerHardware(value, fallback = "bolts") {
  const clean = String(value ?? "").trim().toLowerCase();
  return VALID_HARDWARE.has(clean) ? clean : fallback;
}

export function renderCornerHardware({
  style = "bolts",
  index = 0,
  CW = 170,
  CH = 239,
  accent = "#ff5a36",
  theme = {}
}) {
  const kind = normalizeCornerHardware(style, "bolts");
  if (kind === "none") return "";

  const i = index;
  const mt = theme.mt || "#a39a88";
  const hi = theme.hi || "#f6efe0";
  const dk = theme.dk || "#2a2723";
  const corners = [[9, 9], [CW - 9, 9], [9, CH - 9], [CW - 9, CH - 9]];

  // Preserve exact legacy 4-corner screw bolt markup byte-for-byte
  if (kind === "bolts") {
    let sc = "";
    corners.forEach(([bx, by], k) => {
      const ang = (i * 47 + k * 61) % 180, ph = (i + k) % 2;
      sc += `<g transform="translate(${bx} ${by})"><circle cx=".35" cy=".5" r="2.5" fill="#000" opacity=".3"/><circle r="2.5" fill="${mt}" stroke="${dk}" stroke-width=".35"/><circle r="1.9" fill="none" stroke="${hi}" stroke-width=".3" opacity=".7"/><circle cx="-.7" cy="-.8" r=".7" fill="${hi}" opacity=".55"/><g transform="rotate(${ang})" stroke="${dk}" stroke-width=".42" stroke-linecap="round"><path d="M-1.5 0H1.5"/>${ph ? '<path d="M0 -1.5V1.5"/>' : ''}</g></g>`;
    });
    return sc;
  }

  if (kind === "pins") {
    let out = "";
    corners.forEach(([bx, by], k) => {
      const dx = bx < CW / 2 ? 1.4 : -1.4;
      const dy = 1.6;
      const pinColor = k % 2 === 0 ? accent : mt;
      out += `<g transform="translate(${bx} ${by})"><circle cx="${dx}" cy="${dy}" r="2.5" fill="#000" opacity=".28"/><path d="M0 0L${(dx * 1.1).toFixed(1)} ${(dy * 1.1).toFixed(1)}" stroke="#000" stroke-opacity=".35" stroke-width=".85" stroke-linecap="round"/><circle r="2.8" fill="${pinColor}" stroke="${dk}" stroke-width=".4"/><circle r="1.8" fill="${pinColor}" stroke="${hi}" stroke-width=".35" stroke-opacity=".55"/><circle cx="-.85" cy="-.85" r=".75" fill="#fff" opacity=".65"/></g>`;
    });
    return out;
  }

  if (kind === "staples") {
    let out = "";
    const staplePos = [
      [10.5, 10.5, -42],
      [CW - 10.5, 10.5, 42],
      [10.5, CH - 10.5, 42],
      [CW - 10.5, CH - 10.5, -42]
    ];
    staplePos.forEach(([bx, by, rot]) => {
      out += `<g transform="translate(${bx} ${by}) rotate(${rot})"><circle cx="-4.8" cy="0" r=".55" fill="${dk}" opacity=".65"/><circle cx="4.8" cy="0" r=".55" fill="${dk}" opacity=".65"/><path d="M-4.8 .35H4.8" stroke="#000" stroke-opacity=".28" stroke-width="1.35" stroke-linecap="round"/><path d="M-4.8 0H4.8" stroke="${mt}" stroke-width="1.05" stroke-linecap="round"/><path d="M-4.4 -.2H4.4" stroke="${hi}" stroke-opacity=".78" stroke-width=".4" stroke-linecap="round"/></g>`;
    });
    return out;
  }

  // Hollow eyelet rivets
  let out = "";
  corners.forEach(([bx, by]) => {
    out += `<g transform="translate(${bx} ${by})"><circle cx=".3" cy=".45" r="3.1" fill="#000" opacity=".25"/><circle r="3.1" fill="${mt}" stroke="${dk}" stroke-width=".4"/><circle r="2.2" fill="none" stroke="${hi}" stroke-width=".35" opacity=".75"/><circle r="1.2" fill="#fff" stroke="${dk}" stroke-width=".45"/></g>`;
  });
  return out;
}

export function renderSurfaceFx({
  index = 0,
  CW = 170,
  CH = 239,
  theme = {},
  fx = {}
}) {
  const hasAny = Boolean(fx && (fx.claw || fx.tear || fx.bullet || fx.blood));
  if (!hasAny) return "";
  const hi = theme.hi || "#f6efe0";
  const dk = theme.dk || "#221814";
  let out = "";

  if (fx.claw) {
    const mode = index % 2;
    const tx = mode ? CW - 34 : 14;
    const ty = mode ? 18 : 22;
    const dir = mode ? -1 : 1;
    const slashes = [
      [0, 0, 26, 30],
      [7, -4, 34, 27],
      [14, -7, 39, 21]
    ];
    let claws = "";
    slashes.forEach(([x0, y0, x1, y1], idx) => {
      const mx = (x0 + x1) / 2 + dir * 2.2;
      const my = (y0 + y1) / 2 - 1.5;
      const w = idx === 1 ? 1.5 : 1.15;
      claws += `<path d="M${tx + x0 * dir} ${ty + y0}Q${tx + mx * dir} ${ty + my} ${tx + x1 * dir} ${ty + y1}Q${tx + (mx - w) * dir} ${ty + my + w} ${tx + x0 * dir} ${ty + y0}Z" fill="${dk}" opacity=".76"/><path d="M${tx + x0 * dir} ${ty + y0}Q${tx + mx * dir} ${ty + my} ${tx + x1 * dir} ${ty + y1}" fill="none" stroke="${hi}" stroke-width=".45" stroke-opacity=".55" stroke-linecap="round"/>`;
    });
    out += `<g aria-hidden="true">${claws}</g>`;
  }

  if (fx.blood) {
    const bx = index % 2 ? 28 : CW - 36;
    const by = index % 3 === 0 ? CH - 46 : 32;
    const dir = bx < CW / 2 ? 1 : -1;
    out += `<g aria-hidden="true" transform="translate(${bx} ${by})">
      <path d="M0 0C5 -4 11 -1 12 4C13 9 7 13 2 11C-4 13 -8 8 -6 3C-5 -1 -2 -2 0 0Z" fill="#7c0b13" opacity=".84"/>
      <path d="M-2 1C2 -2 7 0 8 4C8 7 4 9 1 8C-2 9 -5 6 -4 2Z" fill="#9e131e" opacity=".7"/>
      <circle cx="${13 * dir}" cy="-6" r="2.2" fill="#7c0b13" opacity=".82"/>
      <circle cx="${18 * dir}" cy="-10" r="1.2" fill="#8f0f18" opacity=".78"/>
      <circle cx="${15 * dir}" cy="9" r="1.7" fill="#7c0b13" opacity=".8"/>
      <circle cx="${21 * dir}" cy="13" r=".9" fill="#9e131e" opacity=".75"/>
      <path d="M${7 * dir} 6L${19 * dir} 17" stroke="#7c0b13" stroke-width="1.05" stroke-linecap="round" opacity=".7"/>
      <path d="M${-3 * dir} 11L${-5 * dir} 22" stroke="#7c0b13" stroke-width=".9" stroke-linecap="round" opacity=".68"/>
      <circle cx="${-5 * dir}" cy="23.2" r="1.15" fill="#7c0b13" opacity=".82"/>
    </g>`;
  }

  if (fx.bullet) {
    const hx = index % 2 ? CW - 25 : 27;
    const hy = 29 + (index % 3) * 9;
    out += `<g aria-hidden="true" transform="translate(${hx} ${hy})">
      <circle r="7.2" fill="#1b1410" opacity=".16"/>
      <path d="M0 0L-6.8 -4.4M0 0L6.2 -5.1M0 0L7.5 1.9M0 0L2.6 7.4M0 0L-5.4 5.8M0 0L-7.4 .6" stroke="${dk}" stroke-width=".55" stroke-linecap="round" opacity=".62"/>
      <path d="M-3.5 -1.4L-1.6 -3.7L1.5 -3.6L3.7 -1.2L3.3 2.1L.9 3.8L-2.4 3.1L-3.8 .6Z" fill="#231a16" opacity=".88"/>
      <circle r="2.1" fill="#fff" stroke="${dk}" stroke-width=".45"/>
    </g>`;
  }

  if (fx.tear) {
    const rightSide = index % 2 === 0;
    if (rightSide) {
      out += `<g aria-hidden="true">
        <path d="M${CW - 28} 0H${CW}V30L${CW - 5} 24L${CW - 8} 26L${CW - 11} 19L${CW - 15} 21L${CW - 19} 13L${CW - 24} 15L${CW - 25} 6Z" fill="#fff"/>
        <path d="M${CW - 28} 0L${CW - 25} 6L${CW - 24} 15L${CW - 19} 13L${CW - 15} 21L${CW - 11} 19L${CW - 8} 26L${CW - 5} 24L${CW} 30L${CW - 3} 31L${CW - 8} 27.5L${CW - 12} 21L${CW - 16} 23L${CW - 20.5} 15L${CW - 25.5} 16.5L${CW - 27} 7L${CW - 30} 0Z" fill="#000" opacity=".2"/>
      </g>`;
    } else {
      out += `<g aria-hidden="true">
        <path d="M0 0H28L25 6L24 15L19 13L15 21L11 19L8 26L5 24L0 30Z" fill="#fff"/>
        <path d="M28 0L25 6L24 15L19 13L15 21L11 19L8 26L5 24L0 30L3 31L8 27.5L12 21L16 23L20.5 15L25.5 16.5L27 7L30 0Z" fill="#000" opacity=".2"/>
      </g>`;
    }
  }

  return out;
}

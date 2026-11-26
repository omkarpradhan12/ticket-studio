const PATHS = Object.freeze({
  undo: '<path d="M3 7v6h6"/><path d="M21 18a9 9 0 0 0-15-6L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 18a9 9 0 0 1 15-6l3 1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5"/>',
  randomise: '<path d="m16 3 5 5-5 5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  surprise: '<path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5 12 21l9-4.5"/><path d="M12 7v1"/><path d="M12 10v.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/>',
  duplicate: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  moveUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  moveDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  delete: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  view: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  move: '<path d="M12 3v18"/><path d="m7 8 5-5 5 5"/><path d="m17 16-5 5-5-5"/>',
  previous: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="m18 6-12 12"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.7-3.1 1.9 1.9 0 0 1 1.6-2.9H18a3 3 0 0 0 3-3c0-5-4-9-9-9Z"/><path d="M7.5 10h.01"/><path d="M10 7.5h.01"/><path d="M14 7.5h.01"/><path d="M16.5 10h.01"/>',
  bulkUpload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5"/><path d="M8 14H4"/><path d="M6 12v4"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  logo: '<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="M12 8v8"/><path d="M9 10v4"/><path d="M15 10v4"/>'
});

const tooltipTimers = new WeakMap();
const installedRoots = new WeakSet();

export function iconMarkup(name, className = "icon") {
  const paths = PATHS[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function hydrateIcons(root = document) {
  const slots = [
    ...(root.matches?.("[data-icon]") ? [root] : []),
    ...root.querySelectorAll("[data-icon]")
  ];
  for (const slot of slots) {
    slot.innerHTML = iconMarkup(slot.dataset.icon);
    slot.removeAttribute("data-icon");
    slot.setAttribute("aria-hidden", "true");
  }
}

export function bindTapTooltips(root = document) {
  if (installedRoots.has(root)) return;
  installedRoots.add(root);
  root.addEventListener("pointerdown", event => {
    const trigger = event.target.closest?.("[data-tooltip]");
    if (!trigger || trigger.disabled) return;
    const oldTimer = tooltipTimers.get(trigger);
    if (oldTimer) clearTimeout(oldTimer);
    trigger.dataset.tooltipOpen = "true";
    tooltipTimers.set(trigger, setTimeout(() => {
      trigger.removeAttribute("data-tooltip-open");
      tooltipTimers.delete(trigger);
    }, 1400));
  }, true);
}

# Phase 0 Audit

## 1. Architecture
- The app is a static, ES-module app with no framework or build step.
- Entry points: `index.html` -> `js/app.js`, `theme-studio.html` -> `js/theme-studio.js`, `bulk-import.html` -> `js/bulk-import.js`.
- Shared modules:
  - `js/storage.js`: IndexedDB/localStorage session and defaults/card seeds.
  - `js/themes.js`: built-in and saved custom themes.
  - `js/svg-engine.js`: layout and SVG card/rendering primitives.
  - `js/export.js`: SVG/PNG/PDF/JSON export.
  - `js/fonts.js`: embedded WOFF2 `FONTCSS` data.
  - `js/image-utils.js`: image loading, color sampling, HSL/hex helpers.
- Sheet state flow: DOM controls and card fields -> `readSettings()` / card objects -> `renderCard()` / `computeLayout()` -> SVG inside `#sheets` -> SVG/PNG/PDF/print exports.
- Sheet save: IndexedDB key `ticketgen_db/sessions/ticketgen.v1`, with a localStorage fallback in `loadSession()`/`persistSession()`.
- Custom themes: localStorage key `ticketgen.customThemes.v1`; `themes.js` also exposes live registries `THEMES` and `saved_*`.
- Sheet Editor and Theme Studio share custom themes through `localStorage` and the `refreshSavedThemes()` registry. Theme Studio does not save sheet state. Bulk Import loads/persists the same session key.

## 2. Sheet Editor controls
Controls listed from `index.html` and its state wiring:

| Control / element | State key or variable | Live preview |
|---|---|---|
| `count` | `count`; trims cards to max 72 | `change` -> rebuild/render |
| `paper` | `settings.paper` | `data-live` input |
| `csize` | `settings.cardSize` | `data-live` input |
| `crad` | settings only; cutter SVG | no preview sheet geometry; change not directly live |
| `marks` | settings/cfg.cropMarks | change |
| `bleed` | settings/cfg.bleed | change |
| `regmarks` | settings/cfg.regMarks | change |
| `tpl` | settings; adds template sheet | change |
| `style` | settings.style/cfg.style | change |
| `prev-style`, `next-style` | select `style` | render |
| `tfont` | settings.titleFont | data-live input |
| `nfc` | settings/cfg.nfc | change |
| `serial` | settings/cfg.serials | data-live input |
| `punch` | settings/cfg.punchHole | data-live/change |
| `gdoors`, `gside` | global card labels | input |
| `dial`, arrow/Home keys | module `gradientAngle` | live/keyboard |
| `gspread` | settings/cfg.gradientSpread | input |
| `ct_bg`, `ct_ink`, `ct_acc`, `ct_tape` | `CUSTOM.*` quick theme palette | input/change |
| `ct_pa` | `CUSTOM.pa` | input/change |
| `design-border` | settings/cfg.borderStyle | change |
| `design-badge` | settings/cfg.yearBadge | change |
| `design-tear` | settings/cfg.tearStyle | change |
| `design-filter` | settings/cfg.photoFilter | change |
| mount checkboxes | settings/cfg.photoMounts | change |
| `design-center`, `design-halftone` | cfg booleans | change |
| `sshape` | settings/cfg.stampShape | change |
| `ssize` | settings/cfg.stampSize | input |
| `gstamp`, `gsyear`, `gs2` | stamp text fields | input |
| `scol` | settings/cfg.stampColor | data-live input |
| `sauto` | settings/cfg.stampAuto | change/data-live |
| `wear`, `bwear` | stamp/border wear | input |
| `tgr`, `tew`, `tcr`, `tsc` | texture settings | input/data-live |
| Export/print/cutter actions | export helper calls | no state mutation |
| Randomise | mutates theme/stamp/wear/texture controls | render |
| Load Samples | replaces cards | render/save |
| Reset All | clears session then applies `SET0` | render/save |
| Import/Export JSON | card/settings payload | import mutates state |
| pasted JSON load | card import | import mutates state |
| `drag` | cfg.drag | change |
| `page-select` | module `activePage` | page selection |
| `page-theme` | module `pageThemes[activePage]` | change/render |
| `duplicate-page` | clones a page of cards and theme | render/save |
| Card fields title/genre/place/year/code/URL/accent | card object fields | input/change |
| Card crop zoom/X/Y | `card.zm/px/py` | input |
| Card theme/stamp/text | `card.theme/sk/stx` | input |
| Card row move/duplicate/delete/clear/reset/photo | cards array | immediate render/save |

The implementation mixes `data-live` input listeners with explicit `change`/`input` lists. Live controls are mostly live by schedule-render and debounced save; some fields (card list and custom colors) still use direct card/CUSTOM mutation.

## 3. CSS
- `tokens.css` establishes variables and the baseline light/dark page shell.
- `main.css` contains the original component styles and print media rules.
- `redesign.css` overrides top bar, layout, controls, rows, stage and mobile behavior with a “tour poster” visual system; it is loaded after `main.css`.
- `studio.css` contains Theme Studio and Bulk Import components.
- Because `index.html` loads `main.css` then `redesign.css`, and Theme/Bulk load `main`, `studio`, then `redesign`, selectors in `redesign.css` win in shared areas. Specific duplicate rules exist for topbar, app, panel, row, sheet, page tools and print-adjacent components.
- Dead/fragile candidates: print rules in `main.css` are late and may interact with JS-injected `@page` rules; repeated mobile `.app/.stage/.panel` rules are split across main and redesign; `.gctl`/dial rules overlap.
- Hard-coded UI values include colors, font sizes, spacing, radii and shadow values in all CSS and inline HTML/JS templates. Several card/theme colors must remain renderer values, not UI tokens.
- Inline styles are concentrated in all three HTML files and dynamic styles in `app.js`, `theme-studio.js`, `bulk-import.js`. Most are layout, swatches, thumbnails, and one gradient dial state rather than cached style configuration.
- Cache-busters mismatch: `index` loads `redesign.css?v=1` and app `v=palette-only-pages-4`; Theme/Bulk use studio without a version and app scripts with `?v=palette-only-pages-4`.

## 4. Icons and glyph use
- Unicode/nav icons include `<`/`>` theme and preview arrows, `▲`, `▼`, `⧉`, `✕`, `↺`, `★`, `←`, `→`, and close/modal symbols.
- Text-only controls include `JSON Help ?`, NFC badge, Add photo, action labels, and several “View/Edit/Delete/Remove/Load” buttons.
- No central icon component or SVG icon sprite is present.
- Card renderer also uses textual star/logo and year badge content rather than icon assets.

## 5. Card renderer
- `renderCard(c, i, cfg)` accepts card data plus layout, theme, global text, stamp, wear, texture, border, mount, title font, crop/filter, NFC/serial/punch, drag and gradient settings.
- SVG defs are globally emitted per card and use card-indexed IDs: `bgg${i}`, `ink${i}`, `bd${i}`, `np${i}`, `ht${i}`, `gr${i}`, `sc${i}`, `ew${i}`, `cc${i}`, `ck${i}`. They are usually collision-safe within one page because the card index is unique. However preview clone and modal fallbacks can also contain cloned markup; reused/indexed IDs should be audited if cards are sorted or preview fragments are reused.
- Fonts are self-contained through `FONTCSS` embedded in `fonts.js`; `fonts.js` is 207,923 bytes and embeds WOFF2 data URLs for SVG/Canvas use. The Sheet Editor injects these faces before its first full-sheet render; individual-card and exported SVGs retain their embedded font styles.
- Title layout uses font selection and `fit(cleanTitle, tf.s, 136, tf.k)`, uppercases the title, and is centered or left by `centerTitle`. It does not wrap; long titles shrink with the font fit helper, but fit uses fixed length and has a minimum of 3.4.
- The card is scaled using layout `K`; all internal mm geometry is effectively expressed in a 170px-wide SVG coordinate system.

## 6. Card sizes and photo framing
`SIZES`:

| Size | mm | Aspect ratio | Internal `CH` behavior |
|---|---:|---:|---|
| Ticket | 59.97 x 84.31 | 0.711 | baseline 239 |
| Poker | 63.5 x 88.9 | 0.714 | 239-ish |
| Credit | 54 x 85.6 | 0.631 | height > baseline |
| Mini | 45 x 64 | 0.703 | 239-ish |
| Tarot | 70 x 120 | 0.583 | height 309 max |

Photo area is X 17..153 and Y 16..`16 + 136 + D`, where `D = CH - 239`. `fitBox()` uses `k = max(136/iw, ph/ih) * zoom`, which cover-fits the frame. In the normal card branch, `<image>` uses explicit `b.w/b.h` and `preserveAspectRatio="none"` only when both intrinsic dimensions are known; otherwise it falls back to `slice`. Thus known Tarot photos may be raster-shaped, but the cover calculation is independent of card-width scaling and is computed for the current photo area. No normal case intentionally stretches an unknown intrinsic image. `preserveAspectRatio="none"` was introduced to apply crop offsets and fixed cover-box dimensions and can distort if intrinsic dimensions or fitBox diverge; verify at real Tarot size.

## 7. Print
- The Print button calls `window.print()` directly.
- `@page` is injected by JS into `#print-page-style` with A4/Letter portrait and zero margin, while `main.css` also defines `@page size:auto; margin:0`.
- Print CSS hides `.topbar`, `.panel`, `h1`, and `p.subtitle`, displays the app/stage normally, and each `.sheet` as width 100%, height auto, with page breaks after all but the last.
- It prints `#sheets`, including active sheet pages and cut-template page if enabled. It does not print the UI chrome.
- `.pp` drag overlays are hidden.
- The print size is nominally controlled by sheet SVG `width/height` and `@page`; actual browser scaling/headers may vary. Preview zoom does not exist currently, but print CSS overrides screen stage sizing.
- Need real print/PDF validation for true physical size, blank trailing pages, browser print scaling, and bleed/crop marks.

## 8. Borders
- Border style values (`js/borders.mjs`): `0` Double, `1` Thick, `2` Brackets, `3` Dashed, `4` Rounded (legacy exact fast-path when unmodified), plus `5` Triple line, `6` Thick retro, `7` Art-Deco, `8` Flourishes, `9` Dashed stitch, `10` Film-strip, `11` Scalloped stub, `12` Ink-bleed, `13` Holographic, `14` Neon glow, `15` None.
- Sheet-level defaults remain `settings.borderStyle` and `settings.borderWear`; optional non-default customisations live in `settings.border`, and optional per-card overrides live in `card.border`.
- Customisation controls inside the Look `Customise` fold dynamically filter by style support: line width, inset, colour (theme token or custom hex), opacity, line pattern/dash/gap, corner style/size (`square`, `rounded`, `notched`, `chamfered`), line gap, second inner border, corner ornament/size, border wear (synced with `#bwear`), and glow amount.
- Named presets persist in `localStorage` (`ticketgen.borderPresets.v1`) with Apply-to-sheet, Apply-to-selected-card, Apply-to-all-cards, and per-card `"Use sheet border"` reset.
- Filter/gradient IDs (`bd`, `bgl`, `bgd`) are scoped by render context (`sw-` for swatches, `pv-` in preview modal, card index on sheets) so inline SVGs never collide.
- The 3mm bleed is represented as an outer clip/background expansion and card crop marks account for bleed. Cutter corner radius is separate and exported in cutter SVG, not the normal card border.
- Stamps, mounts, crop marks and photo areas sit in separate groups and have independent indices/geometry.

## 9. Stamps
- Up to two stamps per card (`stamp` primary + optional `stamp2` rectangular stamp).
- Controls: 36-swatch visual stamp picker (`34` named shapes + `mixed` + `none`), `Customise` fold (`fillMode`, `weight`, `pattern`, `opacity`, `innerRing`, `showYear`, `wear` synced with `#wear`), `localStorage` presets (`ticketgen.stampPresets.v1`), size, primary text, year, second text, ink, accent-vs-fixed color, ink wear, plus Phase 7 `Move stamps` toolbar mode (mutually exclusive with `#drag`), snap toggle, and per-card rotary angle dial + scale controls.
- Un-overridden stamps keep deterministic-random auto placement; per-card overrides live in optional `card.stampPos` / `card.stamp2Pos` (`{ x, y, r, scale }` in card-relative fractions of `CW`/`CH`), strictly clamped inside card bounds via `stampNormBounds` (`[0.04, 0.96]`) with optional centre/margin snapping.
- Drag photos mode (`#drag`) adds transparent `.pp` rectangles on cards; `Move stamps` adds `.st-ui` outlines, `.st-hit` (`>=116×116` SVG units) drag/keyboard handles, and `.st-rot-hit` (`r=56` SVG units) rotation knobs (stripped in exports and hidden in `@media print`). Both use `getScreenCTM()` and Pointer Events with `setPointerCapture`.
- Photo mounts (`photoMounts`, up to 2): `0` Tape, `1` Pins, `2` Corners, `3` None, plus `4` Washi tape, `5` Brads, `6` Paperclip, `7` Staples, `8` Wax seal.

## 10. Global vs per-card
- Global: paper, card size, cutter radius, crop/bleed/template/reg marks, sheet theme, card count limit (`MAX_CARDS = 300`), global doors/side labels, stamp defaults, and surface defaults.
- Per-page: `pageThemes[]` overrides the sheet theme; card-level `card.theme` wins over `pageThemes[]`, which wins over `settings.style`.
- Per-card (all optional): `title`, `genre`, `loc`, `year`, `code`, `img`, `imgUrl`, sampled `h`/`s`, photo zoom/X/Y, `theme`, `palette`, `tape`, `border`, `sk`, `stx`, `stampStyle`, `stampColor`, `stampAuto`, `stampSize`, `stampWear`, `stampPos`, `stamp2Pos`, `photoMounts`, `titleFont`, `titleScale`, `centerTitle`, `yearBadge`, `tearStyle`, `grain`, `edgeWear`, `creases`, `scuffs`, `photoFilter`, `halftone`, `gradientAngle`, `gradientSpread`, and `locked`.
- Still global-only: paper size, card size, cutter radius, bleed/crop/reg/template marks, global doors/side labels, stamp2 text/year, serials, NFC, punchHole.

## 11. Card data model
`blankCard()` fields: `title`, `genre`, `loc`, `year`, `code`, `img`, `imgUrl`, `corsLimited`, `h`, `s`.
Optional/runtime fields: `iw`, `ih`, `zm`, `px`, `py`, plus optional styling fields (`theme`, `palette`, `tape`, `border`, `sk`, `stx`, `stampStyle`, `stampColor`, `stampAuto`, `stampSize`, `stampWear`, `stampPos`, `stamp2Pos`, `photoMounts`, `titleFont`, `titleScale`, `centerTitle`, `yearBadge`, `tearStyle`, `grain`, `edgeWear`, `creases`, `scuffs`, `photoFilter`, `halftone`, `gradientAngle`, `gradientSpread`, `locked`).
- Saved in session payload `{v, count, settings, cards}` in IndexedDB/localStorage.
- Bulk Import parses files, URLs, JSON, and CSV (`MAX_CARDS = 300`). JSON/CSV maps name/title/artist, genre, place/location/loc, year, abbreviation/abbr/code, photo/photoUrl/image/url, and optional card style fields via `sanitizeCardStyleOverrides`.
- Bulk staged cards use the same shape and are appended/replaced in the session.
- Card list (`buildRows()`) uses lazy `<details class="adj">` dropdown population and a shared photo file input so 200-card sheets stay responsive.

## 12. State and history readiness
- Phase 2 refactored Sheet Editor state into `studioState`: cards, count, selected card, active page, page themes, gradient angle and settings/custom palette. `previewIndex` and `dragState` remain transient view/gesture state.
- Card updates are copy-on-write, and card arrays/page-theme arrays are replaced rather than mutated, allowing history entries to share unchanged records safely.
- DOM controls are synchronized into settings at render boundaries; renderer configuration reads the resulting settings snapshot. `CUSTOM` and `THEMES` remain shared renderer/theme registries, with custom palette values captured in state.
- Save remains debounced 450ms by `saveSoon()` after `render()`. `persistSession()` retains the existing `{v, count, settings, cards}` payload and IndexedDB/localStorage behavior.
- Photo data URLs can make a snapshot very large. IndexedDB avoids the localStorage quota, but fallback intentionally drops only embedded `data:` photos, not external URLs.
- Phase 2 added in-memory undo/redo with a 100-entry limit, copy-on-write snapshots, coalescing, redo clearing, action labels and a subscription hook for future draft-scoped history.
- Snapshots include cards, count, selected card, active page, page themes, gradient angle and complete settings/custom palette. They exclude view-only state and Theme Studio drafts until Phase 5.
- The editable Sheet Editor title is now an optional `settings.sheetTitle` value with a default fallback for older saved sheets.
- Snapshot restore synchronizes controls, custom controls, card rows, page tools and preview, preserves current focus/expanded card details/scroll, and requests the existing debounced autosave once. History itself is never persisted.
- Sheet Editor JSON import, card/image actions, settings, pages, Randomise, Load Samples and Reset All are undoable. Bulk Upload transfer stays on its page with a single in-memory Undo/Open Editor toast; the transfer undo is lost on leave/reload.

## 13. Responsive behavior
- Desktop: Sheet Editor sidebar is 380px beside the preview; other pages retain their existing layouts.
- At mobile widths, the Sheet Editor has a workspace menu, Edit/Preview toggle, 40px Undo/Redo controls, and a fixed Print/Export action bar with 44px buttons.
- In mobile Preview mode, the stage is the scroll container; Edit mode exposes the panel. At 390px, browser verification found no horizontal document overflow.
- The preview toolbar contains page count/theme, duplicate page, a disabled Move stamps placeholder, and zoom/Fit controls.

## 14. Accessibility
- A shared `:focus-visible` rule covers links, buttons, form controls, summaries, tabindex targets, and role-based buttons/sliders. Keyboard Tab checks showed a 3px visible outline on the workspace menu controls across all pages.
- Icon-only controls have accessible labels. Tooltips display on hover, keyboard focus, and tap; the SVG icon set uses `currentColor` with a consistent stroke width.
- The preview modal is labelled, and `#msg`/`#sv` status uses partial live status.
- Theme Studio status message is not `aria-live`.
- Bulk/dropzone and card staging have some labels but staging drag reorder is mouse/desktop drag with no keyboard equivalent.
- Every rendered color picker has a separate validated hex text field with two-way synchronization. Sheet Editor hex changes use the existing undo path. Theme Studio draft-scoped undo was added in Phase 5.
- JSON format help is an anchored `<details>` popover operable by click/tap and keyboard, not a hover-only tooltip.
- The effective muted token `#9a928c` measures at least 5.25:1 on the sampled dark UI surfaces; see Phase 4 disposition below. No contrast token change was needed.
- Gradient dial remains visible but is disabled for non-gradient themes, removed from keyboard tab order, guarded against pointer/keyboard input, and accompanied by a helper message.
- Modal keyboard focus trap and full dialog focus management are incomplete for nested/preview use.

## 15. Other bugs and risks
- B1: title fitting will shrink long titles, but verify visual “touch/overflow” at all card sizes and real fonts.
- B2: subtitle is hard-coded 9/page.
- B3: current Section 1 label layout has narrow hint/input alignment and source may be altered by redesign rule overlap.
- B4: row header contains six glyph/action buttons and can crowd/wrap.
- B5: card inputs are full CSS widths but image URL/title rows may clip in narrow sidebars.
- B6: photo cover/`none` behavior needs visual aspect-ratio validation for all sizes.
- B7: real print media and page-break behavior are unverified.
- B8: clone saved config issue is present in `configForTheme()`: `theme._raw` is handled for compiled saved themes, but direct saved item config is currently lost/normalized in clone dropdown path.
- B9: delete refreshes clone dropdown only via `saveCustomThemesList()` and `populateCloneOptions()`; delete handler calls neither correctly in visible clone state and has no confirmation.
- B10: save uses editingId to update and otherwise appends duplicate names; duplicate names are allowed.
- B11: import validates only object shape, not hex strings, grad lightness range, or field types.
- B12: no unsaved warning exists in either sheet or theme page navigation.
- B13: theme status `#st-msg` is not live.
- B14: addressed in Phase 3; gradient dial is disabled for non-gradient themes with a visible explanation.
- B2-B5 and B1/B6/B7 remain verification-dependent, not assumed defects.
- U9: Plotter registration, cutter radius, and punch-hole helper text is now visible; JSON help uses a click/tap/keyboard popover.
- U10: field labels and general controls use sentence case; uppercase is limited to section headers and navigation.
- U11: not an issue; sampled muted-text contrast is above 4.5:1.
- U12: accordions use rotating SVG chevrons.
- U13: UI icon glyphs are replaced with a shared inline SVG set; card-art glyphs are unchanged.
- U14: visible theme palette terminology is “Text”; saved data still uses the `ink` key.
- U15: old stylesheets are consolidated into layered `css/app.css`; static inline styles and cache versions are normalized, and known dead/overridden rules were removed.
- U16: all color pickers have validated, synchronized hex fields; Sheet Editor hex edits are undoable.

## 16. Screenshots
Browser checks used the existing browser harness; no Playwright dependency was added. Phase 1 screenshots cover the three pages at desktop and 390px. Phase 2 and Phase 3 browser checks are summarized in `docs/PROGRESS.md`. No pre-change export files were captured in `.baseline/`, so exact export and physical-printer parity remain unverified.

## Verification conclusions
- Sheet Editor now has a canonical state layer and tested history module suitable for future optional card fields. Node tests cover coalescing, the 100-entry limit, redo clearing and snapshot sharing.
- Browser checks cover settings and card edits, photo upload, import, page/card operations, batch actions, keyboard/native undo, mobile overflow, focus/expanded-state restoration and reload behavior. The three pages loaded without observed console errors.
- IndexedDB's saved payload remains `{v, count, settings, cards}`; history is memory-only and saved state survives reload.
- Phase 7 (draggable stamps) and Phase 8 (Surprise me) require per-card style override support for stamp position and randomised styling. Add optional per-card fields only and preserve old defaults.

## Phase 2 design follow-up
- The approved Phase 2 plan chooses canonical in-memory Sheet Editor state rather than treating DOM controls as history storage.
- Snapshot history relies on immutable card records and copy-on-write updates; current card updates replace both the record and card array.
- Snapshots shallow-copy settings/arrays and share unchanged card records, including their image/data-URL strings. New optional card fields are retained because snapshots store full records rather than selecting known keys.
- No migration or saved-data format change is planned. History remains in-memory only.

## Phase 3 layout verification
- The Sheet Editor now groups controls under Page, Look, Content, and Effects and uses an editable title stored in the optional `settings.sheetTitle` field. Older saved sheets receive the default title.
- The top bar uses SVG as its primary export because that was the previously highlighted action. Usage telemetry is unavailable, so the actual most-used format could not be determined.
- Cards use compact rows with only the selected card expanded; disabled placeholders reserve future Surprise me/search/Move stamps entry points.
- At 390px the page had no horizontal overflow; the mobile action bar remained fixed and Undo/Redo/workspace menu controls stayed reachable.

## Phase 4 visual system disposition
- Replaced the old `main.css`, `redesign.css`, and `studio.css` links with `tokens.css` and layered `app.css`. Static inline presentation was moved into CSS; remaining script-set styles are data-dependent (for example photo URLs and preview transforms). Local CSS/JS/module/favicon references use the `?v=phase4` cache query.
- The shared `js/icons.mjs` renders currentColor SVGs with `stroke-width="2"`. Interface arrows, action glyphs, and the NFC word badge were replaced; SVG card art and its stars remain unchanged.
- The prior rendered-card inner-markup SHA-256 is unchanged: `02fa9ed895dbd65ee64f56bb0f1432cc2d7e3095309012832cebb382f8f53c1b`. Browser checks found no console errors or horizontal overflow at 1440px and 390px on Sheet Editor, Theme Studio, and Bulk Upload.
- Color fields were paired and checked on all three pages, including dynamically staged Bulk Upload cards. Invalid values set `aria-invalid` and show inline guidance; editor hex changes undo through the existing history. Theme Studio draft history remains Phase 5 scope.
- Muted contrast pairs for `--mute: #9a928c` on the touched dark surfaces: `#141211` 6.11:1; `#1f1c1a` 5.54:1; `#181614` 5.90:1; `#0c0b0a` 6.43:1; `#121210` 6.13:1; `#1d1b18` 5.62:1; `#23211d` 5.25:1; `#151412` 6.02:1; `#0d0c0b` 6.39:1. All exceed 4.5:1.
- Browser verification covered tap and keyboard disclosure behavior, visible keyboard focus, gradient option visibility, hex synchronization/validation/undo, local asset links, and mobile workspace menus. `node tests/color-controls.test.mjs`, module syntax checks, and `git diff --check` passed.
- Pre-change `.baseline/` exports are still absent; byte-for-byte export and physical-printer parity are not claimed. No saved-data migration or renderer change was made.
- The default rendered card inner markup matched the pre-change baseline hash; changing preview zoom left serialized SVG output unchanged. Print emulation hid editor chrome and retained the 210 × 297 mm sheet dimensions, but does not certify physical printer output.

## Phase 5 Theme Studio disposition
- B8-B11: saved custom themes now retain their palette config in the gallery and Sheet Editor selector. New saves always use the lowest unused ` - Custom vN` suffix; Update is explicit, Duplicate creates a separate version, and Delete remains confirmed. Imports validate palette values and make colliding names unique.
- B12: dirty Theme Studio drafts warn before switching themes, starting a new draft, and leaving the page; clean drafts do not warn. Sheet Editor navigation warnings were not part of the approved Theme Studio scope.
- B13: `#st-msg` is an `aria-live="polite"` status region.
- The gallery uses one blob-backed real-renderer image per theme, lazy rendering, cached markup, and shared `PREVIEW_OPTIONS`. Samples cycle across `SAMPLE_CARDS` by default; a chosen sample is shared across visible tiles.
- Draft undo/redo uses the existing history module, is limited to 100 entries, coalesces control changes, preserves native text-input undo, and is memory-only. Theme saved-data remains palette-only; gradient angle/spread are not added.
- The owner approved optional `settings.titleScale` for the Sheet Editor (70-100%, default 85%). This intentionally changes title sizing in preview and exports, preserves a wrap fallback, and does not change year/`EST.` logic.
- Local CSS, script, module, and favicon references use the consistent `?v=phase5.1` cache query.
- Browser verification covered v1/v2 saves, Update, draft undo/redo, v3 Duplicate, confirmed Delete, import collision naming, custom preview and Sheet Editor SVG palette rendering, editor dropdown integration, dirty-state warnings, 390px panel geometry, and keyboard tile open/close. All three pages loaded without observed console errors.
- `node tests/theme-studio-utils.test.mjs`, `node tests/history.test.mjs`, `node tests/color-controls.test.mjs`, module syntax checks, and four browser title-layout checks passed. The browser harness did not expose a JSON download event, though the Export JSON handler ran and reported success.
- No pre-change `.baseline/` exports are available. Exact SVG/PNG/PDF comparisons and physical-printer parity remain unverified.

## Standalone Sheet Editor font preview fix
- Reproduced at full A4 size: the full-sheet preview showed a fallback serif title while the individual-card preview showed the selected Pirata One font.
- The full-sheet SVG was inline without document-level embedded font faces; opening the card preview loaded its embedded `FONTCSS`, making the font available afterward.
- The Sheet Editor now calls `injectFonts()` before its first render. This changes font availability for the on-page preview only; saved data, SVG markup, and export serialization are unchanged.

## Phase 6 customisable borders disposition
- Implemented `js/borders.mjs` with 16 border styles (`0..4` legacy exact fast-path, `5..15` appended), style-filtered customisation controls in a collapsed `Customise` fold, 16 live-themed visual picker swatches, named `localStorage` presets, per-card optional `card.border` overrides, JSON import/export support, and `#rnd` border style randomisation.
- Local CSS, JS, module, test, and favicon references bumped uniformly to `?v=phase6`.
- Verification: `node tests/borders.test.mjs`, `tests/history.test.mjs`, `tests/theme-studio-utils.test.mjs`, `tests/color-controls.test.mjs`, `tests/title-layout.test.html` (4 checks), and browser verification across Sheet Editor, Theme Studio, and Bulk Upload passed with 0 console errors, 0 duplicate DOM IDs, legacy v1 `Brackets` round-trip, 300 dpi PNG/PDF exports on filtered/gradient borders, print emulation at 210mm × 297mm, and 0 horizontal overflow at 390px.
- Pre-existing Tarot observation (not introduced by Phase 6): `renderCard()` in `js/svg-engine.js` (from commit `84bcc50`) adds `+ D` inside `titleMarkup` while placing `${titleMarkup}` inside `<g transform="translate(0 ${D})">`, causing the card title on Tarot (`D = 52.4`) to double-offset downward below the bottom border. Fixed in Phase 7 (`696cf73`) per owner Option A approval.

## Phase 7 draggable stamps & extra mounts disposition
- Implemented `js/stamps.mjs` (`resolveStampTransform`, `clampStampNorm`, `snapStampNorm`, `sanitizeStampOverride`) with optional `card.stampPos` and `card.stamp2Pos`, plus 5 extra photo mounts (`4` Washi tape, `5` Brads, `6` Paperclip, `7` Staples, `8` Wax seal) and the Tarot title `D` offset fix.
- Wired `#move-stamps` (mutually exclusive with `#drag`), `#stamp-snap`, `#reset-all-stamps`, per-card rotary angle dial + scale controls, copy-to-page/all, keyboard arrow nudges, `.st-ui` export stripping, and `?v=phase7` cache bump.
- Follow-up fix (`ced4597`, `276f6bd`, `7ce1da6`) corrected `.closest("g[data-ci]:not(.st-ui)")` for second-stamp dragging, enforced strict card-boundary clamping (`stampNormBounds`), added the 33-swatch Visual Stamp Picker (`a6b67ca`, `d0d93b6`, `0c7e278`, `155b2a0`), and enlarged `.st-hit` (`>=116×116`) / `.st-rot-hit` (`r=56`) SVG hit regions so rendered `390×844` touch targets exceed `44 CSS px` (`59.06` / `57.03` CSS px).

## Phase 8 Surprise me disposition
- Added `js/card-styles.mjs` and `js/randomiser.mjs` supporting optional per-card style overrides, Mulberry32 seeded PRNG, scope/strength preferences (`ticketgen.surprisePrefs.v1`), WCAG `>= 4.5:1` contrast checks across solid & multi-stop gradient stops, print-safe accents/borders, anti-occlusion stamp bounds, per-card locks (`Keep this one`), `Custom` row badges, `Surprise this card`, `Reset this card's styling`, `Clear all random styling`, 1-step Undo/Redo, and `MAX_CARDS = 300` with lazy row select population (`?v=phase8`).
- Follow-up UI & workflow enhancements (`809d7e8`, `d56aade`, `9a3b3dd`, `1c2035e`, `1c0f4e2`, `e5dea0b`, `?v=phase8.1`): preserved grey/white card `accent` overrides without orange saturation clamping, added `19` new built-in Gradient themes (`21` total: triple reactive light/dark, radial light/dark, and curated 3-/4-stop presets), added `#grad-angle-reset` (`Reset 180°`), made **Quick colours** live-override the active sheet theme via `settings.quickColors` with `#ct_reset`, added 2–4 multi-stop **Gradient colours** pickers inside `#gctl`, organised themes into `8` scannable built-in categories with `#theme-dropdown` thumbnails + `#theme-filter`, segregated the sidebar into `6` focused accordions (`Page`, `Paper & wear`, `Theme & colours`, `Borders`, `Card & photo`, `Stamps`), added `#delete-page` (`deleteActivePage`, 1-step undoable) beside `#duplicate-page`, and added `.rows-page-break` end-of-page dividers inside `#rows`.
- Browser verification (`1440×900` & `390×844`) passed across all 4 entry points (`0` console errors), 18-card & 200-card sheets (`1948 ms` `#surprise-all` & `1587 ms` `#undo` on 200 cards), Card > Page > Sheet theme precedence, `#png`/`#pdf` exports, `0` duplicate SVG IDs (`130` checked), and `390×844` touch targets (`59.06 × 59.06` / `57.03 × 57.03` CSS px). Latest edits (`560b07c`, `b36f160`, `?v=phase8.3`) overhauled `vinyl`, made `spotify`, `ytmusic` (concentric play disc), and `clef` standalone ringless shapes (`34` named stamp shapes / `36` options), expanded title fonts to `14` choices (`script` Handwriting, `calligraphy`, `brush`, `marker`, `georgia`, `trebuchet`, `impact`, `consolas`, plus the original `6`), and added the `polaroid` theme (classic instant frame with only band name + year, defaulting to `script` handwriting), passing all 6 Node unit test suites and `git diff --check`; pre-change `.baseline/` exports remain absent and browser UI re-check awaits user's tab completion.

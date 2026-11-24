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
- Fonts are self-contained through `FONTCSS` embedded in `fonts.js`; `fonts.js` is 207,923 bytes and embeds WOFF2 data URLs for SVG/Canvas use.
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
- Border style values: 0 Double, 1 Thick, 2 Brackets, 3 Dashed, 4 Rounded.
- Style 0 default: double rect lines.
- 1: thick single rect.
- 2: four bracket paths.
- 3: dashed rect.
- 4: two rounded rects.
- Border wear applies `bd${i}` turbulence/displacement; border colour uses theme accent `A`.
- The 3mm bleed is represented as an outer clip/background expansion and card crop marks account for bleed. Cutter corner radius is separate and exported in cutter SVG, not the normal card border.
- Stamps, mounts, crop marks and photo areas sit in separate groups and have independent indices/geometry.

## 9. Stamps
- One primary stamp plus optional second rectangular stamp.
- Controls: shape, size, primary text, year, second text, ink, accent-vs-fixed color, ink wear, and mixed shape.
- Primary placement is deterministic-random inside the photo width and just below the photo area. Rotation is deterministic-random. No manual stamp position field exists.
- There are 15 named stamp shapes plus `mixed` and `none`.
- Drag photos mode (`#drag`) adds transparent `.pp` rectangles on cards. `pointerdown` checks the card has a loaded image and intrinsic dimensions, captures screen-to-SVG scale from `getScreenCTM().a`, and updates card `px/py` during window pointermove. Pointerup/cancel calls `render()`. It supports mouse and touch through Pointer Events, subject to browser pointer capture support.
- This is photo-only dragging, not stamps.

## 10. Global vs per-card
- Global: paper, card size, cutter radius, crop/bleed/template/reg marks, global theme, title font, global doors/side labels, gradient angle/spread, custom quick palette, border/year/tear/filter/mount settings, NFC/serial/punch, stamp settings, texture/wear.
- Per-page: `pageThemes[]` overrides the global theme.
- Per-card: title, genre, place, year, code, photo, sampled HSL accent, photo zoom/X/Y, optional theme, stamp shape and stamp text.
- Not currently per-card: border style, stamp size/color/year/wear, title font, global doors/side, most texture/effects, manual stamp position.

## 11. Card data model
`blankCard()` fields: `title`, `genre`, `loc`, `year`, `code`, `img`, `imgUrl`, `corsLimited`, `h`, `s`.
Optional/runtime fields: `iw`, `ih`, `zm`, `px`, `py`, `theme`, `sk`, `stx`.
- Saved in session payload `{v, count, settings, cards}` in IndexedDB/localStorage.
- Bulk Import parses files, URLs, JSON, and CSV. JSON/CSV maps name/title/artist, genre, place/location/loc, year, abbreviation/abbr/code, and photo/photoUrl/image/url.
- Bulk staged cards use the same shape and are appended/replaced in the session.
- Card list is rebuilt for every mutation and has one row per card. Every row includes photo thumbnail, title/header/actions and details.

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
- Every rendered color picker has a separate validated hex text field with two-way synchronization. Sheet Editor hex changes use the existing undo path. Theme Studio draft-scoped app undo remains planned for Phase 5.
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

# Progress

## Resume status
- Current branch: `ui-overhaul`
- Current phase: **Phase 10 Complete** (`P9-03` primary PDF export + copyable page SVG dialog `6ea940f`, reference borders `16..17` `2dd7072`, Visiting Card layout + Optional Mirrored Duplex Card Backs `?v=phase10`).
- Next step: awaiting owner review/feedback on Phase 10 and any follow-up work.

## Task conventions
- Status values: `todo`, `in_progress`, `done`, `blocked`, `not an issue`.
- Risk values: `low`, `medium`, `high`.
- Effort values: `S`, `M`, `L`.

## Phase checklist

| ID | Phase/task | Effort | Risk | Status | Commit | Notes |
|---|---|---:|---|---|---|---|
| P0-01 | Create `ui-overhaul` branch | S | low | done | - | Working tree was clean before branch creation |
| P0-02 | Write `CLAUDE.md` | S | low | done | - | Rules, layout, safety, verification |
| P0-03 | Write architecture/control audit | L | medium | done | - | Source audit complete; screenshots captured during Phase 1 |
| P0-04 | Write progress checklist | M | low | done | - | |
| P1-01 | Baseline app and screenshot setup | M | medium | done | - | Browser screenshots captured for Sheet Editor, Theme Studio, Bulk Import, desktop and 390px |
| P1-02 | Store baseline exports in `.baseline/` | M | high | blocked | - | Screenshots are present; automated SVG/PNG/PDF download capture was blocked by browser download behavior, so exact baseline exports need manual browser verification |
| P1-03 | Reproduce and fix B1 long titles | M | medium | done | b454575 | Reproduced in browser at 1440px; added deterministic two-line title layout with shrinking and an owner-approved optional 70-100% title scale (85% default) |
| P1-04 | Fix B2 dynamic cards/page subtitle | S | low | done | - | Subtitle now derives card count, sheet page count and cards-per-page from the active layout |
| P1-05 | Fix B3 Section 1 label layout | S | low | done | - | Section labels and hints now have minimum widths and safe wrapping/alignment |
| P1-06 | Fix B4 card row crowding and reset/delete actions | M | medium | done | 2d743d3 | Resolved in Phase 3: compact rows, selected-row actions, overflow menu, and undoable delete |
| P1-07 | Fix B5 card list input truncation | S | low | done | 2d743d3 | Resolved in Phase 3 with full-width fields and visible long-value outputs |
| P1-08 | Verify/fix B6 photo aspect ratios | M | high | done | - | Known-dimension photo images now use cover-style xMidYMid slice; rerun Ticket/Tarot visual check after baseline |
| P1-09 | Verify/fix B7 print behavior | L | high | done | - | Added print-only CSS, exact color adjustment, all-sheet page breaks, zoom reset and font/image wait before window.print |
| P1-10 | Fix B8 saved-theme cloning | M | medium | done | - | configForTheme now recognizes saved acc/pa/name configs and never uses a UUID as the name |
| P1-11 | Fix B9 saved-theme delete refresh/confirmation | S | medium | done | - | Delete now requires confirmation and refreshes both saved list and clone dropdown |
| P1-12 | Fix B10 theme save/duplicate names | M | medium | done | - | Saving names now appends (2), (3), etc. while editing an existing theme may retain its name |
| P1-13 | Fix B11 theme import validation | M | medium | done | - | Imports now validate required 6-digit hex fields, clamp gl, coerce booleans, trim/cap names, and refresh theme controls/lists |
| P1-14 | Fix B12 unsaved-changes warning | M | medium | done | b454575 | Theme Studio warns before switching themes, starting a new draft, or leaving with dirty changes; Sheet Editor warning is outside Phase 5 scope |
| P1-15 | Fix B13 Theme Studio live status | S | low | done | b454575 | Status uses `aria-live="polite"` |
| P1-16 | Fix B14 gradient dial disabled state | S | low | done | 2d743d3 | Disabled state, keyboard/pointer guard, and helper text verified |
| P1-17 | Verify UI issue U1 duplicate headings | S | low | done | 2d743d3 | Replaced duplicate heading with editable sheet-title field |
| P1-18 | Verify UI issue U2 section grouping | M | medium | done | 2d743d3 | Grouped Page, Look, Content, and Effects controls |
| P1-19 | Verify UI issue U3 export prominence | S | low | done | 2d743d3 | SVG remains the primary action; usage telemetry is unavailable |
| P1-20 | Verify UI issue U4 destructive confirmation/undo styling | M | medium | done | 2d743d3 | Reset is danger-styled; reversible actions use the Phase 2 Undo toast |
| P1-21 | Verify UI issue U5 duplicate entry points | S | low | done | 2d743d3 | One nav entry per page; Manage themes remains by the theme selector |
| P1-22 | Verify UI issue U6 long card list | M | medium | done | 2d743d3 | Compact rows; only selected card expands; future controls remain disabled placeholders |
| P1-23 | Verify UI issue U7 preview toolbar/scroll | M | medium | done | 2d743d3 | Slim toolbar, page count, zoom and mobile single-stage scrolling verified |
| P1-24 | Verify UI issue U8 checkbox/paper swatch cluster | S | low | done | 2d743d3 | Labelled swatches and grouped NFC/serial/punch controls verified |
| P1-25 | Verify UI issue U9 jargon/help | M | low | done | 6271eeb | Helper text and click/tap/keyboard JSON popover |
| P1-26 | Verify UI issue U10 uppercase/letter spacing | S | low | done | 6271eeb | Sentence case except section headers and navigation |
| P1-27 | Verify UI issue U11 muted contrast | S | medium | not an issue | 6271eeb | Existing muted token is at least 5.25:1 on sampled dark surfaces |
| P1-28 | Verify UI issue U12 accordion arrows | S | low | done | 6271eeb | Shared rotating chevrons |
| P1-29 | Verify UI issue U13 icons | M | medium | done | 6271eeb | Shared currentColor SVG icon set and accessible tooltips |
| P1-30 | Verify UI issue U14 Ink/Text terminology | S | low | done | 6271eeb | Visible palette role is Text; saved key remains `ink` |
| P1-31 | Consolidate U15 CSS/inline/cache issues | L | medium | done | 6271eeb | Layered `app.css`; static styles/classes and local asset cache version |
| P1-32 | Verify UI issue U16 hex fields for pickers | M | medium | done | 6271eeb | Validated pairs; Sheet Editor hex edits use existing undo history |
| P2-01 | Design and approve state/history architecture | M | high | done | 96b23af | Design approved before implementation |
| P2-02 | Refactor Sheet Editor to canonical state | L | high | done | a7635bc | Immutable card/array updates; settings, pages, count and selection flow through `studioState`; saved payload unchanged |
| P2-03 | Implement in-memory history module and tests | L | high | done | 329f59c | Generic snapshots, 100-entry cap, sharing/coalescing/redo tests |
| P2-04 | Wire undoable Sheet Editor actions and restore | L | high | done | 329f59c | Settings, cards, images, pages, JSON imports, reset/randomise/sample operations |
| P2-05 | Add Undo/Redo controls, shortcuts, and undo toasts | M | medium | done | 329f59c, ef82ee2 | Sticky topbar controls; native text undo; destructive-action toasts; Bulk Upload transfer Undo/Open Editor flow |
| P2-06 | Verify coalescing, memory, restore, and persistence | L | high | done | - | Node/browser checks; 18-photo payload measurement; reload clears history but retains saved state |
| P3-01 | Sheet Editor layout/sidebar accordions | L | high | done | 2d743d3 | Page/Look/Content/Effects, editable persisted title, and disabled gradient dial state |
| P3-02 | Top bar actions/menu | L | medium | done | 2d743d3 | Primary SVG, Print, formats, overflow actions, Data dialog, and mobile actions |
| P3-03 | Compact card rows and selected expansion | L | medium | done | 2d743d3 | Selected row expands; row actions, long values, and disabled future slots included |
| P3-04 | Preview toolbar and scroll container | M | medium | done | 2d743d3 | Page tools, zoom/Fit, mobile Edit/Preview, and single preview scroll container |
| P4-01 | Visual system and icon pass | L | medium | done | 6271eeb | See Phase 4 verification below |
| P5-01 | Theme Studio gallery | L | high | done | b454575 | Built-ins first, saved themes second; lazy blob-backed one-card previews with auto-cycling or a chosen sample |
| P5-02 | Theme side/bottom panel and custom actions | L | medium | done | b454575 | Responsive draft editor; explicit Update, versioned Save as new, Duplicate, and confirmed Delete |
| P5-03 | Draft history, warnings, and theme JSON | L | high | done | b454575 | Draft-scoped undo/redo, coalescing, unique import names, and unsaved-change guards |
| P5-04 | Optional card title scale | S | medium | done | b454575 | Owner approved optional `settings.titleScale`, 70-100% with an 85% default |
| P6-01 | Customisable borders | L | high | done | 97892bb, 2c83c13, 14b8add | 16 styles (0..4 legacy + 5..15 new), visual picker, Customise fold, presets, per-card overrides, `#rnd` border randomisation |
| P6-02 | Preserve old border render values | L | high | done | 97892bb | Exact legacy SVG fast-path verified for 0..4; legacy v1 sheet round-trip verified |
| P7-01 | Per-card stamp position | L | high | done | 696cf73, 7b341db | Optional `stampPos`/`stamp2Pos` fractions, rotary angle dial, scale, copy/reset actions, 5 extra photo mounts, Tarot title fix |
| P7-02 | Stamp drag hit-test/touch/export/undo | L | high | done | 7b341db, ced4597, 276f6bd, d0d93b6 | `Move stamps` mode, 1-step undo, `.st-ui` export stripping, strict card-boundary clamping (`276f6bd`), visual 23+ stamp picker & `Customise` fold (`a6b67ca`, `d0d93b6`); stamps customized in `0c7e278`, `155b2a0` |
| P8-01 | Per-card Surprise me style overrides | L | high | done | 1b07075, 07af698 | Optional per-card style schema (`js/card-styles.mjs`), unified `resolveCardRenderOptions` in `svg-engine.js` (Card > Page > Sheet priority), JSON/Bulk Import support, `MAX_CARDS = 300` |
| P8-02 | Surprise every card / one undo step | M | high | done | cb79133, f15637c, 7ce1da6 | Seeded `js/randomiser.mjs` + tests, scope/strength dialog, per-card locks & Custom badges, 200-card lazy rows optimization, 1-step Undo/Redo & Undo toasts, `?v=phase8` |
| P9-01 | Band search and match count (Part A: local) | M | medium | done | ac5d0e9 | Non-destructive accent/case-insensitive filter (`js/search.mjs`), `M of N`, Escape/Clear/Enter/ArrowDown, preview page scroll, `tests/search.test.mjs`, browser QA passed |
| P9-02 | Online band lookup (Part B: isolated page + providers) | M | medium | done | 19d3674 | Standalone `band-lookup.html` + `js/band-lookup.js` + `js/band-lookup-providers.mjs` (MusicBrainz v2 + Wikipedia/Wikimedia photo, rate queue, cache, non-overwriting fill, undo transfer); `0c728b3` adds Corner Hardware & Fun Distress FX |
| P9-03 | PDF 300 dpi primary export + Advanced SVG & copyable page SVG code dialog | S | low | done | 6ea940f | `#pdf` primary CTA (`#mobile-export` -> PDF), `#svg` in `Advanced` menu, `#svg-code-dialog` per-page SVG blocks + `@font-face` toggle; mobile `.export-menu > summary` padding fix |
| P10-01 | Visiting card layout & optional mirrored card back (+ 2 reference borders `16..17`) | L | high | done | 2dd7072 | Pure-JS QR (`js/qr.mjs`), `vc_eu`/`vc_us`/`vc_90` landscape & portrait, mirrored uniform `renderCardBack()`, 3 visiting samples (`#smp-visiting`), Bulk Import support, `tests/phase10.test.mjs`, browser & physical mm measurements passed |

## Known issue disposition
- Phase 3 verified and addressed B4, B5, B14, and U1-U8 at desktop and 390px. U6's Surprise me/search controls are intentionally disabled placeholders for Phases 8-9.
- Phase 4 addressed U9, U10, U12-U16. U11 is not an issue: the current muted token already passes 4.5:1 on sampled surfaces.
- Phase 5 addressed B8-B13 in Theme Studio: saved-theme config and actions, unique names, validated imports, draft warnings, and live status. Sheet Editor navigation warnings are outside the approved Phase 5 scope.
- Other audited issues remain at their table status; do not treat source-only observations as reproduced defects.

## Phase dependencies and decisions
- Phase 2 is complete: `studioState` and the generic history module are in place. Later phases should add optional fields to canonical settings/card records and keep updates copy-on-write.
- Phases 7-8 need optional per-card style/position fields. New fields must be optional and existing cards must use current global defaults when absent.
- Phase 6 is export-sensitive and requires baseline comparison for every existing border value across every card size.
- Phase 7 is export-sensitive because stamp positions must serialize and render identically in preview, SVG, PNG, PDF and print.
- Phase 10 is layout-sensitive and needs explicit dimensions/count approval before implementation if current sheet packing assumptions cannot support it.

## Open decisions for later phases
- For F7, visiting-card dimensions/count should be confirmed if not defined by an approved mockup. No implementation assumptions are made here.

## Commit log
- 84bcc50 Fix long card title layout
- 54fc48b Fix dynamic sheet subtitle
- d73383b Fix Section 1 label alignment
- 9d419c6 Fix card photo aspect fitting
- 355d51f Fix sheet print-only output
- 5ee59a0 Fix saved theme cloning
- 8a6928c Fix saved theme deletion
- 06da4a3 Fix duplicate theme names
- 9d4ffba Validate imported theme JSON
- 014d7d0 Refresh Phase 1 cache and print output
- 96b23af Design Phase 2 undo history
- a7635bc Refactor editor into canonical state
- 329f59c Add in-memory Sheet Editor undo history
- ef82ee2 Make bulk sheet transfers undoable
- 2d743d3 Restructure Sheet Editor layout for Phase 3
- b454575 Complete Phase 5 theme studio
- 9d64e30 Propose Phase 6 border styles and controls
- 97892bb Add customisable border styles and SVG renderer
- 2c83c13 Add visual border picker and customise UI
- 14b8add Wire border state, presets, per-card overrides, and phase6 cache version
- 3f1dadb Document Phase 6 customisable borders completion
- c4e5ce9 Design Phase 7 draggable stamps and extra photo mounts
- 696cf73 Add stamp placement math, extra photo mounts, and Tarot title fix
- 7b341db Wire Move stamps UI, rotation dials, touch drag, and phase7 cache
- ced4597 Fix second-stamp pointer hit-testing and 44px touch targets
- 20e674f Document Phase 7 progress and propose visual stamp picker
- a6b67ca Add visual stamp shapes, custom style renderer, and tests
- d0d93b6 Add visual stamp picker, customise fold, presets, and phase7.1 cache
- 276f6bd Keep dragged stamps strictly inside card boundaries
- 0c7e278 more stamps
- 155b2a0 minor changes to stamps
- 23140e5 Design Phase 8 Surprise me per-card randomisation
- 1b07075 Add per-card style override resolution and renderer support
- cb79133 Add seeded per-card Surprise randomiser with guard rails and tests
- 07af698 Add export, bulk-import, and 300-card support for style overrides
- f15637c Wire Surprise me UI, lock toggles, 200-card row optimization, and phase8 cache
- 7ce1da6 Enlarge mobile stamp hit targets to 44px+ and wrap selected card row actions
- 20ecc13 Document Phase 8 Surprise me implementation and verification
- 809d7e8 Preserve grey and white card accent colors and bump phase8.1 cache
- d56aade Add triple, radial, and curated gradient themes with contrast checks
- 9a3b3dd Add Reset 180 button for gradient angle
- 1c2035e Make Quick colours live across all themes and add multi-stop gradient pickers
- 1c0f4e2 Organise themes into sub-groups and add visual thumbnail dropdown
- e5dea0b Reorganise sidebar into 6 drawers, add Delete page, and add page-end dividers

## Phase 1 verification
- Browser console: no page or console errors found in the Sheet Editor, Theme Studio, and Bulk Import passes.
- 390px: no horizontal document overflow in Sheet Editor, Theme Studio, or Bulk Import; Bulk staged URL flow worked.
- Theme Studio: saving the same name twice produced `Test Theme` and `Test Theme (2)`; invalid hex import produced a visible validation error.
- Title reproduction: `BREAKING BENJAMIN VERY LONG TITLE` now renders as two deterministic SVG text lines and is present in preview/export markup.
- Print emulation: topbar/panel hidden; A4-sized `.sheet` is 210mm x 297mm and one template/additional page is present.
- Remaining manual checks: real printer/PDF scaling, blank trailing page, PNG/PDF export downloads, and external/CORS image raster exports.

## Phase 2 design and implementation (approved)

### State-layer refactor plan
The audit found state split between the Sheet Editor DOM, module variables, and mutable card objects. Before introducing history, create one canonical `studioState` containing all Sheet Editor settings (including the custom palette), card records, count, selected card, active page, and page theme overrides. DOM controls become a view of that state. Move each existing mutation path (control edits, card edits/operations, image loads, drag-photo updates, imports, randomise/samples/reset, page theme and duplication) to state update helpers, and make card records immutable on update so a past snapshot cannot be changed through an object alias. Keep rendering, export helpers, saved `{v, count, settings, cards}` payloads, and visible behavior unchanged. Land this refactor separately and verify it before adding history.

### Proposed snapshot and history format
- Each history entry is an in-memory `{version: 1, state}` snapshot. `state` is the canonical Sheet Editor state, not rendered SVG or DOM markup.
- Settings are shallow-copied as a plain object and card/page arrays are shallow-copied; card records are immutable and shared across snapshots unless changed. Photo strings/data URLs remain references on unchanged card records, not deep-copied payloads.
- Snapshot/restore operates generically on complete settings and card objects, not a hard-coded list of per-card style keys. Future optional per-card borders, stamp positions and style overrides are therefore retained automatically. Future settings are included when added to canonical state.
- The snapshot includes all undoable settings/card/page data plus selected-card and active-page identity so restoration can preserve selection. It excludes view-only state: zoom/fit, accordion state, search, scroll, expanded-row selection state, menus/tooltips, export and print state.
- Persisted sheet format remains unchanged. History is session-memory-only and clears on reload. Do not persist history; report that the saved sheet itself still autosaves normally.

### Coalescing and memory
- History limit: 100 entries, oldest removed first. A new committed action after undo clears redo.
- Text and range/color controls capture the pre-gesture snapshot once and commit after `change`, blur, pointer-up, or roughly 600ms idle. Dial pointer drags use pointer-up; no snapshot per movement. Programmatic batch operations (Randomise, Reset All, Load Samples, imports, page duplication) are one transaction each.
- History uses copy-on-write card records and shallow array/settings snapshots. Large unchanged photo data URLs are shared by card references. A changed card creates a new small record but reuses the same photo string unless its image changes. Validate no in-place mutation remains in tracked state.
- After implementation, measure with 18 cards carrying large data-URL photos: report total unique photo payload size, history snapshot metadata/state size, and a naive deep-copy comparison. Use actual runtime measurements where exposed and label estimates separately.

### Apply snapshot and action naming
- `applySnapshot` replaces canonical state, synchronizes every settings control/custom color and derived disabled state, rebuilds card rows, rerenders the SVG preview, synchronizes page selector/theme toolbar, restores the selected card and active page, then requests the existing debounced autosave exactly once.
- Undo/redo must not generate an extra history entry; normal autosave runs once after restore. Do not clear IndexedDB/localStorage during history restoration.
- Each committed operation records a human-readable action label for button tooltip/aria-label (for example `Undo: change border style`); redo uses its corresponding label.
- Add `history.canUndo/canRedo` and a subscription/state query hook so Theme Studio can add draft-scoped history in Phase 5 without coupling it to Sheet Editor state.

### UI and keyboard behavior
- Place labelled/icon Undo and Redo controls in the top bar, disabled when the corresponding stack is empty and reachable without scrolling on phone layouts.
- `Ctrl/Cmd+Z` undo; `Ctrl/Cmd+Shift+Z` and `Ctrl+Y` redo. When focus is in an editable text control, do not intercept native text undo. Ignore shortcuts in a way that preserves typing and existing browser shortcuts.
- After delete, Reset All, Load Samples, bulk import, or Randomise, show a non-blocking toast with an Undo action. These actions remain reversible; saved-theme deletion stays confirmed and outside Sheet Editor history.

### State refactor verification
- Refactor is isolated in commit `a7635bc`, before history implementation.
- Browser verification on the isolated `127.0.0.1` origin: initial load, card field edit, paper-size update, card duplicate/delete, page duplication, return to 9 cards, save/reload.
- No browser page or console errors were observed; title and paper settings were intact after reload.
- Immutable card updates and image hydration resolve cards by stable identity, avoiding stale object references during asynchronous work.
- No saved-data migration or payload shape change was introduced.

### Implemented history behavior
- `js/history.mjs` stores versioned snapshots by reference, shares unchanged card records/photos, coalesces same-control changes, caps undo history at 100, clears redo after a new action, and exposes labels/subscriptions for future draft-scoped history.
- Sheet Editor captures all settings and card/page state. Undo/redo restore controls, custom palette, cards, preview, page toolbar, selected card, expanded card details, focus and scroll position, then schedule one normal debounced autosave. Zoom, accordion state, search, scroll, selection-only changes, menus, exports and print are not history actions.
- Inputs/sliders/colors coalesce per control on change, pointer-up, blur or 600ms idle. Dial and photo drags coalesce per gesture. Batch operations create one step each.
- Topbar Undo/Redo buttons are labelled with the action, disabled when empty, and remain within the sticky header on mobile. Ctrl/Cmd+Z and redo shortcuts are active outside text editing; editable fields retain native undo.
- Delete, Reset All, Load Samples, JSON import and Randomise show an Undo toast. The separate Bulk Upload transfer now stays on that page and offers Undo/Open Editor; its single in-memory undo expires when leaving or reloading, per the owner's choice.
- Saved payload remains `{v, count, settings, cards}`; no history is persisted.

### History memory measurement
- Test setup: 18 cards with distinct synthetic 256 KiB base64 data-URL payloads and 100 history actions (101 retained snapshots including current state).
- Total unique photo payload: 6,291,918 bytes (about 6.00 MiB).
- Serialized snapshot metadata/state without image strings: 52,604 bytes (about 51.4 KiB); measured retained V8 heap delta after GC: 65,992 bytes (about 64.4 KiB).
- Naive full-state deep-copy comparison: estimated 635,552,701 bytes (about 606.11 MiB), calculated from the serialized full snapshot size multiplied by 101. This is an estimate, not allocated memory.

### Phase 2 verification
- `node tests/history.test.mjs`: coalescing, 100-entry limit, redo clearing, unchanged-card sharing, and future optional card fields passed.
- Browser on isolated `127.0.0.1`: tested editor setting changes, count, title/card fields, photo crop, photo upload, card duplicate/delete/reorder, page duplication/theme, JSON import, Randomise, Load Samples, Reset All, Undo/Redo buttons and shortcuts, native text-field undo, reload clearing history with saved state intact.
- Verified Undo restore preserves selected card, expanded card details, focused row control, and scroll position. Tested the 600ms text/slider coalescing and dial drag.
- Bulk Upload: transfer Undo restored the previous saved sheet; Undo/Open Editor toast remained usable on mobile.
- Sheet Editor, Theme Studio and Bulk Upload loaded without observed console errors. At 390px, all had no horizontal document overflow; Sheet Editor and Bulk Upload Undo controls/toast fit the viewport.
- IndexedDB payload keys remain exactly `cards`, `count`, `settings`, and `v`.
- Remaining manual checks: Phase 1 baseline exports were not captured in `.baseline/`, so unchanged SVG/PNG/PDF and real printer output parity still need manual verification. Later-phase border/stamp/export checks remain pending by design.

## Phase 3 implementation and verification
- Reorganized the Sheet Editor sidebar into Page, Look, Content, and Effects; added the editable title, persisted as optional `settings.sheetTitle` with a default for older sheets.
- Moved Print, primary SVG export, other formats, batch actions, and the unified JSON Data dialog into the top bar. SVG remains primary because it was already the highlighted action; no usage telemetry was available to identify the actual most-used format.
- Added selected-card expansion, compact card rows and menu actions; left disabled placeholders for Surprise me, search, Move stamps, and per-card Surprise this card.
- Added a page/theme/duplicate/zoom toolbar and mobile Edit/Preview switch with a fixed Print/Export bar. At 390px, the page has no horizontal overflow; the Edit view exposes the panel, Preview scrolls in the stage, and the mobile action buttons are at least 44px tall. Undo, Redo, and the workspace menu are 40px targets.
- Browser verification: title saved and restored from IndexedDB; history clears on reload. Duplicating a page showed Page 2 of 2 and 18 cards; Undo returned to Page 1 of 1 and 9 cards. Zoom/Fit worked; zoom did not change serialized SVG output. Theme Studio and Bulk Upload loaded at 390px without console errors or horizontal overflow.
- The unchanged default ticket inner-markup SHA-256 remained `02fa9ed895dbd65ee64f56bb0f1432cc2d7e3095309012832cebb382f8f53c1b` (89,403 bytes). Print emulation hid the editor chrome and kept both rendered sheets at 210 × 297 mm.
- Validation passed: `node tests/history.test.mjs`, JavaScript module syntax checks, 106 unique HTML IDs, and `git diff --check`.
- Still blocked: no pre-change `.baseline/` exports exist, so exact SVG/PNG/PDF file comparisons and physical printer scaling cannot be certified. Print emulation is not a physical-printer test. Keyboard focus traversal across all three pages remains a manual check.

## Phase 4 visual system implementation and verification
- Consolidated the previous stylesheets into layered `css/app.css` over `css/tokens.css`; removed dead tooltip, duplicate accordion-arrow, and hidden stage-pseudo rules. Static inline presentation moved to CSS classes; data-dependent image/preview styles remain dynamic.
- Local CSS, JavaScript modules, and favicon now use the same `?v=phase4` cache version. No framework, bundler, or runtime dependency was added.
- Added `js/icons.mjs`, a shared inline SVG set using `currentColor` and one stroke width. Replaced interface icon glyphs, added accessible labels/tooltips for icon-only controls, and preserved renderer/card-art output. Added workspace menus to Theme Studio and Bulk Upload at mobile widths.
- Labels use sentence case; uppercase is limited to section headers and navigation. Accordions use rotating SVG chevrons, all interactive controls use visible `:focus-visible` outlines, and Plotter/cutter/punch-hole helpers are visible. JSON help is an anchored click/tap/keyboard disclosure.
- Palette terminology is “Text” on both editor pages while the saved theme key remains `ink`.
- Every rendered color picker has a paired `#RRGGBB` text field with live synchronization and inline validation. Sheet Editor hex edits flow through the existing color input events and undo history. Theme Studio draft-scoped undo was added in Phase 5; Bulk Upload staging remains local until transfer.
- Muted text `#9a928c` contrast against sampled dark surfaces: `#141211` 6.11:1, `#1f1c1a` 5.54:1, `#181614` 5.90:1, `#0c0b0a` 6.43:1, `#121210` 6.13:1, `#1d1b18` 5.62:1, `#23211d` 5.25:1, `#151412` 6.02:1, and `#0d0c0b` 6.39:1. Minimum is 5.25:1, so U11 required no color adjustment.
- Browser verification at 1440px and 390px: all three pages loaded without observed console errors or horizontal overflow; every rendered color picker had a hex partner; all icons hydrated; no legacy stylesheet links or `title` tooltips remained. Verified invalid hex handling, editor hex undo/restore, Theme Studio preview synchronization and gradient visibility, Bulk Upload staged hex changes, tap and keyboard disclosure behavior, and visible keyboard focus.
- The default rendered-card inner-markup SHA-256 still matches the pre-change value `02fa9ed895dbd65ee64f56bb0f1432cc2d7e3095309012832cebb382f8f53c1b` (89,403 JavaScript characters). No pre-change `.baseline/` SVG/PNG/PDF exports exist, so exact file and printer parity remain unverified.
- Validation: `node tests/color-controls.test.mjs`, module syntax checks, and `git diff --check` passed.

## Phase 5 Theme Studio implementation and verification
- Replaced the clone/template controls with a responsive gallery: 25 built-in tiles first, then saved custom themes with badges. Each tile has one real-renderer preview in a blob-backed `<img>`, lazy rendering, and markup reuse when its visual inputs are unchanged. `PREVIEW_OPTIONS` is shared with the draft preview.
- Auto sample selection cycles through `SAMPLE_CARDS`; choosing a sample applies it to visible tiles, and Auto restores cycling. Browser checks confirmed varied auto samples and the selected sample on visible tiles.
- The editor is a side panel on desktop and a scrollable bottom sheet on mobile. Palette colors have hex fields; the accent-lightness slider updates its readout. Draft undo/redo is in memory, capped at 100, coalesces control edits, keeps native text-field undo, and resets on theme switch/reload.
- Save as new always creates the next unused `<base> - Custom vN`; built-ins remain protected. Update is explicit; Duplicate creates a new version; Delete remains confirmed. Import validates palette fields and resolves name collisions with the next version. Saved themes continue to use the existing palette-only shape and appear in the Sheet Editor selector.
- B12 warnings now cover dirty Theme Studio drafts before switching themes, starting a new draft, and leaving the page. Clean drafts do not warn. B13 status is a polite live region.
- Added the owner-approved optional Sheet Editor `settings.titleScale` control (70-100%, default 85%). It reduces long titles where they fit, retains the existing wrap fallback for longer names, and intentionally changes title output in preview and exports; year/`EST.` logic is unchanged.
- Bumped local CSS, script, module, and favicon references together to `?v=phase5.1` so the final Phase 5 code is not hidden by cached Phase 5 assets.
- Browser verification: each of 25 built-in tiles had one image; auto cycling varied samples; a chosen Linkin Park sample appeared on all six visible tiles. Save v1/v2, update, draft undo/redo, duplicate v3, confirmed delete, and import collision `Dark` -> `Dark - Custom v2` passed. The custom preview and Sheet Editor SVG both used the saved palette, and its name appeared in the selector. Dirty-switch/new-draft cancellation and leave-page warning were observed.
- At 390px the editor panel was viewport-width, bottom anchored, and the document had no horizontal overflow; keyboard Enter opens a tile and Escape closes the panel. Sheet Editor, Theme Studio, and Bulk Upload loaded without observed console errors.
- `node tests/theme-studio-utils.test.mjs`, `node tests/history.test.mjs`, `node tests/color-controls.test.mjs`, module syntax checks, `tests/title-layout.test.html` (4 checks), and `git diff --check` passed.
- The browser harness did not expose a JSON download event, though the Export JSON action ran and reported success. No pre-change `.baseline/` exports exist; byte-for-byte SVG/PNG/PDF and physical-printer parity remain unverified.

## Manual approval and remaining checks
- Owner approved Phase 3 before implementation; it is complete.
- The Bulk Upload transfer behavior was selected by the owner: stay on Bulk Upload and show Undo/Open Editor actions.
- Manual export/printer parity remains unverified because no pre-change `.baseline/` exports are available.
- Phase 5 is complete and owner-approved; wait for approval before Phase 6.
- The title-scale output change was explicitly approved. No theme schema migration or history persistence was added.

### Approval gate
- Phase 5 changes approved by the owner before implementation.
- No local history persistence is proposed.
- The Phase 3 editable sheet title and Phase 5 title scale use optional settings fields; existing sheet and theme payload formats remain backward compatible.

## Standalone font preview fix
- Reproduced on the full-size A4 sheet: the title used a fallback serif until opening the individual-card preview, which loads the embedded font CSS.
- `injectFonts()` now runs before the Sheet Editor's first render, so the selected title font is available to the inline full-sheet SVG immediately.
- No renderer markup, saved data, or export serialization changed. Verified the distinct Pirata One title at full sheet and individual-card sizes; local asset references were bumped uniformly to `?v=phase5.2`.

## Phase 6 proposal: customisable borders (awaiting approval)

### Audit baseline & geometry constraints
From `docs/AUDIT.md` (Sections 5, 8, 10, 11) and `js/svg-engine.js`:
- **Existing styles (`borderStyle` `0..4`)**:
  - `0` **Double**: `<rect x="2.5" y="2.5" width="165" height="CH-5" stroke-width="1.5"/>` + inner `<rect x="5.8" y="5.8" width="158.4" height="CH-11.6" stroke-width=".7" opacity=".8"/>`.
  - `1` **Thick**: `<rect x="3" y="3" width="164" height="CH-6" stroke-width="2.6"/>`.
  - `2` **Brackets**: four 22-unit corner L-paths from `(3,3)` etc., `stroke-width="2.2"`.
  - `3` **Dashed**: `<rect x="4" y="4" width="162" height="CH-8" stroke-width="1.1" stroke-dasharray="4 2.5"/>`.
  - `4` **Rounded**: same geometry as `0` with `rx="9"` outer / `rx="6"` inner.
- **Coordinate budget (`CW = 170`, `CH = 204..309` across Mini, Ticket, Poker, Credit, Tarot, and upcoming Phase 10 visiting card)**:
  - Cut edge is `[0..CW, 0..CH]`; optional `3 mm` bleed (`bl = 3/K`) expands only the background fill clip `#ck${i}`; crop marks start `bl + 2` outside `[0..CW, 0..CH]`. All border geometry must stay inside `[0..CW, 0..CH]` so cutting never trims away the frame.
  - Interior landmarks to clear: 4 corner screws at `(9, 9)`, `(CW - 9, 9)`, `(9, CH - 9)`, `(CW - 9, CH - 9)` (`r = 2.5`); top text (`★ ADMIT ONE` / `Doors`) at `y = 11.5, x = 17..153`; vertical side labels at `x = 13` and `x = CW - 13`; tear line at `y = 161 + D` (`x = 9..CW - 9`); photo box at `x = 17..153, y = 16..152 + D`.
  - Keeping default insets in `2.0..6.5` keeps frames cleanly outside the `x = 13` / `y = 11.5` text and outside/around the `(9, 9)` screws.
- **Filter/def ID collision risk**:
  - Today `frame()` uses `filter="url(#bd${i})"`, where `i` is the card index (`0..71`). When visual style swatches render miniature SVGs in the sidebar alongside full sheets and the single-card preview modal, duplicate `<defs>` IDs across multiple inline `<svg>` elements in the same DOM can cross-reference wrong filters/gradients in browsers.
  - **Fix**: scope all border `<defs>` IDs with a unique render-context prefix (e.g. `bd-s-${i}` on sheets, `bd-pv-${i}` in modal, `bd-sw-${k}` in swatch previews) so no two inline SVGs share filter/gradient/mask IDs.
- **Backward compatibility guarantee**:
  - Styles `0..4` stay at indices `0..4`. When `borderStyle` is `0..4` and no customisation fields differ from the legacy defaults, `frame()` emits the exact legacy SVG markup byte-for-byte so existing saved sheets and `.baseline/` parity stay intact.
  - `minimalLayout === true` (minimal layout mode / potential visiting-card mode) currently hard-codes a `0.5` `T.frame` rect; in Step 2 we can allow `frame()` when border fields are customised or keep `minimalLayout` opt-in so existing `minimalLayout` output stays unchanged unless custom borders are selected.

---

### Part 1: Proposed border styles (`5..15`, appended after `0..4`)

**Disposition of the 13 candidate names:**
- **Dropped (2)** — already covered without duplicating style slots:
  - *Double line*: already `0` Double (gains width, inset, line gap, colour, pattern, corner, and inner-border customisation).
  - *Rounded inset frame*: already `4` Rounded (and `0`/`1` with `Corner style = Rounded` + `Inset` covers single or double rounded inset frames at any depth).
- **Picked (11 new styles, appended as `5..15`)** — cohesive with the concert-ticket, vintage print, zine, and neon-club themes:

| ID | Key / Name | How it is drawn in SVG | Theme colour usage | Print & export risk |
|---:|---|---|---|---|
| **5** | **Triple line** (`triple`) | Three concentric `<rect>` (or corner-shaped `<path>`) frames: outer medium (`0.8×` width) at `inset`, middle primary (`1.3×` width) at `inset + gap`, inner hairline (`0.55×` width) at `inset + 2×gap`. | Outer & middle use primary border colour (default `A`); inner hairline uses primary at `0.7` opacity (or `T.hi`/`T.ink` when customised). | **Low–medium**: inner hairline at default `0.55` SVG units (~`0.19 mm` on Ticket, `0.15 mm` on Mini) approaches minimum hairline print weight; enforce a `0.45` floor and warn below `0.5`. |
| **6** | **Thick retro frame** (`retro`) | Bold outer frame (`width`, default `2.8`) at `inset` (`3`), an inset thin keyline (`0.65`) separated by `gap` (`2.5`), plus four solid rectangular corner blocks (`3.5 × 3.5`) seated on the outer corners for a heavy woodblock/poster plaque look. | Outer frame + corner blocks in primary colour (`A`); inner keyline in primary at `0.75` opacity (or `T.frame` / custom inner colour). | **Low**: bold strokes print reliably on all printers and raster exports; stays clear of `(9, 9)` screws when `inset <= 4.5`. |
| **7** | **Art-Deco corners** (`deco`) | Thin continuous connecting hairline (`0.7`) at `inset + 1.5`, anchored by four stepped geometric `<path>` corner brackets (two nested L-steps + a 45° diagonal bevel/chevron bar at each corner, sized `~18` SVG units, staying clear of the `(9, 9)` screw). | Corner geometry in primary colour (`A`); connecting hairline at `0.65` opacity or `T.frame` highlight (`T.hi` on dark themes). | **Low–medium**: crisp vector `<path>`s; keep diagonal step strokes `>= 0.55` so angled hairlines do not anti-alias away at 300 dpi. |
| **8** | **Corner flourishes** (`ornate`) | Delicate connecting perimeter frame (`0.75`) plus four symmetrical cubic-Bezier scroll/filigree corner `<path>` ornaments (`~20 × 20` tucked at `inset` `2.5..6.5`, hugging the corner edge outside the `(9, 9)` screw and `y = 11.5` header). | Filigree scrolls in primary colour (`A`); connecting rule at `0.7` opacity (or secondary accent). | **Medium**: curved Bezier curls (`0.75` stroke) can look slightly soft on low-DPI inkjet if scaled down to Mini (`45 × 64 mm`); keep curve stroke `>= 0.65`. |
| **9** | **Dashed stitch** (`stitch`) | Paired parallel stitched tracks (or single heavy stitch at `inset = 3.8`) using `stroke-dasharray="3.2 2.2"` with `stroke-linecap="round"` and tiny diagonal corner tack stitches at the 4 corners, distinct from `3` Dashed (`1.1` single `4 2.5` rect). | Primary colour (`A`), or `T.tape`/`T.ink` when selected; optional inner stitch line in secondary colour. | **Low**: rounded dash caps print cleanly in SVG, PDF, PNG, and physical printers. |
| **10** | **Film-strip / perforated edge** (`film`) | Left and right vertical guide rails (`x = 1.6..5.4` and `x = CW - 5.4..CW - 1.6`) containing evenly spaced rounded sprocket-hole cutouts rendered via a pure-vector `evenodd` compound `<path>` (so the card's actual paper or gradient shows through every sprocket hole without an SVG `<mask>`). Top and bottom remain clear of `y = 11.5` text and `(9, 9)` screws. | Rails filled in primary colour (`A` or `T.frame`) at `0.85` opacity. | **Low**: pure vector `evenodd` `<path>`, prints crisply at 300 dpi; keep rail web `>= 0.6` SVG units so sprockets don't merge under ink spread. |
| **11** | **Scalloped ticket-stub edge** (`scallop`) | Continuous scalloped/postage-stamp perimeter `<path>` drawn with alternating semicircular SVG arcs (`A r r 0 0 1`) along all four edges inside `[inset..CW-inset, inset..CH-inset]`, plus an optional crisp inner hairline frame (`0.6`). Arc step adapts dynamically to `CH` (`Ticket` vs `Tarot` vs `Mini`) so corners always meet symmetrically. | Outer scalloped stroke in primary colour (`A`); optional inner hairline at `0.65` opacity. | **Low**: pure vector `<path>` inside cut bounds `[0..CW, 0..CH]`; works cleanly with bleed and crop marks. |
| **12** | **Grunge / ink-bleed edge** (`grunge`) | Irregular double-pass hand-inked border: a bold rough perimeter `<path>` plus subtle broken outer splatter ticks, filtered through a scoped `<filter>` (`feTurbulence` + `feDisplacementMap` + rough alpha erosion), driven by `borderWear` (with built-in organic path wobble so it still reads as distressed at `borderWear = 0`). | Primary colour (`A`) or `T.ink`; filter operates on `SourceGraphic` so theme colours pass through accurately. | **Medium–high**: SVG `<filter>` primitives are rasterized during PNG/PDF export and some browser print drivers; bounded filter region (`x="-8%" y="-8%" width="116%" height="116%"`) prevents edge clipping while staying inside card gutters (`GX=22, GY=20`). |
| **13** | **Holographic gradient stroke** (`holo`) | Double chamfered or clean geometric frame stroked with a scoped `<linearGradient id="bgd-${scope}-${i}">` (`x1="0%" y1="0%" x2="100%" y2="100%"`) cycling 5 iridescent stops (derived by hue-shifting `A` ±60°/±120° and blending `T.hi`). | Anchored to card/theme hue (`A` + harmonic hue offsets + `T.hi`), harmonizing with both light cream cards and dark neon/luxe cards. | **Medium (expectation risk)**: prints cleanly as a multi-colour vector gradient in SVG/PDF/PNG, **but** standard printers output flat CMYK/RGB ink rather than true metallic foil. |
| **14** | **Neon glow** (`neon`) | Two-layer stroke: outer blurred halo (`width × 1.8`) via a scoped `<filter id="bgl-${scope}-${i}">` (`feGaussianBlur` + `feMerge`) in primary colour `A`, topped by a crisp bright inner core stroke (`0.85`, blended toward `#fff` / `T.hi` for a lit tube look). | Halo in primary colour (`A`); bright core tinted toward `#ffffff` (`mix(A, "#ffffff", 0.65)` or `T.hi`). | **High on light paper / medium on dark**: `feGaussianBlur` rasterizes in PNG/PDF/print and softens on light backgrounds (`Minimal` / `Cream`); UI shows a brief hint ("Best on dark themes; glow softens in print"). |
| **15** | **None** (`none`) | Emits no border elements at all (skips `bd` filter too). | N/A | **None**: cleanest possible print/bleed output; relies solely on crop marks and bleed for trimming. |

*(All new styles compute height dynamically from `CH` so `Ticket`, `Poker`, `Credit`, `Mini`, `Tarot`, and the upcoming Phase 10 visiting card scale cleanly without hard-coded `239` assumptions.)*

---

### Part 2: Proposed customisation controls & practicality

Every control below is practical in pure SVG with zero external dependencies, provided the **Customise** fold displays **only controls relevant to the selected style** and stores **only overrides** (omitting defaults so saved data stays compact and legacy `0..4` output is unchanged).

| Control | Data key (optional) | Range / options | Practicality & SVG implementation | Shown for styles |
|---|---|---|---|---|
| **Line width** | `width` | `0.5` – `5.0` (step `0.1`, default per style) | Directly sets primary `stroke-width` (and scales secondary hairlines proportionally). `0.5` floor avoids invisible sub-pixel print dropouts. | All except `none` (`15`) |
| **Inset** | `inset` | `1.5` – `10.0` (step `0.5`, default per style) | Pulls frame inward from `[0..CW, 0..CH]` cut edges. Capped at `10` (with soft note near `8–10`) so frames stay clear of `(9,9)` screws and `16..153` photo box. | All except `none` (`15`) |
| **Colour** | `colorMode` + `color` | `accent` (theme auto), `ink`, `frame`, `mute`, `custom` + `#RRGGBB` picker/hex | Resolves stroke colour from active theme or custom hex; custom picker automatically gets a paired validated hex input via `color-controls.mjs`. | All except `none` (`15`) (`holo` tints gradient anchor) |
| **Opacity** | `opacity` | `10` – `100%` (step `5%`, default `100`) | Sets outer `<g opacity="...">` on the frame group. | All except `none` (`15`) |
| **Line pattern** | `pattern`, `dash`, `gap` | `solid`, `dashed`, `dotted`, `dashdot`; Dash `1`–`16`, Gap `1`–`16` | Maps cleanly to `stroke-dasharray` (`[d, g]`, `0.1 g` with `round` cap, `[d, g, 0.1, g]`). Dash/gap sliders appear only when pattern ≠ `solid`. | Stroke-based styles (`0..8`, `13`, `14`). Hidden for `stitch`, `film`, `scallop`, `grunge`, `none`. |
| **Corner style & size** | `corner`, `cornerSize` | `square`, `rounded`, `notched`, `chamfered`; Size `2` – `18` | Unified `boxPath(x, y, w, h, corner, r)` helper builds `<path>` for `rounded` (arcs), `notched` (inward square cut), and `chamfered` (45° bevel). Legacy `0`/`4` keep `<rect>` when untouched. Size slider hidden when `square`. | Frame styles (`0`, `1`, `3`, `4`, `5`, `6`, `9`, `12`, `13`, `14`). Hidden for `brackets`, `deco`, `ornate`, `film`, `scallop`, `none`. |
| **Line gap** | `lineGap` | `1.5` – `8.0` (step `0.2`, default `3.3` for `0`/`4`) | Spacing between concentric lines (`2.5 + 3.3 = 5.8` reproduces legacy `0`/`4` exactly). | Multi-line styles (`0` Double, `4` Rounded, `5` Triple, `6` Thick retro). |
| **Second inner border** | `inner` (bool), `innerWidth` (`0.4–3.0`), `innerGap` (`1.5–10`), `innerColorMode` + `innerColor` | Toggle + compact sub-row | Adds an independent inset frame inside the primary border with its own width, gap, and theme/custom hex colour. | All except `none` (`15`) (collapsed under a simple checkbox toggle) |
| **Corner ornament** | `ornament`, `ornamentSize` | `none`, `diamond`, `dot`, `star`, `cross`, `bracket`; Size `2` – `10` | Places 4 small vector glyphs at the frame's corner coordinates (`inset` offset). | All except `none` (`15`) and `film` (`10`) |
| **Wear / grunge** | `borderWear` (existing `0–100`) | `0` – `100` (existing `#bwear` default `35`) | Existing `inkFilter("bd...")` in `svg-engine.js`. Surfaced in Customise (synced 2-way with Effects -> Advanced `#bwear`) without breaking old state/controls. | All except `none` (`15`) |
| **Glow amount** | `glow` | `0` – `100` (default `0`, or `65` for `14` Neon glow) | Adds scoped `<filter>` (`feGaussianBlur` + `feMerge`) behind the frame stroke. Hidden/0 by default for clean vector exports unless enabled or using Neon glow. | All except `none` (`15`) |

---

### Part 3: UI structure, visual picker & border presets

1. **Visual border style picker (Look section)**:
   - Replace `<select id="design-border">` with a responsive grid of **16 compact SVG swatch buttons** (`role="radiogroup"` with `aria-checked`, keyboard arrow navigation, clear visible name label + miniature corner/card preview SVG using the active theme's accent and paper colours so it updates live).
   - Each swatch uses unique IDs (`bd-sw-${styleId}`) so filters/gradients never collide with the sheet SVG.
2. **"Customise" fold (right below the visual picker)**:
   - Collapsed `<details class="border-customise">` by default so the Look accordion stays uncluttered.
   - Summary shows active override chips when customised (e.g. `Customise · 2.0px · Chamfered`).
   - Inside the fold: dynamically shows **only controls relevant to the selected style**, plus a **Reset border customisations** button.
3. **Border Presets & Scope**:
   - **Saved presets** persisted in `localStorage` (`ticketgen.borderPresets.v1`, independent of individual sheets):
     - Preset `<select>` + **Save current as preset** (name input with unique-name handling) + **Delete preset** (confirmed).
   - **Apply / Scope controls**:
     - Explicit actions: **"Apply to all cards"** (updates sheet-level border) vs **"Apply to selected card (#N)"** (writes optional `card.border` on `studioState.cards[selectedCard]`).
     - In the selected card's **"Photo & theme options"** (`buildRows()`): show a compact `Border` indicator (`Same as sheet` vs `Custom: <Style Name>`) with a quick **"Use sheet border"** reset button when overridden.

---

### Part 4: Data model, inheritance, undo/redo, exports & Phase 8 interaction

1. **Where data lives (optional fields only, backward compatible)**:
   - **Sheet-level**:
     - Keep `settings.borderStyle` (`0..15`, default `0`) and `settings.borderWear` (`0..100`, default `35`) at the top level of `settings` so old sheets load unchanged.
     - Add optional `settings.border` plain object containing only non-default overrides (omitted when at style defaults).
   - **Per-card override**:
     - Optional `card.border` plain object on individual cards in `studioState.cards` (`undefined` when using sheet border). Shape: `{ style?: number, width?: number, inset?: number, colorMode?: string, color?: string, opacity?: number, pattern?: string, dash?: number, gap?: number, corner?: string, cornerSize?: number, lineGap?: number, inner?: boolean, innerWidth?: number, innerGap?: number, innerColorMode?: string, innerColor?: string, ornament?: string, ornamentSize?: number, wear?: number, glow?: number }`.
   - **JSON export/import (`export.js`, `app.js`)**:
     - `exportProjectJson` includes `border: c.border` on a card only when `c.border` exists; `importJson` validates and restores `card.border` if present. Old JSON files import unchanged.
2. **Resolution & inheritance with sheet-level border**:
   - `resolveBorderConfig(settings, card)`:
     - Effective style = `card.border?.style ?? settings.borderStyle ?? 0`.
     - If `card.border?.style !== undefined && card.border.style !== settings.borderStyle`: start from `STYLE_DEFAULTS[card.border.style]` and apply `card.border` (inheriting `settings.borderWear` if `card.border.wear === undefined`). This prevents incompatible sheet-level gaps/patterns from bleeding onto a different per-card border style.
     - If `card.border` overrides properties *without* changing `style` (e.g., per-card custom colour or ornament): merge `STYLE_DEFAULTS[style] -> settings.border -> card.border`.
     - If `card.border` is absent: merge `STYLE_DEFAULTS[style] -> settings.border`.
3. **Undo/redo & coalescing**:
   - Because `studioState` uses copy-on-write `updateCard()` and `captureSnapshot()` / `snapshotsEqual()` shallow-copy `settings` and nested plain objects (`customTheme`, and similarly `border`), both sheet-level `settings.border` and per-card `card.border` are captured automatically in the 100-entry history stack.
   - Sliders and colour/hex inputs inside `Customise` use `bindContinuousHistory` with 600ms / pointer-up / change coalescing; style swatch clicks, preset apply, "Apply to all cards", and "Use sheet border" record single discrete undo steps.
4. **Interaction with bleed, crop marks, sizes, stamps, exports & Theme Studio**:
   - **Bleed & crop marks**: all border frames stay inside `[0..CW, 0..CH]` and outside the `ck${i}` bleed rectangle; crop marks sit outside bleed.
   - **Card sizes**: `CH` is passed dynamically to `frame()`, and `K` scales the entire card `<g>`, so `Ticket`, `Poker`, `Credit`, `Mini`, `Tarot`, and the future Phase 10 visiting card all render borders at true physical proportions.
   - **Stamps**: stamps sit in a later SVG layer (`${stamp}${stamp2}`) and can overlap the border authentically without clipping.
   - **Exports & print**: `serializeSheetSvg`, `rasterizeSvg` (300 dpi PNG/PDF), `sheetCardPreviewSvg`, and `window.print()` all consume the same `renderCard()` SVG output.
   - **Theme Studio (`PREVIEW_OPTIONS`)**: stays pinned to `borderStyle: 0` with no border customisation overrides so theme comparison tiles remain consistent.
5. **Interaction with Phase 8 ("Surprise me")**:
   - In Phase 8, **"Surprise me"** (all cards) and **"Surprise this card"** will randomise per-card styling (`card.theme`, `card.sk`, and `card.border`) using curated style/ornament/colour combinations stored in `card.border`, leaving `settings.borderStyle` / `settings.border` intact and committing the whole batch as **one undo step**. Cards without `card.border` continue inheriting the sheet-level border.

---

### Owner decisions needed before Step 2 implementation

1. **How should per-card border customisation be edited in the UI?**
   - **Option A (Recommended)**: Look's visual picker + `Customise` fold always edit the **sheet default** (simple mental model); inside `Customise`, an **"Apply to selected card"** button (plus preset apply-to-card / apply-to-all actions) writes `card.border` on the active card, and the selected card's `Photo & theme options` shows the active override with a `"Use sheet border"` reset button.
   - **Option B**: Add an editing-target segmented toggle at the top of Look (`Sheet default | Card #N only`) so every slider in `Customise` directly edits either `settings.border` or `card.border`.
   - **Option C**: Add a border style dropdown inside each card's `Photo & theme options` (style-only per card, while `Customise` stays sheet-wide).

2. **When clicking "Apply to all cards" vs changing the sheet-level border normally when some cards already have per-card overrides:**
   - **Option A (Recommended)**: Changing the sheet-level border normally updates `settings` and leaves existing per-card `card.border` overrides untouched (consistent with `Theme` and `Stamp`); clicking **"Apply to all cards"** explicitly clears all `card.border` overrides in one undoable step.
   - **Option B**: Prompt before clearing per-card overrides whenever changing the sheet border.

3. **Should the existing "Randomise all" (`#rnd`) action also randomise `borderStyle`?**
   - **Option A (Recommended)**: Keep `#rnd` touching only theme/stamp/wear/texture/gradient (as today), and leave border randomisation for Phase 8 (`Surprise me`).
   - **Option B**: Include `borderStyle` in `#rnd` as well.

## Phase 6 implementation and verification
- **Owner choices applied**: Option A for per-card UI (Look edits sheet default; `Apply to card #N` + presets apply to card/sheet + `Use sheet border` reset in card details); Option A for sheet-edit behaviour (normal sheet changes keep per-card `card.border` overrides intact; `Apply to all cards` clears all per-card overrides in one undo step); Option B for `#rnd` (`Randomise all` picks across visible styles `0..14` in one undo step).
- **Renderer (`js/borders.mjs`, `js/svg-engine.js`)**:
  - Kept styles `0..4` (`Double`, `Thick`, `Brackets`, `Dashed`, `Rounded`) on an exact legacy SVG fast-path when unmodified (`hasBorderOverrides === false`).
  - Appended 11 new styles (`5` Triple line, `6` Thick retro, `7` Art-Deco, `8` Flourishes, `9` Dashed stitch, `10` Film-strip, `11` Scalloped stub, `12` Ink-bleed, `13` Holographic, `14` Neon glow, `15` None) scaling dynamically with `CH` across Ticket, Poker, Credit, Mini, Tarot, and `minimalLayout` (visiting-card ready).
  - Scoped border `<defs>` IDs (`sw-` for swatches, `pv-` in preview modal, card index on sheets) so filters and gradients never collide across cards or views.
- **UI, presets & state (`index.html`, `css/app.css`, `js/app.js`, `js/export.js`)**:
  - Replaced `#design-border` select with a 16-swatch keyboard-navigable visual picker (`role="radiogroup"`) updating live with theme colours, followed by a collapsed `Customise` fold showing only controls relevant to the selected style (line width, inset, opacity, line gap, theme/custom hex colour, line pattern/dash/gap, corner style/size, second inner border, corner ornament/size, border wear synced 2-way with `#bwear`, and glow amount).
  - Added `ticketgen.borderPresets.v1` `localStorage` presets (Save, Apply to sheet, Apply to card, confirmed Delete) and optional `settings.border` / `card.border` fields wired through `studioState` history coalescing and JSON import/export.
  - Bumped all local CSS, JS, module, test, and favicon `?v=` cache queries uniformly to `?v=phase6`.
- **Verification**:
  - Node tests passed: `node tests/borders.test.mjs`, `node tests/history.test.mjs`, `node tests/theme-studio-utils.test.mjs`, `node tests/color-controls.test.mjs`, `.mjs` syntax checks, and 157 unique IDs check on `index.html`.
  - Browser verification across `index.html`, `theme-studio.html`, `bulk-import.html`, and `tests/title-layout.test.html` (4 passed, 0 failed): 0 console/page errors, 0 duplicate DOM IDs (with and without `#pv` modal open on filtered/gradient cards), conditional Customise control visibility, hex color sync, `#bwear` 2-way sync, coalesced undo/redo, presets + per-card override/reset, `#rnd` 1-step undo, and legacy v1 `Brackets` (`2`) sheet round-trip across reload.
  - Border styles `5..15` verified live with bleed and crop marks at Ticket and Tarot sizes; print emulation verified 210mm × 297mm A4 sheets with new borders and `.sheet:last-child` break-after rule.
  - Exports on mixed new/filtered borders (`Holographic`, `Neon glow`, `Ink-bleed`, `Film-strip`, `Scalloped stub`): 300 dpi PNG (`ticket-cards-p1.png`) and 300 dpi PDF (`ticket-cards.pdf`) succeeded; `#svg` reported downloading 2 pages (`.svg` file write blocked by browser sandbox download policy).
  - Mobile 390px: 0 horizontal overflow in both Edit and Preview views; minor cosmetic truncation noted on longer swatch names ("Dashed st...", "Scalloped...", "Holograp...") and tight "Formats" label padding.
  - **Pre-existing Tarot finding**: during Tarot inspection, the browser check observed that `titleMarkup` in `js/svg-engine.js` (introduced in `84bcc50`) adds `+ D` inside `<g transform="translate(0 ${D})">`, pushing the card title below the bottom border on Tarot (`D = 52.4`). Left unchanged during Phase 6 per safety rails; flagged for owner approval before fixing.

## Phase 7 design: draggable stamps & extra photo mounts (awaiting approval)

### Audit baseline (`docs/AUDIT.md` Section 9 & `js/svg-engine.js`)
- Today each card renders up to **2 stamps**:
  - Primary stamp (`stamp`, unless `skw === "none"`): deterministic-random placement `(sx, sy)` inside `PX..PX+PS` near `PB`, rotation `sr` (`±25°`), scale `ss = (cfg.stampSize || 100) / 100`.
  - Optional second stamp (`stamp2`, when `cfg.stamp2` is non-empty): `STAMPS.rect` at `px = PX + 30 + rn(8) * (PS - 60)`, `py = PB + 32 + rn(9) * 26`, `r = (rn(10) - 0.5) * 30`, `sz = ss * 0.85`.
  - Both render via `mkS(...)`: `<g${wear > 0 ? ` filter="url(#ink${i})"` : ""} transform="translate(${px} ${py}) rotate(${r}) scale(${sz})" ...>`, so ink wear automatically transforms with the stamp.
- Photo dragging (`#drag`) already exists in `js/app.js` (lines 1459–1495): renders transparent `.pp` hit-rects on cards, converts screen deltas using `target.ownerSVGElement.getScreenCTM().a`, patches the SVG element directly during `pointermove` (60 fps without full sheet rebuild), records coalesced history (`recordContinuous` / `finishContinuous`), and calls `render()` on `pointerup` / `pointercancel`.

### 1. Data model (optional per-card fields, backward compatible)
- Add two optional plain objects on each card in `studioState.cards`:
  - `card.stampPos`: override for stamp `0` (primary stamp).
  - `card.stamp2Pos`: override for stamp `1` (optional second stamp).
- Shape of each override object:
  - `x`: number, card-relative horizontal centre as a fraction of `CW` (clamped `[-0.04, 1.04]`, i.e., up to ~6.8 SVG units past the card edge so edge-overlapping stamps look authentic without ever leaving the card).
  - `y`: number, card-relative vertical centre as a fraction of `CH` (clamped `[-0.04, 1.04]`).
  - `r`: optional number, rotation in degrees (`-180..180`). When omitted, falls back to the card's auto rotation `sr` (or second-stamp auto angle).
  - `scale`: optional number, multiplier relative to the sheet/card stamp size (`0.4..2.5`, e.g., `1` = 100%, `1.25` = 125%). Effective SVG scale = `baseScale * (override.scale ?? 1)`.
- **Backward compatibility**:
  - Cards without `stampPos` / `stamp2Pos` render using the exact existing `sx, sy, sr, ss` formulas and formatting (`.toFixed(1)`), producing byte-for-byte identical output for all existing sheets.
  - Because `x` and `y` are fractions of `CW` and `CH` (not screen pixels or raw mm), placement survives preview zoom, switching card sizes (`Ticket` ↔ `Tarot` ↔ `Mini` ↔ visiting card), bleed/crop marks, and every export format (SVG, 300 dpi PNG, 300 dpi PDF, and print).
  - `exportProjectJson` / `importJson` include optional `stampPos` / `stamp2Pos` only when present on a card; old JSON files import unchanged.

### 2. Interaction model & reuse of existing photo-drag mechanism
- **Toolbar toggle (`#move-stamps`)**:
  - Enable the existing `#move-stamps` button in the preview toolbar as an `aria-pressed` toggle (`Move stamps`). Add a compact snap toggle (`Snap` checkbox, default on; bypassed anytime by holding `Alt` or `Shift`) shown only when `Move stamps` is active.
  - When `Move stamps` is **off**, the preview renders identically to today with no handles or overlays.
  - When `Move stamps` is **on**, `renderCard()` (only when `!cfg.one`, skipped in exports via `.st-ui` / `serializeSheetSvg` stripping just like `.pp`) emits interactive stamp overlays for each visible stamp (`data-ci="${i}"`, `data-si="0|1"`):
    - Visible dashed selection/hover outline around the stamp plus a crisp handle badge (`>= 44px` effective touch target on coarse pointers / ≥ 22 SVG units hit-rect, `tabindex="0"`, `role="slider"` / `aria-label="Card N primary stamp"` with `:focus-visible` ring).
    - **Dragging**: Reuses the `#drag` pointer-event architecture in `js/app.js`:
      - On `pointerdown` on `.st-hit`: `setPointerCapture(event.pointerId)`, record start pointer coords, `scale = ownerSVGElement.getScreenCTM().a`, and initial `(x, y)` (resolved from `card.stampPos` or the stamp's current auto `(sx, sy)` converted to `/ CW`, `/ CH` so dragging starts smoothly from where the stamp already sits!).
      - On `pointermove`: convert `(dx, dy) / scale` to card-relative `(dx / CW, dy / CH)`, clamp to `[-0.04, 1.04]`, apply optional light snapping (within `3.5` SVG units of card centre `x=0.5` / `y=0.5`, photo centre `(PM/CW, PMY/CH)`, or corner alignment guides; bypassed if `Alt`/`Shift` held or Snap toggle off), update `card.stampPos` / `card.stamp2Pos` via copy-on-write `updateCard()`, and patch the live stamp `<g id="st${si}-${i}">` `transform` + outline position directly at 60 fps!
      - On `pointerup` / `pointercancel`: commit **one** undo step (`finishContinuous` / `recordDiscrete("move stamp")`) and call `render()` + sync the selected card's numeric fields.
    - **Rotation & scale**:
      - Selected card's `Photo & theme options` adds Angle (° `-180..180`) and Scale (`% 40..250`) inputs for Stamp 1 (and Stamp 2 when `cfg.stamp2` is set), wired with `bindContinuousHistory` (600ms coalescing).
      - Optional small circular rotate knob on the active stamp outline when `Move stamps` is on (pending Decision 2 below).
    - **Keyboard nudging**:
      - Focused stamp handle (`ArrowLeft/Right/Up/Down`) nudges `(x, y)` by `2` SVG units (`10` SVG units with `Shift`), clamped to `[-0.04, 1.04]`, with coalesced undo (`recordContinuous("nudge stamp", ...)`).
    - **Buttons**:
      - Per-card **"Reset stamp position"** (selected card's `Photo & theme options`, clears `stampPos`/`stamp2Pos` in one undo step).
      - Toolbar / menu **"Reset all stamps"** (clears overrides on all cards, confirms via **Undo toast** in one undo step).
      - **"Copy placement to all cards"** and **"Copy to cards on this page"** (copies selected card's active stamp placement to all cards or current page cards in **one** undo step each).

### 3. Conflicts with photo-drag & touch scrolling
- **Photo-drag (`#drag`) conflict**:
  - When both `Move stamps` and `Drag photos on sheet` are checked/pressed, they compete for pointer events inside the photo area (`PB` overlaps the bottom of the photo).
  - See Decision 1 below (recommended: mutually exclusive toggles—enabling `Move stamps` turns off `#drag` and vice versa, with a clear status note).
- **Touch scrolling vs stamp drag**:
  - `.st-hit` / `.st-rot` SVG handles receive CSS `touch-action: none` (only on the handles when `Move stamps` is active) and call `event.preventDefault()` + `setPointerCapture()` on `pointerdown`.
  - Everywhere else on `#stage` / `.sheet` retains normal `touch-action: auto` / `pan-x pan-y`, so scrolling the sheet on a 390px phone still works smoothly whenever the user isn't touching a stamp handle.
  - Ensure stamp hit targets are at least `28 × 28` SVG units (which scales to `>= 44 CSS px` at fit/mobile zoom or expanded transparently in `.st-hit`) so fingers can grab stamps reliably without missing onto the stage background.

### 4. Additional photo mount options (`photoMounts` `4..8`)
- Existing `photoMounts` values `0..3` (`0` Tape, `1` Pins, `2` Corners, `3` None) remain untouched for full saved-sheet compatibility.
- Append 5 new mount options (`4..8`) in `js/svg-engine.js` (`mountSingle`) and `index.html` (retaining the existing up-to-2 mount pairing rule):
  - `4` **Washi tape**: semi-translucent striped masking tape strips (`T.tape` + accent `A` stripes) across opposing corners.
  - `5` **Metal brads**: 4 miniature split-pin metallic rivets at the photo corners using `T.mt` / `T.hi` / `T.dk` shading.
  - `6` **Paperclip**: bent wire paperclip (`T.hi` / `T.mt`) sliding over the top photo edge (alternating left/right via `odd`).
  - `7` **Staples**: twin angled wire staples across the top corners of the photo frame.
  - `8` **Wax seal**: small embossed circular wax seal with drop shadow & inner ring in accent `A` at the bottom corner of the photo.

### 5. Effort & risk
- **Effort**: **M–L** (renderer coordinate resolution + `.st-ui` overlay stripping in `export.js` + `js/app.js` pointer/keyboard/copy/reset wiring + 5 photo mount primitives + mobile touch/export parity checks).
- **Risks**:
  - *Export parity*: overlay handles (`.st-ui`) MUST be stripped in `serializeSheetSvg` and `sheetCardPreviewSvg` (just like `.pp`) so SVG/PNG/PDF exports and print show only the stamp, never drag outlines.
  - *Zoom/CTM accuracy on touch*: `getScreenCTM().a` must be read on `pointerdown` directly from the SVG element so scaled desktop zoom and 390px mobile preview drag 1:1 under the finger.
  - *Tarot verification*: fixing the pre-existing `titleMarkup` double-`D` offset bug (if approved below) ensures Tarot cards display cleanly during Phase 7 testing.

---

### Owner decisions needed before Step 2 implementation

1. **How should "Move stamps" interact with "Drag photos on sheet"?**
   - **Option A (Recommended)**: Mutually exclusive — enabling `Move stamps` automatically turns off `Drag photos on sheet` (and vice versa), with a status message explaining why.
   - **Option B**: Allow both active simultaneously, layering stamp hit handles above the photo drag rect (tapping a stamp drags the stamp; dragging elsewhere on the photo pans the photo).

2. **How should rotation & scale be controlled?**
   - **Option A (Recommended)**: Numeric Angle (°) & Scale (%) controls in the selected card's `Photo & theme options` **plus** an on-card rotation handle when `Move stamps` is active (dragging rotates live; `Shift` snaps to 15°).
   - **Option B**: Numeric Angle (°) & Scale (%) inputs in the selected card's `Photo & theme options` only (no on-card rotation handle).

3. **Should we fix the pre-existing Tarot title double-`D` offset bug spotted in Phase 6?**
   - **Option A (Recommended)**: Fix `titleMarkup` in `js/svg-engine.js` (remove the redundant `+ D` inside `<g transform="translate(0 ${D})">`) alongside Step 2 so Tarot cards render titles inside the card cleanly. (Ticket size `D=0` is unaffected.)
   - **Option B**: Leave `titleMarkup` untouched for a separate fix.

## Phase 7 implementation and verification
- **Owner choices applied**: Option A (mutually exclusive `#move-stamps` and `#drag`); Option A with dials (rotary `[data-stamp-dial]` angle dial + numeric angle/scale controls in each card's `Photo & theme options` plus on-card `.st-rot-hit` rotation handle); Option A (fixed pre-existing Tarot `titleMarkup` double-`D` offset in `js/svg-engine.js`).
- **Implemented (`js/stamps.mjs`, `js/svg-engine.js`, `js/app.js`, `js/export.js`, `index.html`, `css/app.css`)**:
  - Added optional card-relative `card.stampPos` and `card.stamp2Pos` (`{ x, y, r, scale }`), clamped to `[-0.04, 1.04]` with optional centre/margin snapping (bypassed via `Alt`/`Shift` or `#stamp-snap`), preserving exact legacy auto-placement when absent.
  - Added 5 extra photo mounts (`4` Washi tape, `5` Brads, `6` Paperclip, `7` Staples, `8` Wax seal) combinable up to 2 via `photoMounts`.
  - Enabled `#move-stamps`, `.st-ui` drag/rotate overlays (stripped in `serializeSheetSvg` / `sheetCardPreviewSvg` and hidden in `@media print`), keyboard arrow/`Shift`+arrow nudges, `#reset-all-stamps` (Undo toast), `Reset stamp position`, `Copy to page`, `Copy to all cards`, and `?v=phase7` cache version.
  - Follow-up commit `ced4597` fixed `.st-hit` / `.st-rot-hit` ancestor selection (`g[data-ci]:not(.st-ui)`) for second-stamp dragging and enlarged `.st-hit` (`92×92` SVG units) and `.st-rot-hit` (`r=44` with knob-vs-center distance disambiguation) so hit boxes exceed `44 CSS px` at `390×844`.
- **Verification**:
  - Node tests passed after `ced4597`: `node tests/stamps.test.mjs`, `tests/borders.test.mjs`, `tests/history.test.mjs`, `tests/theme-studio-utils.test.mjs`, `tests/color-controls.test.mjs`, `.mjs` syntax checks, and 160 unique HTML IDs.
  - Browser check on `7b341db`: `index.html`, `theme-studio.html`, `bulk-import.html`, and `tests/title-layout.test.html` (4 passed) loaded with 0 console errors; verified mounts `4..8`, Tarot title placement inside card bounds (`y=199` above `y=214`), mutual exclusion between `#move-stamps` and `#drag`, clamping, snapping, rotary dial + numeric/scale controls, keyboard nudges, batch copy/reset + 1-step undo/redo, Ticket↔Tarot normalized placement parity, `#pvi` / 300 dpi PNG / 300 dpi PDF parity with 0 `.st-ui` overlays, and 0px stage scroll during stamp drag at `390×844`.
  - Browser re-verification of `ced4597` (second-stamp pointer drag + `>=44px` touch measurements at `390×844`) was paused by the user's request for the Stamp Shape Visual Picker design below and will run right alongside it.

## Proposal: Visual Stamp Shape picker & customisation (awaiting approval)

### Goal
Give **Stamp shape** in the **Effects** accordion the same visual, tactile UX as **Border style** in **Look**: a live-themed visual swatch picker followed by a collapsed **Customise** fold (with optional presets and per-card overrides).

### 1. Visual Stamp Shape picker (replaces `<select id="sshape">`)
- Replace `<select id="sshape">` with a 4-column responsive swatch grid (`#stamp-picker`, `role="radiogroup"`, keyboard arrow navigation), matching `#border-picker`.
- **Existing keys preserved unchanged**: all 15 named shapes (`round`, `oval`, `rect`, `tri`, `shield`, `hex`, `diamond`, `seal`, `starburst`, `scallop`, `ticket`, `arch`, `ribbon`, `burst`, `cross`) plus `mixed` (collage icon) and `none` (dashed slash icon).
- **Optional 6 new concert/music stamp shapes** appended to `STAMPS` (pure vector paths inside `[-20..20]` viewBox, clear text bounds `yr` / `nm` / `w`):
  - `vinyl`: double-ring LP record with subtle centre groove arcs
  - `pick`: rounded triangular guitar-pick silhouette
  - `octagon`: bold chamfered octagon stop-badge
  - `banner`: wide notched ticket/tour pennant banner
  - `badge`: crest/shield with top star notch
  - `bolt`: octagonal / angled rock-poster stamp frame with lightning accent
- Each swatch renders a crisp live SVG (`viewBox="-24 -22 48 44"`) using the active theme's paper fill and resolved stamp ink (`stampAuto ? accent : stampColor`), using unique IDs (`st-sw-${key}`) with zero filter/DOM collisions.

### 2. Collapsed `Customise` fold (only relevant controls shown)
- Hidden for `none`; shows only applicable controls for the selected shape:
  - **Ink style (`fillMode`)**: `Outline` (default, identical to legacy output), `Tinted fill` (12% ink wash inside outer stamp path), or `Solid badge` (solid ink fill with contrasting paper/light text).
  - **Stroke weight (`weight`)**: `0.6× – 2.0×` (default `1.0×`).
  - **Line pattern (`pattern`)**: `Solid` (default), `Dashed`, `Dotted`.
  - **Ink opacity (`opacity`)**: `35% – 100%` (default `95%`, matching legacy `.95`).
  - **Inner frame (`innerRing`)**: toggle on/off (default on).
  - **Show year (`showYear`)**: toggle on/off (default on when stamp year is set).
  - **Stamp ink wear**: `0 – 100` slider synced 2-way with `#wear` in Effects -> Advanced.
- **Data model (optional fields only, backward compatible)**:
  - Sheet-level customisations live in optional `settings.stampStyle` (omitted when at defaults); per-card overrides live in optional `card.stampStyle` alongside `card.sk`.
  - Unmodified stamps take the exact legacy `mkS(...)` SVG path so existing saved sheets render byte-for-byte identically.
- **Stamp presets & scope (mirroring Border presets)**:
  - `ticketgen.stampPresets.v1` in `localStorage`: Save named preset, Apply to sheet, Apply to card #N, Apply to all cards, Reset defaults, and confirmed Delete.

### Owner decisions needed before implementation
1. **New stamp shapes**:
   - **Option A (Recommended)**: Append the 6 new music/concert shapes (`vinyl`, `pick`, `octagon`, `banner`, `badge`, `bolt`) after the existing 15 + `mixed`/`none`.
   - **Option B**: Keep only the existing 17 stamp shape options (`15` + `mixed` + `none`) with the new visual picker.
2. **Stamp Customise & Presets scope**:
   - **Option A (Recommended)**: Full parity with Borders — visual picker + `Customise` fold (`fillMode`, `weight`, `pattern`, `opacity`, `innerRing`, `showYear`, `wear`) + `localStorage` presets + `Apply to card #N` / `Apply to all cards`.
   - **Option B**: Visual picker + `Customise` fold (sheet-level only; per-card stays shape/text/position only).
3. **`#rnd` ("Randomise all")**:
   - **Option A (Recommended)**: Include any newly added stamp shapes in `#rnd` (`Mixed` / random shape selection).
   - **Option B**: Keep `#rnd` picking from the original 15 + `mixed` only.


---

## Phase 8 design: "Surprise me" per-card randomisation (awaiting approval)

### Audit baseline (`docs/AUDIT.md` Section 10–11 & current Phases 5–7)
- **Already per-card (optional fields)**: `theme`, `sk`, `stx`, `stampStyle` (Phase 7 visual stamp picker), `border` (Phase 6), `stampPos`, `stamp2Pos` (Phase 7), plus user content (`title`, `genre`, `loc`, `year`, `code`, `img`, `imgUrl`, `corsLimited`, `iw`, `ih`, `zm`, `px`, `py`, `h`, `s`).
- **Currently sheet/page-only**: palette overrides (bg/ink/mute/accent/frame/tape), border wear on legacy `0..4` frames, stamp colour/auto/wear/size, tape/mount types & colour, title font/scale/centering, surface grain/edge wear/creases/scuffs, gradient angle/spread, year badge style, tear style, halftone, and photo filter (`design-filter`).
- **Card cap today**: `MAX_CARDS = 72` in `js/app.js` and `js/bulk-import.js` (`#count` `max="72"` in `index.html`). To support the Phase 8 200-card performance/verification test natively in the Sheet Editor and Bulk Upload, we propose raising `MAX_CARDS` (see Owner Decision #1).

---

### 1. Per-card style overrides (optional fields only, backward compatible)

Every new style override lives as an **optional** property on each card object inside `studioState.cards`. A card without these fields renders using the exact sheet/page defaults and produces byte-for-byte identical output to today.

| Group | Optional card field(s) | Schema / range | Notes |
|---|---|---|---|
| **Theme & palette** | `card.theme`, `card.palette` | `theme`: string (`THEMES` key incl. `saved_*`); `palette`: `{ bg?, ink?, mute?, ph?, frame?, acc?, bt?, grad?, gs?, gl? }` | `card.palette` overrides individual colours on top of `card.theme` / page theme / sheet theme without mutating `THEMES[key]` or overwriting the photo-sampled `card.h`/`card.s`. |
| **Border** | `card.border` | Existing Phase 6 object (`style`, `width`, `inset`, `colorMode`, `color`, `opacity`, `pattern`, `dash`, `gap`, `corner`, `cornerSize`, `lineGap`, `inner`, `innerWidth`, `innerGap`, `innerColorMode`, `innerColor`, `ornament`, `ornamentSize`, `wear`, `glow`) | Already implemented in `js/borders.mjs`; update `svg-engine.js` legacy fast-path (`inkFilter("bd"+i, ...)`) to also honour `resolvedBorder.wear` when `card.border.wear` is set. |
| **Stamps** | `card.sk`, `card.stampStyle`, `card.stampColor`, `card.stampAuto`, `card.stampSize`, `card.stampWear`, `card.stampPos`, `card.stamp2Pos` | Existing `sk`, `stampStyle`, `stampPos`, `stamp2Pos` + optional `stampColor` (`#RRGGBB`), `stampAuto` (`boolean`), `stampSize` (`50..250`), `stampWear` (`0..100`) | Reuses Phase 7 clamping/transform math (`resolveStampTransform`) and visual stamp customisation (`resolveStampStyle`). |
| **Mounts & tape colour** | `card.photoMounts`, `card.tape` | `photoMounts`: `[0..8]` (up to 2); `tape`: `#RRGGBB` | Sets card-level mount types and derives `te = mix(tape, "#000000", 0.25)` when `card.tape` is provided. |
| **Title font & badges** | `card.titleFont`, `card.titleScale`, `card.centerTitle`, `card.yearBadge`, `card.tearStyle` | `titleFont`: key in `TF`; `titleScale`: `0.7..1`; `centerTitle`: boolean; `yearBadge`: `0..2`; `tearStyle`: `0..2` | Allows font pairing & badge/tear variety without breaking `year` / `EST.` text rules. |
| **Wear, texture & effects** | `card.grain`, `card.edgeWear`, `card.creases`, `card.scuffs`, `card.photoFilter`, `card.halftone` | `grain/edgeWear/creases/scuffs`: `0..100`; `photoFilter`: `0..2`; `halftone`: boolean | Photo filter (`Original` / `B&W contrast` / `Warm sepia`) and print-wear layers become individually variable. |
| **Gradient** | `card.gradientAngle`, `card.gradientSpread` | `gradientAngle`: `0..359`; `gradientSpread`: `10..100` | Applies when the resolved theme uses `grad: 1`. |
| **Lock** | `card.locked` | `boolean` (omitted when `false`) | Prevents **Surprise me** / **Shuffle again** from altering this card ("Keep this one"). |

**Renderer precedence (single extended path in `renderCard`, no fork)**:
1. Introduce a small pure helper `resolveCardRenderOptions(c0, cfg)` inside `js/svg-engine.js` so `renderCard(c0, i, cfg)` keeps one unified code path.
2. **Theme precedence fix**: Today `js/svg-engine.js:200` evaluates `THEMES[cfg.themeForce || c0.theme || cfg.style]`, where `app.js:1032` passes `pageTheme` as `themeForce` — causing a page theme to override `card.theme`! Fix this to:
   `cfg.themeObj || THEMES[c0.theme || cfg.themeForce || cfg.style] || THEMES.cream`
   so **card override (`c0.theme`) > page theme (`cfg.themeForce`) > sheet theme (`cfg.style`)**, while unmodified cards (`!c0.theme`) behave identically to today.
3. Whenever `c0.palette` or `c0.tape` is present, build a shallow clone `const T = { ...baseTheme, ...c0.palette, ...tapePatch }` — never mutate `THEMES` or `CUSTOM`.

**Exports, Bulk Upload, JSON & Undo snapshots**:
- **SVG / PNG / PDF / Print / Card Preview Modal (`js/export.js`, `#pvi`)**: All serialize the SVG produced by `renderCard()`, so every per-card override exports identically with zero extra export branches.
- **JSON Export / Import (`exportProjectJson`, `importJson`)**: `exportProjectJson` serializes new optional fields only when set on a card; `importJson` validates/restores them cleanly (`sanitizeCardStyling`). Old JSON files remain 100% compatible.
- **Bulk Upload (`js/bulk-import.js`)**: Passes through any optional style fields on imported JSON cards and keeps existing sheet/card styling intact when appending.
- **Undo snapshots (`js/history.mjs`)**: Already stores full shallow-copied `cards` arrays with copy-on-write card objects, retaining all optional style fields automatically while sharing unchanged photo data URLs.

---

### 2. Existing renderer assumptions fixed for heterogeneous cards

1. **`themeForce` overriding `c0.theme`**: Fixed as above so card theme overrides win over page themes (`pageThemes[page]`).
2. **Global `cfg.*` fields in `renderCard()`**: `cfg.stampWear`, `cfg.borderWear`, `cfg.stampColor`, `cfg.stampAuto`, `cfg.stampSize`, `cfg.titleFont`, `cfg.titleScale`, `cfg.centerTitle`, `cfg.gradientAngle`, `cfg.gradientSpread`, `cfg.grain`, `cfg.edgeWear`, `cfg.creases`, `cfg.scuffs`, `cfg.photoMounts`, `cfg.yearBadge`, `cfg.tearStyle`, `cfg.photoFilter`, `cfg.halftone` are read once into resolved local values `(c0.X ?? cfg.X)`. Legacy `0..4` border `inkFilter("bd"+i, ...)` reads `resolvedBorder.wear` instead of `cfg.borderWear`.
3. **SVG `<defs>` ID uniqueness**: Every card on a sheet already uses its unique card index `i` (`bgg${i}`, `ink${i}`, `bd${i}`, `np${i}`, `ht${i}`, `gr${i}`, `sc${i}`, `ew${i}`, `cc${i}`, `ck${i}`, plus border `bd-${scope}-${i}`/`bgl-${scope}-${i}`/`bgd-${scope}-${i}`/`bm-${scope}-${i}`). Ensure `previewSvg(index)` and `#pvi` (`scopePreviewSvgIds`) scope every `<defs>` ID (`pv-` prefix) so per-card filters, gradients, and halftone patterns never collide with the sheet DOM.
4. **Row DOM rebuild bottleneck (`buildRows()` at 200+ cards)**: Currently `buildRows()` builds full `<select>` theme (`~26+`) and stamp (`~24`) `<option>` strings inside every row's innerHTML on every render/batch update (`200 × 50 ≈ 10,000` option nodes). Cache shared option markup **and** lazily populate heavy `<details class="adj">` selects only on first expand (`toggle`), rendering only the active `<option>` when collapsed.

---

### 3. Seeded randomiser, scope picker, locks & guard rails (`js/randomiser.mjs`)

- **Seeded PRNG (`mulberry32`)**:
  - Each run creates or accepts an integer `seed` (randomised on **Surprise me** and re-rolled on **Shuffle again**). Per-card RNG derives deterministically from `(seed, cardIndex)` so identical seed + scope + strength always reproduces identical card styles.
  - UI exposes **"Shuffle again"** (re-rolls with a new seed) inside the Surprise controls/toast status and **"Keep this one"** per card (`card.locked = true` skips that card in future shuffles).
- **Scope picker & Strength (`ticketgen.surprisePrefs.v1` in `localStorage`)**:
  - Compact popover/panel opened from the secondary **Options** button next to **Surprise me** (remembering last choices):
    - **What to randomise**:
      - `[x]` **Colours & theme** (plus sub-checkbox: `[ ] Keep my theme, only vary the details`)
      - `[x]` **Border** (curated border styles & compatible customisations)
      - `[ ]` **Stamps (incl. position)** (shape, ink style/weight/pattern, safe placement/angle/scale)
      - `[x]` **Wear & texture** (subtle paper grain, vignette, border/stamp wear, mounts, badges, optional Subtle/Wild photo filters)
      - `[ ]` **Title font** (title font family & alignment)
    - **Strength slider**: `0` **Subtle** · `1` **Normal** (default) · `2` **Wild**
      - *Subtle*: stays close to sheet/page theme (accent/tape shifts ±15–25°, light wear `0–25`, clean borders `0/1/2/4/5/6/7`, mild stamp tilt `±12°`).
      - *Normal*: draws from curated built-in + saved themes weighted harmoniously, all print-safe borders, moderate wear (`0–45`), varied stamps/mounts (`±25°`).
      - *Wild*: spans full theme pool (Dark/Light/Gradient/`saved_*`), all 16 borders (matched cleanly to card dark/light polarity), bold typography (`TF`), stronger wear/scuffs/creases/filters, `Solid badge` / `Tinted` stamps & wider tilts (`±42°`), still bounded by all guard rails below.
- **Guard rails (enforced mathematically inside `js/randomiser.mjs`)**:
  1. **WCAG AA contrast (`>= 4.5:1`)**: Exact sRGB relative-luminance check verifies `ink` and `mute` against `bg` (and for gradient themes, against **both** `gs` and gradient end stop `hsl(h, s, gl)`). If below `4.5:1`, adjusts lightness/mix toward `#111111` or `#ffffff` until `>= 4.5:1`.
  2. **Print-safe accents & strokes**: Avoids near-white accents (`lum > 0.82`) on light themes (`bgLum > 0.55`) and near-black accents (`lum < 0.08`) on dark themes (`bgLum < 0.2`); constrains generated border `width >= 0.75`, `opacity >= 55%`, and suppresses heavy `neon` blur on light paper backgrounds.
  3. **Safe stamp bounds & anti-occlusion**: Uses `stampNormBounds` (`0.04..0.96` strict inside card) and picks from curated safe anchor zones (tear-line left/right margins near `PB`, top-right/bottom-right photo corners, bottom-right stub beside `EST.`) avoiding both the photo focal core (`[PX+34..PX+102, PY+30..PY+106+D]`) and the title/genre text zone (`y >= 182 + D` on `Ticket`/`Tarot`). Never overwrites manual `stampPos`/`stamp2Pos` unless the **Stamps** checkbox is enabled.
  4. **Strict data isolation**: Randomiser accepts `(cards, sheetCfg, prefs)` and touches ONLY the allowlisted optional style keys. **Never** modifies `title`, `genre`, `loc`, `year`, `code`, `img`, `imgUrl`, `corsLimited`, `iw`, `ih`, `zm`, `px`, `py`, photo-sampled `h`/`s`, card order, `count`, or page layout.

---

### 4. Buttons, custom indicators, Undo & 200-card performance

- **Cards header**:
  - Enable `#surprise-all` (**Surprise me**) and add adjacent `#surprise-tune` (**Options** icon button opening the Scope/Strength/Shuffle-again/Clear-all popover). Keep header compact so 390px mobile fits with zero overflow.
- **Card row UI & `...` menu**:
  - Small custom-styling indicator dot/badge on cards with any style override (`hasCustomCardStyling(card)`) + Lock toggle (`data-action="toggle-lock"`, Lock icon, `"Keep this one"`).
  - Row `...` menu enables **`Surprise this card`** (`data-action="surprise"`) and adds **`Reset this card's styling`** (`data-action="reset-styling"`, enabled when overrides exist).
  - Scope popover + Cards actions also provide **`Clear all random styling`** (restores sheet defaults across cards in one undo step).
- **Undo / Redo**:
  - `Surprise me`, `Shuffle again`, `Surprise this card`, `Clear all random styling`, and `Reset this card's styling` each push **1 discrete undo step** via `recordDiscrete(...)` with an Undo toast.
  - Lock toggle (`Keep this one`) records a discrete step (`toggle card lock`) cleanly without rebuilding previews unnecessarily (`render` only when visual state changes or row DOM sync only).
- **Performance (hundreds of cards)**:
  - Compute all unlocked cards in a single synchronous array pass, commit one snapshot, run `buildRows()` (with cached/lazy `<select>` options) and `render()` **once** (`svgPages.join("")`), targeting fast response on 200-card (`~23` A4 page) sheets.

---

### 5. Effort & risk estimate
- **Effort**: **L** (`js/svg-engine.js` override/precedence unification, `js/randomiser.mjs` PRNG + WCAG contrast + stamp zone guard rails, `js/app.js` / `index.html` / `css/app.css` Surprise UI + row lock/custom badges + lazy 200-card row optimization, `js/export.js` JSON round-trip, `tests/randomiser.test.mjs`, and 18-card + 200-card browser/export verification).
- **Risks & mitigations**:
  - *Overwriting user-placed Phase 7 stamps*: Guessed mutations would frustrate users who carefully dragged stamps; guarded by keeping `Stamps` unchecked or explicitly reporting replaced manual stamps in the Undo toast with instant one-tap Undo.
  - *DOM lag at 200+ cards*: Eliminated by rendering previews **once** per batch action and lazily populating row `<details class="adj">` dropdowns.
  - *Browser PNG/PDF memory on 23-page 200-card PDF*: Raster exports remain sequential page-by-page (`exportPdf`); verify SVG/print/Surprise timing cleanly on 200 cards.

---

### Owner decisions needed before Step 2 implementation

1. **Card count limit (`MAX_CARDS`) for the 200-card sheet test**:
   - **Option A (Recommended)**: Raise `MAX_CARDS` from `72` to `300` across `#count`, `js/app.js`, JSON import, and `js/bulk-import.js` so 200-card sheets work everywhere cleanly.
   - **Option B**: Raise `MAX_CARDS` to `500`.
   - **Option C**: Keep `MAX_CARDS` at `72` in the sidebar UI and only allow up to 200+ via a separate test/JSON path.

2. **When `Surprise me` runs with `Stamps (incl. position)` ticked and an unlocked card already has a manually dragged stamp (`stampPos` / `stamp2Pos`)**:
   - **Option A (Recommended)**: Randomise stamps on unlocked cards too, include an optional `"Keep manually moved stamps"` toggle in the Surprise options popover (default off when Stamps is explicitly ticked), and tell the user in the Undo toast (e.g. `"Surprised 9 cards (updated 2 moved stamps) — Undo"`).
   - **Option B**: Always pop up a confirmation prompt before overwriting manually dragged stamp positions.
   - **Option C**: Never overwrite manually dragged stamp positions even when `Stamps` is ticked; require `"Reset all stamps"` first.

3. **Clicking `"Surprise me"` directly**:
   - **Option A (Recommended)**: Clicking `"Surprise me"` runs immediately with your last saved choices (sensible defaults on first click: Colours, Border, Wear on; Stamps & Font off; Normal strength), while the compact gear button right beside it opens the Scope picker + Strength + Shuffle again + Clear all popover.
   - **Option B**: Clicking `"Surprise me"` always opens the Scope picker popover first before rolling.

## Phase 8 implementation and verification
- **Owner choices applied**: Option A (raise `MAX_CARDS` to `300` across `#count`, `js/app.js`, JSON import, and `js/bulk-import.js`); Option A (when `Stamps` is ticked, replace unlocked cards' stamps unless optional `"Keep manually moved stamp positions"` is checked, and report the replaced count in the Undo toast with one-tap Undo); Option A (clicking `"Surprise me"` runs immediately with remembered preferences, while `#surprise-tune` opens the Scope / Strength / Shuffle again / Clear all dialog).
- **Implemented (`js/card-styles.mjs`, `js/randomiser.mjs`, `js/svg-engine.js`, `js/app.js`, `js/export.js`, `js/bulk-import.js`, `js/icons.mjs`, `index.html`, `bulk-import.html`, `css/app.css`)**:
  - Added optional per-card style fields (`palette`, `tape`, `stampColor`, `stampAuto`, `stampSize`, `stampWear`, `photoMounts`, `titleFont`, `titleScale`, `centerTitle`, `yearBadge`, `tearStyle`, `grain`, `edgeWear`, `creases`, `scuffs`, `photoFilter`, `halftone`, `gradientAngle`, `gradientSpread`, `locked`) alongside existing `theme`, `sk`, `stx`, `stampStyle`, `border`, `stampPos`, `stamp2Pos`.
  - Unified `resolveCardRenderOptions(c0, cfg)` in `js/svg-engine.js` so **card override > page theme > sheet theme**, legacy `0..4` borders read `resolvedBorder.wear` cleanly, shared `THEMES` objects are cloned instead of mutated, and un-overridden cards keep identical output.
  - Built seeded Mulberry32 `js/randomiser.mjs` with persisted scope/strength (`ticketgen.surprisePrefs.v1`), WCAG `>= 4.5:1` luminance/contrast checking across both solid fills and linear-gradient stops, print-safe accent & border minimums (`width >= 0.75`, `opacity >= 55%`), and anti-title/photo-focal stamp anchor placement inside `stampNormBounds`.
  - Wired `#surprise-all`, `#surprise-tune`, `#surprise-dialog` (`Subtle`/`Normal`/`Wild`, scope checkboxes, `Shuffle again`, `Clear all random styling`), per-card `Keep this one` lock icon button + `.card-custom-badge`, row `...` `Surprise this card` / `Reset this card's styling`, `DocumentFragment` + lazy `<details class="adj">` dropdown population, `44px+` enlarged stamp touch targets (`.st-hit` min `116×116`, `.st-rot-hit` `r=56`), and uniform `?v=phase8` cache query.
- **Verification**:
  - **Node unit tests**: `node tests/randomiser.test.mjs` (36.3 ms for 200-card generation), `stamps.test.mjs` (updated `SKINDS` 31 / `STAMP_OPTIONS` 33 for owner-added stamps), `borders.test.mjs`, `history.test.mjs`, `theme-studio-utils.test.mjs`, and `color-controls.test.mjs` all passed; `index.html` has `201` unique IDs (`0` duplicates).
  - **Browser QA (`http://127.0.0.1:8090/`)**:
    - `index.html`, `theme-studio.html`, `bulk-import.html`, and `tests/title-layout.test.html` (`4` passed, `0` failed) all loaded with `0` console/page errors.
    - Legacy v1 `Brackets` JSON import/export round-trip (`1389` bytes) and unmodified baseline check passed.
    - 18-card Surprise me verified Card #1 lock preservation, 17 individually styled cards (`14` distinct fills), `Card > Page > Sheet` theme precedence, non-style text/photo preservation, 1-step Undo/Redo, scope dependency toggles, `Surprise this card`, `Reset this card's styling`, `Clear all random styling`, manually moved stamp protection when `Stamps` unchecked + toast notification when replaced, `0` duplicate SVG IDs (`130` checked across `#pv` + `#sheets`), `#png` (2 pages) & `#pdf` (`5,352,271` bytes) downloads, and `@media print` A4 rules.
    - 200-card scaling verified `200 cards across 23 A4 pages` (`24` SVGs w/ template) rendered cleanly (`#count = 200` in `2171` ms, `#surprise-all` in `1948` ms, `#undo` in `1587` ms) and lazy select population (`1` -> `27` options on open).
    - `390×844` mobile verified `0` horizontal overflow, `.st-hit` `59.06 × 59.06` CSS px, `.st-rot-hit` `57.03 × 57.03` CSS px, and `0px` `#stage` scroll delta during stamp drag.
    - Note: automated `.svg` download is blocked by the browser sandbox policy (`DOWNLOAD_BLOCKED`), `page.emulateMedia()` was unavailable in sandbox (`@media print` rules verified in CSS/DOM instead), and `"Formats"` label padding on `390px` header remains a minor pre-existing tight fit.
- **Post-Phase 8 follow-ups (`809d7e8`, `d56aade`, `9a3b3dd`, `1c2035e`)**:
  - Preserved exact grey/white/low-saturation hex accents (`hexToHS` / `hslToHex` + explicit `card.accent` override in `renderCard()` with readable `bt` contrast and neutral gradient stops), while keeping unmodified legacy cards byte-for-byte identical.
  - Added `19` new built-in **Gradient Themes** (`21` total in `grp: "Gradient"`): `gradd3` / `gradl3` (triple dark/light reactive gradients), `raddark` / `radlight` / `radhalo` / `radpearl` (radial spotlights/halos), and curated 3-/4-stop presets (`tridusk`, `tridawn`, `aurora`, `cyber`, `ember`, `midnight`, `synth`, `prismatic`, `peach`, `matcha`, `lavender`, `sunsetl`, `hologram`), plus multi-stop WCAG contrast checks in `js/randomiser.mjs`.
  - Added `#grad-angle-reset` (**Reset 180°**) next to the gradient angle readout in Look (1-step undoable, disabled at `180°` or on non-gradient themes).
  - Made **Quick colours** (`Paper`, `Text`, `Accent`, `Tape`, `Use photo accent`) reflect and live-override any active sheet theme via optional `settings.quickColors` with `#ct_reset` (**Reset colours**), and added `#grad-stops-block` (**Gradient colours**: 2–4 stop pickers + hex inputs + `+ Colour` / `− Remove`) whenever a Gradient theme is selected (`1c2035e`).
  - Organised all `44` built-in themes + Saved Custom/Custom into `8` clear built-in categories (`Light · Classic & Paper`, `Light · Pastel & Pop`, `Dark · Moody & Ink`, `Dark · Neon & Retro`, `Gradient · Dual & Triple`, `Gradient · Radial`, `Gradient · Dark Presets`, `Gradient · Light Presets`) via `getGroupedThemes()` and replaced the plain `#style` `<select>` UI with a custom visual dropdown (`#theme-trigger` + `#theme-menu`, live miniature card SVG thumbnails via `renderThemeThumbSvg()`, type badges, and quick filter input `#theme-filter`) synced 2-way with `#style` (`1c0f4e2`).
  - Split the overloaded sidebar drawers into `6` focused accordions (`Page`, `Paper & wear`, `Theme & colours`, `Borders`, `Card & photo`, `Stamps` — moving grain/vignette/creases/scuffs next to `Page` and removing the nested `Effects -> Advanced` drawer), added `#delete-page` (`deleteActivePage`, 1-step undoable, disabled at 1 page) beside `#duplicate-page`, and added `.rows-page-break` dividers (`End of page N · Cards X–Y`) inside `#rows` (`getCardRowEl` replaces child-index assumptions) (`e5dea0b`).
  - Re-ran all 6 Node unit test suites (`randomiser.test.mjs` — `24.2 ms` for 200 cards, `stamps.test.mjs`, `borders.test.mjs`, `history.test.mjs`, `theme-studio-utils.test.mjs`, `color-controls.test.mjs`), `217` unique HTML ID check, and `git diff --check` after `e5dea0b`.
  - Overhauled the `vinyl` stamp (`r=18` outer disc, `r=15.9`/`13.8` vinyl micro-groove tracks + diagonal shimmer arcs, `r=10.8` center record label ring, `r=2` center spindle hole with flanking label ticks and `yr: -4.2` / `nm: 6.4` clearance) and appended `3` new music stamp variants (`spotify` "Spotify", `ytmusic` "YT Music", `clef` "Treble clef") bringing `SKINDS` to `34` and `STAMP_OPTIONS` to `36` (`560b07c`), bumped `?v=phase8.2` uniformly across local references, and re-verified all 6 Node test suites + `git diff --check`.
  - Updated `spotify`, `ytmusic` (concentric double-ring disc + play triangle emblem), and `clef` to standalone ringless stamp shapes (`openText: true` preserving stamp color below solid emblems), expanded `TF` + `#tfont` + `FONT_KEYS` + `FONT_POOLS` to `14` fonts (`script` Handwriting, `calligraphy`, `brush`, `marker`, `georgia`, `trebuchet`, `impact`, `consolas`, alongside `pirata`, `playfair`, `mont`, `bebas`, `type`, `courier` + Google Fonts links), and added the **Polaroid** built-in theme (`polaroid: 1`, recessed `146×146` film aperture + deep bottom white chin rendering only band name + year, custom Polaroid swatch thumbnail) (`b36f160`).
  - Added scraggly handwriting options (`scrawl` Reenie Beanie / Covered By Your Grace / Ink Free, and `rough` Rock Salt, bringing `TF` to `16` fonts), switched `polaroid` default font to `scrawl` (`TF.scrawl` with `ys: 11`), wired `T.min` (**Minimal** `min` and **Minimal ink** `mini`) into `isMinimal` in `js/svg-engine.js` (previously unhooked because only `cfg.minimalLayout === true` was checked, causing Minimal themes to render full cluttered ticket layouts!) with `TF.mont` default, wrapped 2-line minimal spacing (`210 + D`), `centerTitle` alignment, and `<defs>` support for photo filters/halftone (`de221e7`, `?v=phase8.4`). Re-verified all 6 Node unit test suites and `git diff --check`.

---

## Phase 9 Part A (Local Band Search) — Implementation & Verification (`ac5d0e9`, `?v=phase9`)

- **Implemented (`js/search.mjs`, `index.html`, `css/app.css`, `js/app.js`, `tests/search.test.mjs`)**:
  - Built pure filter utilities in `js/search.mjs` (`normalizeSearchText` with NFD diacritic stripping + Latin ligature normalization `æ`/`ø`/`œ`/`ß`/`ł`/`đ`/`ð`/`þ`, `tokenizeSearchQuery` for multi-word queries across fields, `cardSearchHaystack` covering `title`, `genre`, `loc`, `year`, `code`, `stx`, and `imgUrl`, `filterCardIndices`, `formatSearchCount`, and `debounce` with `.cancel()` / `.flush()`).
  - Enabled `#card-search` in the Phase 3 `.card-search-slot`, paired with `#card-search-clear`, `#card-search-count` (`"1 of 18"`, `"0 of 18"`), and `#card-search-empty` with inline **"Clear search"** button.
  - Wired transient `cardSearchQuery` completely outside `studioState`, `History` snapshots, autosave, page layout, `#sheets` SVG rendering, and exports; typing debounces at `110ms` over cached DOM rows without rebuilding `#rows` (keeping active focused inputs visible even while editing).
  - Keyboard & click navigation: `Escape` / Clear restores all rows and keeps focus on `#card-search`; `Enter` selects the first matching card; `ArrowDown` moves focus to the first visible match; clicking any matching row (`[data-action="select-card"]` / `.row`) calls `scrollStageToPage()` to sync `#page-select` and scroll `#stage` to the selected card's page.
- **Verification**:
  - **Node unit tests**: `node tests/search.test.mjs` + all 6 existing suites (`stamps.test.mjs`, `borders.test.mjs`, `randomiser.test.mjs` — `26.8 ms` 200-card generation, `history.test.mjs`, `theme-studio-utils.test.mjs`, `color-controls.test.mjs`), `219` unique HTML ID check (`0` duplicates), and `git diff --check` all passed.
  - **Browser QA (`http://127.0.0.1:8090/`)**: Tested `index.html` at `1440×900` (`18`-card sheet: Card 12 `"Björk"` matched by `"bjork"` -> `"1 of 18"`, 17 rows collapsed cleanly via `[hidden] { display: none !important }`, Undo stack untouched, clicking Card 12 updated `#page-count-label` to `"Page 2 of 2"` and scrolled `#stage` so `page2Y` moved from `1220.5` to `207.14`, `Escape` / Clear / `"0 of 18"` unclipped empty state all verified), `390×844` mobile (`0` horizontal overflow), `theme-studio.html`, `bulk-import.html`, and `tests/title-layout.test.html` (`4` passed) with `0` console errors.

---

## Phase 9 Part B (Online Band Lookup) — Pre-Build TheAudioDB Browser Test Report

Before writing any Part B lookup UI, tested `https://www.theaudiodb.com/api/v1/json/123/search.php?s=...` directly from a real browser origin (`http://127.0.0.1:8090`), plus loaded returned media URLs from `https://r2.theaudiodb.com` and inspected TheAudioDB's documentation/terms pages (`https://www.theaudiodb.com/free_music_api` and `https://www.theaudiodb.com/docs_terms_of_use.php`).

### 1. Cross-Origin Readability (CORS for Plain GET)
- **Result: PASS (`HTTP 200`, `access-control-allow-origin: *`)**.
- All 6 plain `GET` `fetch()` calls (no custom headers) from `http://127.0.0.1:8090` succeeded cross-origin cleanly (`corsReadable: true`).
- Response headers from `www.theaudiodb.com`: `access-control-allow-origin: *`, `access-control-allow-methods: GET, PUT, POST, DELETE, OPTIONS`.

### 2. Sample Band Responses (5 Bands + 1 Nonexistent Band)
| Query | HTTP Status | `artists` count | Key fields returned (`artists[0]`) |
|---|---|---|---|
| `Radiohead` | `200` | `1` | `strArtist: "Radiohead"`, `strGenre: "Alternative Rock"`, `strStyle: "Rock/Pop"`, `strCountry: "Abingdon, England"`, `intFormedYear: "1991"`, `strLabel: "XL Recordings"`, `strArtistThumb`, `strArtistLogo`, `strArtistBanner` |
| `The Black Keys` | `200` | `1` | `strArtist: "The Black Keys"`, `strGenre: "Indie"`, `strStyle: "Rock/Pop"`, `strCountry: "Akron, Ohio, USA"`, `intFormedYear: "2001"`, `strLabel: "Fat Possum Records"` |
| `Black Sabbath` | `200` | `1` | `strArtist: "Black Sabbath"`, `strGenre: "Heavy Metal"`, `strStyle: "Metal"`, `strCountry: "Birmingham, England"`, `intFormedYear: "1969"`, `strLabel: "Vertigo"` |
| `Oasis` | `200` | `1` | `strArtist: "Oasis"`, `strGenre: "Rock"`, `strStyle: "Britpop"`, `strCountry: "Manchester, England"`, `intFormedYear: "1991"`, `strLabel: "Epic"` |
| `Muse` | `200` | `1` | `strArtist: "Muse"`, `strGenre: "Alternative Rock"`, `strStyle: "Rock/Pop"`, `strCountry: "Teignmouth, England"`, `intFormedYear: "1994"`, `strLabel: "Warner Bros. Records"` |
| `xyzzy_no_such_band_99999` | `200` | `0` (`null`) | Body is `{"artists":null}` (`artists` is `null`, not `[]`). |

- **Schema note**: `strBiographyEN` is **not** present in the returned JSON object; the English biography is stored in **`strBiography`**. Free tier strictly caps `search.php` to `1` artist (`Free Limit: 1` vs Premium `10`), which can mis-match ambiguous/common band names if the top hit isn't the intended band.

### 3. Image Load & Canvas CORS Readback (`r2.theaudiodb.com`)
- Tested returned thumb URL `https://r2.theaudiodb.com/images/media/artist/thumb/35poth1668098458.jpg` in real browser from `http://127.0.0.1:8090`:
  - **Plain `<img src=...>` (no `crossOrigin`)**: **Loaded cleanly** (`loaded: true`, `700×700`, `image/jpeg`), so SVG card previews and SVG exports render the image.
  - **Canvas pixel read on plain `<img>`**: Blocked with `SecurityError: Failed to execute 'getImageData' on 'CanvasRenderingContext2D': The canvas has been tainted by cross-origin data.`
  - **`<img crossOrigin="anonymous" src=...>`**: **Failed to load (`loaded: false`)** — `https://r2.theaudiodb.com` does **not** emit `access-control-allow-origin` headers on image responses.
- **Impact on Ticket Studio**:
  - Automatic accent sampling (`sampleImageColor()` via canvas) **cannot** sample pixel colors from `r2.theaudiodb.com` URLs; if built, `corsLimited: true` must be preserved so it gracefully keeps default/existing accent without crashing.
  - Likewise, canvas-based PNG/PDF exports (`rasterizeSvg`) cannot rasterize external `r2.theaudiodb.com` images directly (SVG export & Print work; users who need PNG/PDF raster export will still need a local photo upload or CORS-enabled image host, as warned by the existing `CORS-limited image` tag).

### 4. TheAudioDB Terms, Key `"123"`, Rate Limits, Attribution & Images
- Verified on `https://www.theaudiodb.com/free_music_api` and `https://www.theaudiodb.com/docs_terms_of_use.php`:
  - **Shared key `"123"`**: Officially documented free/test API key (`"The current free API key is: 123"`). Free API explicitly allows testing & lookup in development projects, **but states**: *"You cannot publish apps to an appstore unless you are a paid subscriber ($8/month Premium)"* — so free key `"123"` is appropriate for personal/local/open test tools, while a public consumer distribution would breach their free-key rule unless paid/attributed.
  - **Rate limit**: Free tier is **30 requests/minute** (excess returns `HTTP 429` for 1 minute); Premium = 100/min.
  - **Attribution & Image reuse**: Paid/public usage requires crediting & linking back to TheAudioDB as the data/artwork source (`"must not pass artwork off as your own and should link back to our website"`). Front-end image access allows appending `/medium` (500px) or `/small` (250px) to artwork URLs; trademarked logos must be used `"As is"`.

### 5. Owner Decision Needed Before Building Phase 9 Part B
1. **Online lookup provider & photo handling for Part B**:
   - **Option A (Recommended if single-match text lookup + optional CORS-limited photo is sufficient)**: Build Part B using **TheAudioDB v1 (key `123`)** with an explicit user-triggered lookup dialog (explicit disclosure that the typed query goes to `theaudiodb.com`, `30/min` session throttling + in-memory cache), **metadata fill first** (artist name, genre, origin, formed year), and an opt-in copyright-warned photo checkbox that sets `imgUrl` + `corsLimited: true` cleanly (falling back to default accent without canvas crash; keeping upload/URL fallback). Best if you use this app as a personal/static web tool.
   - **Option B (Multi-result pick list & appstore/public-safe metadata)**: Switch Part B's pre-build test & dialog to **MusicBrainz API** (`ws/2/artist/?query=...&fmt=json`, CC0 metadata, returns multiple ranked matches to disambiguate similar band names cleanly) + optional **Wikipedia/Wikimedia Commons** CORS-friendly images, tested the same way in-browser before building.
   - **Option C**: Skip Part B (keep Phase 9 strictly local search only) and move to **Phase 10 (Visiting card layout)**.

---

### 6. Single-Card Preview Quick Editor (`3430114`)
- Replaced `#pv`'s read-only view with an inline live editor (`.pv-body` side-by-side on desktop `920px`, flex-column stacked on mobile `<= 780px`): `#pv-title`, `#pv-genre`, `#pv-loc`, `#pv-year`, `#pv-code`, `#pv-stx`, photo upload/crop sliders (`#pv-zm`, `#pv-px`, `#pv-py`), `#pv-accent`, card `#pv-theme`/`#pv-stamp`, stamp angle/scale sliders (`#pv-srot`, `#pv-sscale`), lock/surprise/reset actions, and `"Jump to sidebar"` (`#pve`).
- Guarded `ArrowLeft`/`ArrowRight` card flipping while typing or scrubbing sliders inside `#pv`, synced `#rows` inputs cleanly, and verified live SVG updates + Undo + mobile `390×844` stacking (`#pvi` `115..486.36`, `.pv-editor` `500.36..1270.13`, `0` overflow, `0` console errors, `245` unique DOM IDs, all 7 Node tests passing in `23.8ms`).

---

## Option B — MusicBrainz & Wikipedia/Wikimedia Pre-Build Browser Test Report

Tested cross-origin from `http://127.0.0.1:8090` in real Chromium (`0` console errors):

1. **MusicBrainz v2 JSON Search (`https://musicbrainz.org/ws/2/artist/?query=artist:...&fmt=json&limit=5`, spaced `1150ms` apart)**:
   - **CORS**: `corsReadable: true` on all requests; returns rich multi-candidate disambiguation (`Nirvana`: `43` hits with `"1980s–1990s US grunge band"` vs `"60s band from the UK"`; `Muse`: `"UK rock band"` vs Japanese/French bands; `Oasis`: `"Noel & Liam Gallagher"` vs US duo/Mexican group) with `name`, `disambiguation`, `begin-area`, `area`, `country`, `life-span.begin`, top `tags[]`, and `score`.
   - **Browser `User-Agent` & `HTTP 503` constraint**: Browsers cannot override `User-Agent` in `fetch()`, placing direct static-site calls in MusicBrainz's shared **anonymous throttle pool** — **`Black Sabbath` and `xyzzy_no_such_band_99999` returned `HTTP 503`** even at `1150ms` spacing (`Radiohead`, `Nirvana`, `Oasis`, `Muse` returned `HTTP 200`). Any client implementation using MusicBrainz directly must enforce `>= 1200ms` serialized queueing, session caching, explicit retry/backoff on `503`, and clear offline/throttle feedback (with no proxy per constraints).
2. **Wikipedia REST v1 & MediaWiki Action API (`origin=*`)**:
   - **CORS & Reliability**: Returned **`HTTP 200` and `corsReadable: true`** across all calls (`en.wikipedia.org/api/rest_v1/page/summary/...` & `w/api.php?action=query&prop=pageimages|extracts&pithumbsize=600&format=json&origin=*`), with `0` `503` errors and concise band descriptions + disambiguation links.
3. **Wikimedia Commons Thumbnails (`https://thumb.wikimedia.org/...`) & Canvas Readback**:
   - Plain `<img>`: Loaded cleanly (`330×120`).
   - **`<img crossOrigin="anonymous">` + `<canvas>` `ctx.getImageData(0, 0, 1, 1)`**: **`loaded: true`, `canvasOk: true`, `pixel: [210, 179, 213, 255]`, `canvasErr: null`**. Unlike TheAudioDB (`r2.theaudiodb.com`), Wikimedia Commons allows full CORS canvas reads so automatic **accent sampling** AND **300-DPI PNG/PDF exports** work cleanly.
4. **Licensing & Attribution**:
   - MusicBrainz core metadata is **CC0** (public domain); Wikipedia/Wikimedia photos carry per-file free licenses (CC-BY-SA / Public Domain / fair-use, with attribution/right-to-use reminder shown to the user before loading).

### Ready to build Part B upon approval
- **Proposed build (`Option B1 — Recommended`)**: Use **MusicBrainz v2** (primary metadata: multi-match pick list showing Name, Disambiguation, Origin, Formed year, Genres, CC0) + **on-demand Wikipedia/Wikimedia photo lookup** for the chosen artist (CORS-safe image preview with automatic accent sampling + copyright/license notice + PNG/PDF export compatibility), backed by a serialized `1.2s` request queue, `503` backoff/retry button, in-memory cache, and fallback to **Wikipedia search** if MusicBrainz returns `503` — filling only unedited fields (`Fill this card` / `Add as new card`, each 1 Undo step). Confirm to start building!

---

## Phase 9 Part B (`19d3674`) & Corner Hardware / Fun Distress FX (`0c728b3`) Implementation (`?v=phase9b`)

- **Isolated Online Band Lookup (`band-lookup.html`, `js/band-lookup.js`, `js/band-lookup-providers.mjs`, `tests/band-lookup.test.mjs`, `19d3674`)**:
  - Created standalone `band-lookup.html` linked via a single nav tab across `index.html`, `theme-studio.html`, and `bulk-import.html` so it can be cleanly disabled/hidden (`LOOKUP_FEATURE_CONFIG.enabled`) or have providers swapped without touching the core Sheet Editor.
  - Wired MusicBrainz v2 serialized search (`>=1250ms` queue, session cache, `10s` timeout, `503`/offline recovery bar with **Retry** and **Try Wikipedia search instead**), HTML-entity decoding in Wikipedia fallback snippets, optional Wikimedia Commons thumbnail fetch + upload/URL fallbacks, explicit disclosure & copyright notices, `Add as new card to sheet`, non-overwriting `Fill selected card` (`mergeCardLookupFields`), and 1-step Undo transfer toast.
- **Corner Hardware & Fun Surface Effects (`js/corners.mjs`, `js/storage.js`, `js/svg-engine.js`, `js/card-styles.mjs`, `js/export.js`, `index.html`, `css/app.css`, `js/app.js`, `tests/corners.test.mjs`, `0c728b3`)**:
  - Replaced hardcoded 4-corner screw bolts in `renderCard()` with `renderCornerHardware()` (`bolts` preserving byte-for-byte legacy parity, `pins` Push pins, `staples` Corner staples, `rivets` Eyelet rivets, `none` Clean corners) + `#corner-hw` in **Paper & wear** and per-card `#pv-hardware` in `#pv`.
  - Added optional fun surface distress toggles (`#fx-claw` Claw marks, `#fx-tear` Corner tear, `#fx-bullet` Bullet hole, `#fx-blood` Blood spatter) rendered cleanly across standard, minimal, and Polaroid cards with 1-step Undo/Redo and JSON export/import persistence.
- **Verification**:
  - Added `wrapToTwoLines()` and `subtitleLayout()` in `js/svg-engine.js` so long `Genre // Place` subtitles wrap cleanly onto 2 readable lines (`y=213.0` & `221.0` on standard tickets, `minimalSubY` & `+7.5` on Minimal cards, preferring clean breaks after `//` when both parts fit) while keeping short subtitles identical (`561d0d2`, `?v=phase9c`). Expanded `tests/title-layout.test.html` to `7` checks and verified in browser (`"Passed 7 card title layout checks."`, long subtitle rendered at `font-size="4.8"` across 2 lines, `#lookup-recovery` cleanly hidden on `band-lookup.html`, `0` console errors) alongside all `9` Node unit test suites.
  - Built standalone **Album Lookup** workspace (`album-lookup.html`, `js/album-lookup.js`, `js/album-lookup-providers.mjs`, `tests/album-lookup.test.mjs`, `1b99442`, `?v=phase9d`) per Option 2 (skipping any 3rd-studio-album ordinal lookup per owner instruction) and wired `kind: "album"` card rendering in `js/svg-engine.js` (Album Name headline, clean Artist Name subtitle without `"Genre //"` prefix, `EST. <Year>` & left-border `NO. <Year>-<Abbr>`, `"ALBUM PASS"` tag) + JSON export/import round-trip (`js/export.js`, `js/app.js`). Verified MusicBrainz `OK Computer` + `Radiohead` (`5` candidates), CORS-safe Cover Art Archive `thumb500.jpg` + sampled accent `#3b9bce`, live SVG preview & direct SVG/PNG export, Undo/sheet transfer onto `index.html`, all `10` Node test suites (`25.6 ms`), `git diff --check`, and 5-page desktop + `390×844` browser QA (`0` console errors, `0` horizontal overflow).
  - **Follow-up UX polish (`?v=phase9e`, `662bbae`, `31b8eb2`)**: Updated album abbreviations everywhere to derive from the band/artist (`artistName` / `loc`) instead of album title (`"OK Computer"` by `"Radiohead"` -> `RADI`, typing `"Pink Floyd"` -> `PINK`); added `#nfc-yt` (`With YT Music logo` toggle -> `.nfc-only` mode) and `#nfc-scale` (`50%`–`200%` NFC logo size slider) via `renderNfcBadge()` + `SET0`; added 1-step undoable `removeCardPhoto()` in both sidebar card rows (`.row-remove-photo`) and Single Card View (`#pv-photo-remove`); wired `#pv-drag-photo` and `#pv-move-stamps` directly into `#pv` via shared `bindCardStageInteractions()`; and (`31b8eb2`) added scroll-to-zoom (`wheel`), trackpad pinch (`ctrlKey` + `wheel`), and touchscreen two-finger pinch-to-zoom (`activePpPointers` / `pinchState`) over `.pp` whenever photo drag is active, syncing zoom live with `[data-adjust='zm']` / `#pv-zm` and 1-step coalesced undo.

---

## Phase 10 Step 1 — Visiting Card Layout Design Proposal (Awaiting Approval)

### 1. Card Dimensions, Orientation Toggle & Real Sheet Packing Math
- **Card Size Selector (`#csize`) + Orientation Toggle (`#corient`)**:
  - Keep existing 5 legacy keys untouched at their current values (`ticket`, `poker`, `credit`, `mini`, `tarot`) so existing sheets and exports remain byte-for-byte identical.
  - Append a `"Visiting Cards"` `<optgroup>` to `#csize` (`index.html` Page accordion + `SIZES` in `js/svg-engine.js`):
    - `vc_eu`: **Visiting Card EU** — `85 × 55 mm` (`[85, 55]`)
    - `vc_us`: **Visiting Card US** — `89 × 51 mm` (`[89, 51]`, `3.5 × 2 in`)
    - `vc_90`: **Visiting Card Wide** — `90 × 50 mm` (`[90, 50]`)
  - Pair `#csize` with an **Orientation** control (`#corient` -> optional `settings.cardOrientation`: `"landscape"` default | `"portrait"`, defaulting cleanly to `"landscape"` for older sheets or when first selecting any `vc_*` size; hidden/ignored when any legacy size is active).
- **Layout Engine Fix (`computeLayout(paperVal, csizeVal, orientation)` in `js/svg-engine.js`)**:
  - Legacy branch unchanged (`CH = Math.max(204, Math.min(309, Math.round(S[1] * 2.83465 / K * 10) / 10))`).
  - Visiting branch (`isVisiting = /^vc_/.test(csizeVal)`): swap `[wMm, hMm]` when `orientation === "portrait"`, compute `K = wMm * 2.83465 / CW` (`CW = 170`), and compute proportional internal height **without** the `204` clamp (`CH = Math.round(hMm * 2.83465 / K * 10) / 10`).
  - Real cards-per-page counts (`GX = 22 pt`, `GY = 20 pt`; adjacent `3 mm` bleed = `17.01 pt < 20 pt` so neighbouring bleeds never overlap):

| Size | Orient. | `CW × CH` (SVG) | A4 (`210×297 mm`) Grid & Margins | US Letter (`8.5×11 in`) Grid & Margins |
|---|---|---:|---|---|
| `85 × 55 mm` (`vc_eu`) | Landscape | `170 × 110.0` | **2×4 = 8/page** (`MX=45.7pt, MY=79.1pt`) | **2×4 = 8/page** (`MX=54.1pt, MY=54.2pt`) |
| `55 × 85 mm` (`vc_eu`) | Portrait | `170 × 262.7` | **3×3 = 9/page** (`MX=41.8pt, MY=39.5pt`) | **3×3 = 9/page** (`MX=50.1pt, MY=14.6pt`*) |
| `89 × 51 mm` (`vc_us`) | Landscape | `170 × 97.4` | **2×5 = 10/page** (`MX=34.4pt, MY=19.5pt`) | **2×4 = 8/page** (`MX=42.7pt, MY=76.9pt`) |
| `51 × 89 mm` (`vc_us`) | Portrait | `170 × 296.7` | **3×3 = 9/page** (`MX=58.8pt, MY=22.5pt`) | **3×2 = 6/page** (`MX=67.1pt, MY=133.7pt`) |
| `90 × 50 mm` (`vc_90`) | Landscape | `170 × 94.4` | **2×5 = 10/page** (`MX=31.5pt, MY=26.6pt`) | **2×4 = 8/page** (`MX=39.9pt, MY=82.5pt`) |
| `50 × 90 mm` (`vc_90`) | Portrait | `170 × 306.0` | **3×3 = 9/page** (`MX=63.0pt, MY=18.3pt`) | **3×2 = 6/page** (`MX=71.4pt, MY=130.9pt`) |

  - *Crop/bleed margin note*: On US Letter `55 × 85 mm` Portrait (`MY = 14.6 pt`), tightening portrait vertical gutter `GY` slightly (from `20` to `16 pt` when `MY < 18 pt`, yielding `MY = 18.6 pt`, while keeping inter-card vertical bleed `17.01 pt` clear at `>= 17.5 pt` or trimming outer tick to `5 pt`) keeps every 3 mm bleed (`8.5 pt`) and outer crop mark (`7 pt`) cleanly inside physical paper edges.
  - Also update `previewSvg()` (`app.js`), `tplSvg()`, and `cutSvg()` (`svg-engine.js`) to read `lay.CH` instead of clamping to `204` or assuming the `17×16×136` ticket photo cutout.

### 2. Backward-Compatible Content Fields & Card Data Mapping
- Add **optional fields only** on per-card records (omitted when blank so existing saved sheets, Theme Studio, Band/Album Lookup, and `DEFAULT_CARDS` are unaffected):
  - **Name**: reuses `card.title` (preserves row labels `Card N · <Name>`, `#card-search`, `titleFont`, `titleScale`, `centerTitle`, and undo).
  - **Job title**: optional `card.role` (when empty in visiting mode, gracefully falls back to `card.genre` so switching an existing concert deck to visiting preview shows non-empty preview text without mutating saved data).
  - **Company**: optional `card.company` (falls back to `card.loc` if previewing a legacy card).
  - **Phone / Email / Website / Address**: optional `card.phone`, `card.email`, `card.website`, `card.address`.
  - **QR / NFC icon**: reuses existing `nfc` / `nfcWithYt` / `nfcScale` plus optional `settings.vcBadge` (`"qr-nfc"` | `"nfc"` | `"qr"` | `"none"`) and optional per-card `card.qrText` (defaulting cleanly to `website`, `email`, or minimal `BEGIN:VCARD` payload rendered as an inline zero-dependency pure-JS SVG QR matrix inside the card).
  - **Logo or Photo**: reuses `card.img` / `card.imgUrl` / `zm` / `px` / `py` with `fitBox()` cover-style fitting (`xMidYMid slice`, zero stretching), optional rounded frame, drag + scroll/pinch zoom (`#drag`), and `Remove photo`.
- Sidebar Card Row & `#pv` Quick Editor: show the visiting-card field set (`Full name`, `Job title`, `Company`, `Phone`, `Email`, `Website`, `Address`, `QR value`) cleanly when a `vc_*` card size is active (and show Band/Album fields when any non-visiting size is active), backed by the same copy-on-write `updateCard()` + coalesced `History` path.

### 3. Shared Renderer & Full Feature Reuse (No Forked Copy)
- Implement visiting layout inside the existing `renderCard(c0, i, cfg)` function (`js/svg-engine.js`) via a dedicated geometry branch triggered strictly when `cfg.lay?.isVisiting` is true:
  - **Landscape (`CH ≈ 94.4–110.0`)**: Two-zone horizontal card — square/compact framed Logo or Photo slot (`PS ≈ 44–50`, cover-fitted via `fitBox()`, draggable `.pp`) + optional subtle mount, bold **Name** (`titleLayout()`), **Job title / Company** (`subtitleLayout()`), left-aligned auto-fitted contact lines (**Phone**, **Email**, **Website**, **Address** using `fit()` + 2-line wrap on long URLs/addresses), and bottom-right **NFC / QR badge**.
  - **Portrait (`CH ≈ 262.7–306.0`)**: Clean two-tier vertical layout — upper centered/framed **Logo or Photo** (`PS ≈ 88`), **Name** + **Job title / Company**, lower contact stack, and bottom-right **NFC / QR badge**.
- Automatically inherits the full Phase 4–9 stack because it runs inside `renderCard()`'s shared theme/border/stamp/wear pipeline:
  - All Themes, `Quick colours`, and linear/radial/triple/4-stop Gradients (`renderGradDef`).
  - All 16 `titleFont` choices + `titleScale` + `centerTitle`.
  - All 16 Phase 6 Borders (`renderBorder`, customisation, presets, card overrides, `borderWear`).
  - All 34+ Phase 7 Draggable Stamps (`resolveStampTransform` parameterized with dynamic `CH`, `.st-ui` handles, `Move stamps`, snap, arrow nudges, rotary dial, presets).
  - Phase 8 per-card styling overrides, `Keep this one` locks, and seeded `Surprise me` (`randomiser.mjs` updated so `pickSafeStampNorm` respects visiting landscape `CH` bounds cleanly).
  - Surface wear (`grain`, `edgeWear`, `creases`, `scuffs`), Corner Hardware (`renderCornerHardware`), Distress FX (`renderSurfaceFx`), `3 mm` bleed clip `ck${i}`, crop marks, `History` undo/redo, SVG/PNG/PDF exports, and `@media print`.
- **Optional Back Side**: Propose as a **separate follow-up (`Phase 10B`)** after single-sided front layouts + exports pass verification, since double-sided duplex print pairing doubles pagination and alignment complexity.

### 4. Bulk Import, Samples, Effort & Risk
- **Bulk Import (`js/bulk-import.js`) & JSON Import/Export (`js/app.js`, `js/export.js`)**:
  - Parse optional visiting columns case-insensitively in CSV and JSON (`role`/`jobTitle`, `company`/`org`, `phone`/`tel`, `email`, `website`/`web`, `address`/`addr`, `qrText`, `kind`), storing only non-empty optional values and safely ignoring missing columns for regular band/album sheets.
- **Sample Visiting Cards (Step 3)**: Add 3 dedicated visiting-card samples accessible via a `"Load visiting samples"` button (or preset pack alongside `#smp`) without altering `SAMPLE_CARDS` / `.baseline/` band sheet defaults.
- **Effort**: **L** (~2 increments: Step 2 core layout/renderer/QR/editor/stamps; Step 3 samples, Bulk Import, SVG/PDF physical measurement & cross-browser verification).
- **Key Risks & Mitigations**:
  1. *Dynamic `CH < 204` assumptions*: Several helpers (`stamps.mjs` `autoStampGeometry` / `snapStampNorm`, `randomiser.mjs` `pickSafeStampNorm`, `app.js` `previewSvg` / `getCardPhotoGeometry`) currently use `D = CH - 239` or clamp `CH >= 204`. Guard/parameterize these with `isVisiting` / `photoRect` so stamps and photos never jump out of landscape bounds.
  2. *US Letter `55 × 85 mm` Portrait outer crop clearance (`MY = 14.6 pt`)*: Adjust outer crop mark tick or `GY` (`>= 17.5 pt` clearance) specifically for visiting portrait packing so `3 mm` bleed + crop marks never clip page margins.
  3. *Text collision at 50–51 mm width*: Strictly bound every contact row via `fit()` + `wrapToTwoLines()` and add automated layout assertions in `tests/title-layout.test.html` and a new `tests/visiting-layout.test.mjs`.
  4. *Legacy regression parity*: Add an explicit automated check verifying SVG output for all 5 legacy sizes (`ticket`, `poker`, `credit`, `mini`, `tarot`) remains 100% unchanged.

### 5. Owner-Approved Addition — Optional Mirrored Card Back (All Card Sizes)
- **Scope**: Applies to **all card sizes** (Ticket, Poker, Credit, Mini, Tarot, AND Visiting Cards), toggled cleanly via an optional Page setting (`settings.cardBack`, default `false` — no change to existing sheets/exports when off).
- **Duplex Mirrored Interleaving**: When enabled, each front sheet page `P` is followed immediately by its mirrored back page (`Page 1 Front`, `Page 1 Back`, `Page 2 Front`, `Page 2 Back`, …) in `#sheets`, Print, SVG, PNG, and PDF exports:
  - Physical column position mirrors horizontally (`x_back = W - x_front - CWp`, i.e., `col_back = (COLS - 1) - col`) so even partial final pages align slot-for-slot behind each front card on two-sided printing, with matching `3 mm` bleed and crop/reg marks.
- **Trading-Card Uniform Back Design**:
  - Consistent sheet-wide look for the active theme (or page theme) — **never uses per-card sampled `card.accent` or per-card random theme/border variations** so all card backs on a sheet/theme look identical from behind.
  - Retains the sheet/page theme's paper background/gradient, surface grain/wear/creases/scuffs, and border style, rendered with consistent uniform theme colours (`theme.fixed || theme.frame || theme.ink`, never per-card accent bleed).
  - Features the selected sheet **stamp** cleanly rendered as a centered centerpiece emblem (`(CW / 2, CH / 2)`), **slightly rotated**, with **no ink wear/bleed (`wear = 0`)** so it reads like a crisp trading-card logo.

---

## Queued Before Phase 10 — Export Priority & Copyable Per-Page SVG Code (`P9-03`)
- **Primary Download = PDF (300 dpi)**: Promote `#pdf` (`Export PDF (300 dpi)`) to the primary `.accent` button in `.topbar-actions` and wire `#mobile-export` (`Export PDF`) to `#pdf`. Keep in mind `CLAUDE.md` target layout note updating SVG -> PDF primary CTA while preserving existing export functions (`exportPdf`, `exportAllSvgs`, `serializeSheetSvg`).
- **SVG as Advanced Option**: Rename `.export-menu > summary` to `Advanced` and place `#svg` (`Vector SVG (files)`), `#svg-code-open` (`Copy SVG code (pages)`), `#png` (`PNG (300 dpi)`), and `#cut` (`Cutter SVG`) inside its `.menu-panel`.
- **Copyable Per-Page SVG Code Dialog (`#svg-code-dialog`)**:
  - Iterate over rendered `#sheets .sheet` pages (including `Cut Template` if enabled) and display each page's standalone SVG (from `serializeSheetSvg`, plus an optional toggle to include/exclude the embedded ~208 KB `@font-face` `FONTCSS` block for readability) inside a readonly `<textarea>` block with byte/KB count and a 1-click `Copy SVG` button (using `duplicate` icon from `js/icons.mjs`, clipboard copy + select fallback).

---

## Phase 10 & Border Additions Verification Summary (`?v=phase10`)
- **`P9-03` Export Priority & SVG Code Dialog (`6ea940f`)**: Verified `#pdf` primary button, `#mobile-export` ("Export PDF"), `Advanced` dropdown (`#svg`, `#svg-code-open`, `#png`, `#cut`), and `#svg-code-dialog` per-page copyable SVG `<textarea>` blocks + `#svg-code-fonts` toggle (`312,200` -> `104,678` chars stripped); refined `@media (max-width: 520px)` `.export-menu > summary` width/padding so `"Advanced"` displays cleanly.
- **2 Border Reference Styles (`2dd7072`)**: Decoded uploaded reference photos (`20261126_130121.heic` & `20261126_130125.heic`), implemented `16` `Lattice knot` and `17` `Key fret` cleanly in `js/borders.mjs` without altering `0..15` (`0..4` legacy fast-path byte-identical), wired `BORDER_POOLS` in `js/randomiser.mjs`, and verified 18 live border swatches with 0 `NaN`.
- **Photo Removal & Wheel/Pinch Zoom Confirmation**: Verified uploaded and URL-loaded photo removal works in both sidebar card rows (`.row-remove-photo`) and Single Card View (`#pv-photo-remove`), and verified wheel-to-zoom (`deltaY: -120` shifted `#pv-zm` `100% -> 130%` on `#pvi .pp`).
- **Visiting Card Layout (`vc_eu` `85×55`, `vc_us` `89×51`, `vc_90` `90×50`), Physical Measurements & Mirrored Card Backs**:
  - Measured SVG physical card dimensions on rendered sheets: legacy `ticket` = `59.97 × 84.31 mm` (unchanged); `vc_eu` landscape = `85.00 × 55.00 mm` (A4 `8/pg`), `vc_eu` portrait = `55.00 × 84.99 mm` (A4 `9/pg`, Letter `9/pg` with crop marks inside `[35.22..576.78, 2.1..789.9]`), `vc_us` landscape = `89.00 × 50.99 mm` (A4 `10/pg`, Letter `8/pg`), `vc_90` landscape = `90.00 × 49.98 mm` (A4 `10/pg`).
  - Enabled `#card-back` (`renderCardBack`): confirmed `.sheet.sheet-back` interleaved right after front sheets, measured exact horizontal mirroring (`x_back + CWp + x_front === 595.275` on A4 `595.276`, `-0.001 pt` delta), and confirmed identical uniform theme border/stamp colors across cards with differing custom accents (`#ff0000` vs `#00aaff`).
  - Verified `#smp-visiting` 3 samples, `#surprise-all` on visiting cards, CSV import via `bulk-import.html` -> `index.html`, `tests/title-layout.test.html` (`7` passed), `tests/phase10.test.mjs`, all `11` Node test suites, `390×844` mobile zero overflow, and `0` console errors across all 5 pages.
- **Follow-up Polish (`?v=phase10b`)**:
  - **Single Card Editor (`#pv`) Border & Hardware**: Added per-card `#pv-border-style`, `#pv-border-color-mode`, `#pv-border-color`, `#pv-border-pattern`, `#pv-border-corner`, `#pv-border-corner-size`, `#pv-border-ornament`, `#pv-border-width`, `#pv-border-inset`, `#pv-border-wear`, `#pv-border-inner`, `#pv-border-reset`, `[data-pv-mount]` (reusing shared `applyMountCheckboxRule`), `#pv-mounts-reset`, distress marks (`#pv-fx-claw`, `#pv-fx-tear`, `#pv-fx-bullet`, `#pv-fx-blood`), and `#pv-fx-reset` alongside `#pv-hardware`. Verified `#pvi svg` live updates and reset controls (`0 NaN`).
  - **Prominently Larger Card Back Stamp**: Doubled `centerScale` in `renderCardBack` (`[1.45, 2.85]`, `Math.min(CW, CH) * 0.0162`) with clean vector `wear = 0`, `opacity = 1`. Verified `scale(2.75)` (`95.77 × 95.77` bbox) on `ticket` (`170×239`) and `scale(1.78)` (`87.86 × 87.86` bbox) on `vc_eu` (`85×55`).
  - **Scroll-to-Page Dropdown Sync**: Added rAF-throttled `#stage` / `window` scroll-spy (`detectVisibleStagePage`, `markActiveSheetClass`, programmatic scroll guard) syncing `#page-select`, `#page-count-label`, `#page-theme`, `#delete-page`, and `.sheet.is-active-page` across front and back sheets. Browser-verified Page 2 theme override, `#duplicate-page`, and `#delete-page` after scrolling.

---

## Parked Follow-Up Note (Waiting for User to Resume)
- **Alternative / Improved Music Search API Option**:
  - Reference: `https://gist.github.com/0xdevalias/eba698730024674ecae7f43f4c650096` (*A collection of music APIs, databases, and related tools*).
  - **Status**: Noted only — do not implement until the user returns and asks to continue. Goal will be to add a better API option from that list (CORS-friendly / fast discography & artist/album search + cover art for browser usage without strict ~1 req/sec 503 throttling) to the lookup modes.

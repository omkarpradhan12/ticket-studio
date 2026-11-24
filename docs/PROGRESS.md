# Progress

## Resume status
- Current branch: `ui-overhaul`
- Current phase: Phase 4 - visual system and icon work complete
- Next approval: owner approval before Phase 5 Theme Studio work.

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
| P1-03 | Reproduce and fix B1 long titles | M | medium | done | - | Reproduced in browser at 1440px; added deterministic two-line title layout with shrinking and exported-SVG-compatible string output |
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
| P1-14 | Fix B12 unsaved-changes warning | M | medium | todo | - | |
| P1-15 | Fix B13 Theme Studio live status | S | low | todo | - | |
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
| P5-01 | Theme Studio gallery | L | high | todo | - | |
| P5-02 | Theme side/bottom panel and custom actions | L | medium | todo | - | |
| P6-01 | Customisable borders | L | high | todo | - | |
| P6-02 | Preserve old border render values | L | high | todo | - | |
| P7-01 | Per-card stamp position | L | high | todo | - | |
| P7-02 | Stamp drag hit-test/touch/export/undo | L | high | todo | - | |
| P8-01 | Per-card Surprise me style overrides | L | high | todo | - | |
| P8-02 | Surprise every card / one undo step | M | high | todo | - | |
| P9-01 | Band search and match count | M | medium | todo | - | |
| P10-01 | Visiting card layout | L | high | todo | - | |

## Known issue disposition
- Phase 3 verified and addressed B4, B5, B14, and U1-U8 at desktop and 390px. U6's Surprise me/search controls are intentionally disabled placeholders for Phases 8-9.
- Phase 4 addressed U9, U10, U12-U16. U11 is not an issue: the current muted token already passes 4.5:1 on sampled surfaces. Theme Studio draft-scoped undo remains a Phase 5 item.
- Other audited issues remain at their table status; do not treat source-only observations as reproduced defects.

## Phase dependencies and decisions
- Phase 2 is complete: `studioState` and the generic history module are in place. Later phases should add optional fields to canonical settings/card records and keep updates copy-on-write.
- Phases 7-8 need optional per-card style/position fields. New fields must be optional and existing cards must use current global defaults when absent.
- Phase 6 is export-sensitive and requires baseline comparison for every existing border value across every card size.
- Phase 7 is export-sensitive because stamp positions must serialize and render identically in preview, SVG, PNG, PDF and print.
- Phase 10 is layout-sensitive and needs explicit dimensions/count approval before implementation if current sheet packing assumptions cannot support it.

## Open decisions for later phases
- For B12, should switching themes/pages/navigation warn only for Theme Studio drafts or also unsaved Sheet Editor changes?
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
- Every rendered color picker has a paired `#RRGGBB` text field with live synchronization and inline validation. Sheet Editor hex edits flow through the existing color input events and undo history. Theme Studio draft-scoped app undo remains planned for Phase 5; Bulk Upload staging remains local until transfer.
- Muted text `#9a928c` contrast against sampled dark surfaces: `#141211` 6.11:1, `#1f1c1a` 5.54:1, `#181614` 5.90:1, `#0c0b0a` 6.43:1, `#121210` 6.13:1, `#1d1b18` 5.62:1, `#23211d` 5.25:1, `#151412` 6.02:1, and `#0d0c0b` 6.39:1. Minimum is 5.25:1, so U11 required no color adjustment.
- Browser verification at 1440px and 390px: all three pages loaded without observed console errors or horizontal overflow; every rendered color picker had a hex partner; all icons hydrated; no legacy stylesheet links or `title` tooltips remained. Verified invalid hex handling, editor hex undo/restore, Theme Studio preview synchronization and gradient visibility, Bulk Upload staged hex changes, tap and keyboard disclosure behavior, and visible keyboard focus.
- The default rendered-card inner-markup SHA-256 still matches the pre-change value `02fa9ed895dbd65ee64f56bb0f1432cc2d7e3095309012832cebb382f8f53c1b` (89,403 JavaScript characters). No pre-change `.baseline/` SVG/PNG/PDF exports exist, so exact file and printer parity remain unverified.
- Validation: `node tests/color-controls.test.mjs`, module syntax checks, and `git diff --check` passed.

## Manual approval and remaining checks
- Owner approved Phase 3 before implementation; it is complete.
- The Bulk Upload transfer behavior was selected by the owner: stay on Bulk Upload and show Undo/Open Editor actions.
- Manual export/printer parity remains unverified because no pre-change `.baseline/` exports are available.
- Phase 4 is complete; wait for owner approval before Phase 5. Theme Studio draft-scoped undo is intentionally deferred to that phase.

### Approval gate
- Design approved by the owner before implementation.
- No local history persistence is proposed.
- The Phase 3 editable title is persisted in the optional settings field; no existing sheet/theme payload was otherwise changed.

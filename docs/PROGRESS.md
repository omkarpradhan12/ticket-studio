# Progress

## Resume status
- Current branch: `ui-overhaul`
- Current phase: Phase 7 (draggable stamps) & extra photo mounts — Step 1 design written, awaiting owner approval
- Next approval: owner approval of the Phase 7 + photo mount design below before Step 2 implementation.

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
| P7-01 | Per-card stamp position | L | high | todo | - | Step 1 design written; awaiting owner approval |
| P7-02 | Stamp drag hit-test/touch/export/undo | L | high | todo | - | |
| P8-01 | Per-card Surprise me style overrides | L | high | todo | - | |
| P8-02 | Surprise every card / one undo step | M | high | todo | - | |
| P9-01 | Band search and match count | M | medium | todo | - | |
| P10-01 | Visiting card layout | L | high | todo | - | |

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

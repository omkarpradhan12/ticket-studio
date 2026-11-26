# CLAUDE.md

## Session rules
- Work on branch `ui-overhaul`. Never work on `main`.
- If the working tree is dirty before any task, stop and tell the owner first.
- Update `CLAUDE.md`, `docs/AUDIT.md`, and `docs/PROGRESS.md` after every task.
- At the start of every session, read `CLAUDE.md`, `docs/PROGRESS.md`, and `docs/AUDIT.md`, then resume from the first unfinished task. Never redo finished work.
- Work one phase at a time. At the end of each phase give a short summary (what changed, files touched, risks), then stop and wait for approval.
- Make small commits, one concern each, with clear commit messages.
- No new frameworks, bundlers, or runtime dependencies. A dev-only screenshot tool such as Playwright is allowed only after approval.
- Keep the visual identity: dark UI, orange accent, uppercase section headers, and existing card art. Do not redesign existing cards.
- If an implementation choice could affect saved data or exports, ask for a plain 2-3 option decision. Never guess.
- Verify each issue by reproducing it at real size. Some issue reports may be screenshot artifacts or may already be correct. If it does not reproduce, mark it `not an issue` and do not change it.
- Do not change year or `EST.` display logic.

## Target layout
### Sheet Editor, desktop
- Top bar: logo and `Ticket Card Studio`, Sheet Editor / Theme Studio / Bulk Upload tabs, Undo, Redo, secondary Print, primary Export, and overflow menu.
- Left sidebar about 380px: editable sheet title, grouped accordions for Page, Paper & wear, Theme & colours, Borders, Card & photo, and Stamps.
- Cards header and search, then compact rows with per-page end dividers; only the selected card expands.
- Preview has a slim page/theme/duplicate/delete/Move stamps/zoom toolbar and one scroll container.

### Theme Studio
- Live theme tile gallery, built-ins first and saved themes after, with custom badge and New Theme.
- Clicking a tile opens a preview and palette panel. Custom themes support Update, Duplicate, and Delete.

### Phone, 390px
- Header menu, `Edit | Preview` segmented toggle, grouped accordions with 44px targets, sticky bottom Print/Export, and undo/redo without scrolling.

## Safety rails
- Never change the saved-data format in a way that breaks existing sheets or themes. Put new values in optional fields or appended values only.
- Do not change existing renderer output for existing sizes, themes, border styles, stamps, or settings except for the explicitly owner-approved title-scale setting below. Print, SVG, PNG, and PDF output must remain identical for otherwise unchanged input.
- Before the first Phase 1 code change, run the app locally, export a sample sheet in every available format, and store copies in git-ignored `.baseline/`.
- State migration must be backward compatible; stop and ask before any migration that is not clearly reversible.
- Sheet Editor undo/redo history is in memory only and clears on reload; saved sheet data continues to autosave independently.
- The editable Sheet Editor title is stored in the optional `settings.sheetTitle` field; older sheets use the default title.
- The owner approved an optional `settings.titleScale` control (70-100%, default 85%) to reduce long card titles. This intentionally changes title sizing in preview and exports; older sheets inherit the default. Do not change year or `EST.` display logic.
- Sheet Editor state is centralized in `studioState`; card records and arrays use copy-on-write updates so history snapshots can share unchanged photos safely.
- Bulk Upload commits now stay on that page until the user chooses Undo or Open Editor; its single transfer undo is memory-only and expires on leave/reload.
- The Phase 4 visual system uses `css/tokens.css` plus layered `css/app.css`; keep local CSS, scripts, modules, and the favicon on the same `?v=` cache version.
- Use the shared `js/icons.mjs` SVG set for interface icons. Icon-only controls need accessible labels and hover, focus, and tap tooltips; retain card-art glyphs and renderer output.
- Pair every color picker with a validated hex field. Sheet Editor hex edits must use the existing history/autosave path.
- Theme Studio themes remain palette-only; do not add gradient angle or spread to the saved theme schema. Its draft history is in-memory only and resets when switching themes or reloading.
- The Sheet Editor injects its embedded font faces before the first full-sheet render so on-page SVG text matches the individual-card preview; keep exported SVG markup unchanged.

## Verification checklist
1. Load all three pages with no console errors.
2. Change every Sheet Editor control group and confirm live preview behavior remains correct.
3. Export every format and compare against `.baseline/` for unchanged input.
4. Save/reload a sheet and confirm old saved sheets and themes load.
5. Create, edit, duplicate, delete, import, and export themes.
6. Confirm Bulk Import still works.
7. Confirm no horizontal scroll or unreachable controls at 390px.
8. Confirm keyboard tab/focus behavior on every page.
9. Confirm Tarot photo framing without distortion and unchanged Ticket output.
10. Confirm print media shows only sheet pages, every page, true size, crop marks, bleed, and backgrounds with no blank last page.
11. Confirm undo/redo for all mutations and coalescing once Phase 2 is complete.
12. Confirm border combinations in preview and every export once Phase 6 is complete.
13. Confirm stamp drag persistence, export parity, and undo once Phase 7 is complete.
14. Confirm Surprise me changes styling only and is one undo step.
15. Confirm band search is non-destructive and outside history/export/layout.
16. Confirm the visiting-card layout, borders, stamps, print, and exports once Phase 10 is complete.
17. Update `docs/PROGRESS.md` and commit. Explicitly list anything needing manual approval.

## Phase status
- Phase 4 visual-system, accessibility, icon, and color-control work is complete on `ui-overhaul`.
- Phase 5 Theme Studio gallery, palette editor, draft history, and unsaved-change safeguards are complete on `ui-overhaul`.
- Phase 6 customisable borders (16 styles, Customise fold, presets, per-card overrides, scoped SVG defs, `?v=phase6`) are complete on `ui-overhaul`.
- Phase 7 draggable stamps (per-card `stampPos`/`stamp2Pos`, rotary dial, `Move stamps` mode, strict card-boundary clamping, `44px+` touch targets, copy/reset actions), 5 extra photo mounts (`4..8`), visual stamp picker (33 swatches + `Customise` fold + presets), and the Tarot title double-`D` fix are complete on `ui-overhaul`.
- Phase 8 ("Surprise me" per-card seeded randomisation with WCAG contrast & stamp/print guard rails, scope/strength dialog, per-card lock & custom indicators, 300-card cap, lazy 200-card row optimization, 1-step undo/redo, and `?v=phase8`) is complete on `ui-overhaul`.
- Phase 9 Part A (local card search, `tests/search.test.mjs`), Preview quick editor & sliders (`3430114`), Phase 9 Part B isolated **Band Lookup** (`band-lookup.html`, `19d3674`), **Corner hardware & fun distress marks** (`js/corners.mjs`, `0c728b3`), 2-line `Genre // Place` wrapping (`561d0d2`), and standalone **Album Lookup** (`album-lookup.html` + `js/album-lookup.js` + `js/album-lookup-providers.mjs` + `kind: "album"` card rendering & `tests/album-lookup.test.mjs`, `1b99442`, `?v=phase9d`) are complete on `ui-overhaul`.
- Next up: Phase 10 Step 1 (Visiting card layout design proposal in `docs/PROGRESS.md`) awaiting owner approval before Step 2 implementation.

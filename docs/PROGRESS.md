# Progress

## Resume status
- Current branch: `ui-overhaul`
- Current phase: 0 - Audit and planning
- Next approval: owner to approve proceeding into Phase 1.

## Task conventions
- Status values: `todo`, `in_progress`, `done`, `blocked`, `not an issue`.
- Risk values: `low`, `medium`, `high`.
- Effort values: `S`, `M`, `L`.

## Phase checklist

| ID | Phase/task | Effort | Risk | Status | Commit | Notes |
|---|---|---:|---|---|---|---|
| P0-01 | Create `ui-overhaul` branch | S | low | done | - | Working tree was clean before branch creation |
| P0-02 | Write `CLAUDE.md` | S | low | done | - | Rules, layout, safety, verification |
| P0-03 | Write architecture/control audit | L | medium | done | - | Source audit complete; screenshots pending approval |
| P0-04 | Write progress checklist | M | low | done | - | |
| P1-01 | Baseline app and screenshot setup | M | medium | todo | - | Do not change app code until approval |
| P1-02 | Store baseline exports in `.baseline/` | M | high | todo | - | SVG, PNG, PDF, cutter/print as available |
| P1-03 | Reproduce and fix B1 long titles | M | medium | done | - | Reproduced in browser at 1440px; added deterministic two-line title layout with shrinking and exported-SVG-compatible string output |
| P1-04 | Fix B2 dynamic cards/page subtitle | S | low | todo | - | |
| P1-05 | Fix B3 Section 1 label layout | S | low | todo | - | |
| P1-06 | Fix B4 card row crowding and reset/delete actions | M | medium | todo | - | |
| P1-07 | Fix B5 card list input truncation | S | low | todo | - | |
| P1-08 | Verify/fix B6 photo aspect ratios | M | high | todo | - | Ticket baseline must remain unchanged |
| P1-09 | Verify/fix B7 print behavior | L | high | todo | - | Verify every page, true size, blank page |
| P1-10 | Fix B8 saved-theme cloning | M | medium | todo | - | |
| P1-11 | Fix B9 saved-theme delete refresh/confirmation | S | medium | todo | - | |
| P1-12 | Fix B10 theme save/duplicate names | M | medium | todo | - | Ask before changing name semantics |
| P1-13 | Fix B11 theme import validation | M | medium | todo | - | |
| P1-14 | Fix B12 unsaved-changes warning | M | medium | todo | - | |
| P1-15 | Fix B13 Theme Studio live status | S | low | todo | - | |
| P1-16 | Fix B14 gradient dial disabled state | S | low | todo | - | |
| P1-17 | Verify UI issue U1 duplicate headings | S | low | todo | - | |
| P1-18 | Verify UI issue U2 section grouping | M | medium | todo | - | |
| P1-19 | Verify UI issue U3 export prominence | S | low | todo | - | |
| P1-20 | Verify UI issue U4 destructive confirmation/undo styling | M | medium | todo | - | |
| P1-21 | Verify UI issue U5 duplicate entry points | S | low | todo | - | |
| P1-22 | Verify UI issue U6 long card list | M | medium | todo | - | |
| P1-23 | Verify UI issue U7 preview toolbar/scroll | M | medium | todo | - | |
| P1-24 | Verify UI issue U8 checkbox/paper swatch cluster | S | low | todo | - | |
| P1-25 | Verify UI issue U9 jargon/help | M | low | todo | - | |
| P1-26 | Verify UI issue U10 uppercase/letter spacing | S | low | todo | - | |
| P1-27 | Verify UI issue U11 muted contrast | S | medium | todo | - | |
| P1-28 | Verify UI issue U12 accordion arrows | S | low | todo | - | |
| P1-29 | Verify UI issue U13 icons | M | medium | todo | - | |
| P1-30 | Verify UI issue U14 Ink/Text terminology | S | low | todo | - | |
| P1-31 | Consolidate U15 CSS/inline/cache issues | L | medium | todo | - | Preserve behavior |
| P1-32 | Verify UI issue U16 hex fields for pickers | M | medium | todo | - | |
| P2-01 | Introduce state/snapshot layer if required | L | high | todo | - | State refactor decision is open until Phase 1 |
| P2-02 | Undo/redo controls | M | medium | todo | - | |
| P2-03 | Coalesce typing/sliders/drags | M | high | todo | - | |
| P2-04 | Cover card operations/import/randomise/reset in history | L | high | todo | - | |
| P3-01 | Sheet Editor layout/sidebar accordions | L | high | todo | - | |
| P3-02 | Top bar actions/menu | L | medium | todo | - | |
| P3-03 | Compact card rows and selected expansion | L | medium | todo | - | |
| P3-04 | Preview toolbar and scroll container | M | medium | todo | - | |
| P4-01 | Visual system and icon pass | L | medium | todo | - | |
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
All BUGS and UI/UX items remain `todo` because this Phase 0 audit did not reproduce them in a browser or make app changes.

- B1/B6/B7/B8/B10/B11/B12/B14: source or logic indicates a likely issue; real behavior/visual verification still required.
- B2/B3/B4/B5/B9/B13: source strongly indicates the reported issue; real-size verification still required.
- U1-U16: source and CSS inspection provide risks; none is confirmed fixed or not an issue until screenshots/manual reproduction.

## Phase dependencies and decisions
- Phase 2 needs a state-layer refactor first or a robust snapshot/restore adapter. The current state is split across DOM, `cards`, `CUSTOM`, `THEMES`, `pageThemes`, `gradientAngle`, and localStorage/IndexedDB.
- Phases 7-8 need optional per-card style/position fields. New fields must be optional and existing cards must use current global defaults when absent.
- Phase 6 is export-sensitive and requires baseline comparison for every existing border value across every card size.
- Phase 7 is export-sensitive because stamp positions must serialize and render identically in preview, SVG, PNG, PDF and print.
- Phase 10 is layout-sensitive and needs explicit dimensions/count approval before implementation if current sheet packing assumptions cannot support it.

## Questions
- Approve proceeding to Phase 1 bug fixes after the current audit and manual verification plan.
- Approve installing/dev-using Playwright for desktop and 390px screenshots. No screenshot dependency has been installed.
- For B10, should saving a theme with an existing name update the existing theme, prompt for a new name, or create a duplicate with a generated name?
- For B12, should switching themes/pages/navigation warn only for Theme Studio drafts or also unsaved Sheet Editor changes?
- For B9, should deleting a saved theme always require confirmation.
- For F7, visiting-card dimensions/count should be confirmed if not defined by an approved mockup. No implementation assumptions are made here.

## Commit log
- No commits yet for `ui-overhaul`.

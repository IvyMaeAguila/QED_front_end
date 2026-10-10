# QED loading specification and accepted decisions

You are working in my existing codebase (QED). Build and finish a consistent skeleton-loading system, adapted to this app's own design, where every page's skeleton matches that page's real layout. Some of this is already implemented (the shared loading system and some Teacher pages). Do not start over: audit what exists, bring it into compliance with this spec, then continue through every remaining route.

Two kinds of values in this spec:
- BEHAVIOR values are FIXED. Use them exactly. Do not change or "improve" them.
- VISUAL values (colors, radii, bar thickness, shimmer softness) are DERIVED from this app. Do not use generic defaults.

Before coding, state your plan in a few lines.

## 0. Working rules and decisions already made
- Preserve current layouts. Never add fixed-height or internally scrolling containers, truncation, or fixed column widths to existing regions just to satisfy a test.
- Classify regions by CAUSE (what determines their size), not by component type (see section 8).
- Standing rule: when you hit another instance of a conflict class already decided here (variable-length list, content-dependent height, wrapping field, auto-column table), apply the same decision and record it in DESIGN-AUDIT.md without stopping. Stop and ask me only for a genuinely NEW class of conflict, and name the options when you do.
- Never weaken, skip, or delete a test to make it pass. Fix timing tolerances only if flaky, never by loosening fixed spec values.

## 1. Discover
Inspect the repo: stack, styling approach, theme/design tokens, any component library (shadcn, MUI, Chakra, Ant, Tailwind theme, etc.), any existing Skeleton component, routing, and every place that shows a spinner, "Loading...", or ad-hoc skeleton. Follow existing conventions. If a component library or Skeleton component exists, extend or wrap it rather than building a parallel system. Keep one source of truth for tokens.

## 2. Audit and inventory (before building more)
Write or update DESIGN-AUDIT.md recording:
- Neutral palette in light and dark: page background, surface/card background, border, muted text.
- Corner radius for cards, images, inputs, buttons, avatars, chips.
- Typography: font family, sizes, line heights for headings, body, captions.
- Spacing scale and the card/list/table/form patterns that appear most.
- Character of the UI: sharp or soft, dense or airy, flat or elevated, playful or serious.
- PAGE INVENTORY: every page/route (including role-based variants such as teacher, student, admin) and every data-driven region on it: what data loads and its classification (section 8). If you cannot enumerate some routes automatically, list what you could not cover and ask me.
- SPINNER INVENTORY: every spinner found, its location, and what it was loading.

## 3. Tokens
Fixed behavior tokens (define once):
--sk-shimmer: 1800ms
--sk-fade: 200ms
--sk-stagger: 40ms
--sk-lift: 6px
--sk-ease: cubic-bezier(0.22, 1, 0.36, 1)

Derived visual tokens (from the audit):
- --sk-base: the app's existing muted/neutral surface color just off the background, adjusted so contrast against the background is between 1.1 and 2.0. Tune light and dark independently; never invert one into the other.
- --sk-shine must stay distinguishable from the surface it sits on: base < shine < surface in lightness, shine vs surface contrast at least 1.03, base vs surface within 1.1-2.0. Never let the shine equal or blend into the card background (this made shapes look half-cut on the subject page).
- Compute contrast for EVERY surface a skeleton can sit on (page, card, modal, sidebar, and colored surfaces such as the red dashboard card, which needs lighter-than-surface bars). Use scoped override tokens per surface; never hard-code colors in skeleton styles.
- --sk-radius and per-primitive radii come from the app's own radius tokens. Avatars match the real avatar shape. Images and cards reuse that component's exact radius.
- Bar thickness and gaps follow the app's real typography and spacing scale.
- Shimmer softness follows the UI's character, but it is always one left-to-right sweep (mirrored in RTL), 1800ms linear, on a shared clock, applied per shape (each .sk element, never to a large container), with a feathered gradient and no hard edges. Use the brand's neutral tint, not its accent color, unless the app already uses accent-tinted surfaces.

## 4. Primitives
text line, avatar, image block (aspect-ratio), button/control block, generic block. Every skeleton is composed only from these. A text line is exactly 1lh tall so it matches real text; the bar is inset visually with clip-path, not margins. Chart skeletons have the same shape as the loaded chart (a ring stays a ring, bars stay bars, a line chart stays a line area).

## 5. One loader used everywhere
A single component/hook/function taking: fetcher, render, skeleton, optional label, delay, minDuration. It settles when everything is done.

## 6. What is real and what is skeleton (reference standard: the Teacher Dashboard skeleton is correct)
Anything known before the fetch renders for real, immediately. This includes labels, titles, tabs, buttons, search boxes, legends, toolbars, column headers, row labels with fixed meanings (for example Present/Late), the date and calendar (client-side), and anything already available from session, auth context or cache (for example the user's name). Only values that come from the fetch become skeleton: counts, names and avatars of fetched people, scores, dates and item headers that come from data, chart data, fetched text.
- Never invent skeleton elements the loaded view doesn't have (no extra circles, no second subtitle lines, no decorative badges). A skeleton row has exactly the elements the loaded row has.
- Tables and grids: the header row, column labels, toolbar (search, filters, sort, always-present buttons) and frame render for real. Only body-row cell data and data-dependent counts/totals ("Showing 1-25 of N") become skeleton. Rows reuse the real table's column definitions, row height, cell padding and alignment (never a hard-coded copy).
- Text bars never share one width: vary them (for example 100/92/64%), last line of a paragraph shorter, titles about 55-70% wide, metadata shorter.

## 7. Per-page skeletons: the same as the real layout
Every page/route gets a skeleton that is the same as its real layout. Not a generic placeholder.
1. The page shell renders for real: app bar, sidebar, page title area, tabs, filter bars, breadcrumbs.
2. Prevent drift: skeleton and real content must share the same layout code. Preferred: each component renders its own loading state (a loading prop or sibling skeleton in the same file) that reuses the exact same layout wrappers, grid, gap, padding and breakpoint styles as the loaded state; only leaf data elements swap for skeleton primitives. Never duplicate layout CSS or hard-code pixel sizes in a separate skeleton file when the real layout can be reused.
3. A page-level skeleton is the page composed from its components' loading states, so it matches at every breakpoint.
4. Same structure: same number of columns, card grid, table columns, section order and spacing.
5. Tag named regions per page with data-sk-region="<name>" on BOTH the skeleton and loaded versions (tab-bar, title, toolbar, table-header, each row, score-cell, avatar, name, etc.).
6. Adding a new page later must require a skeleton: the loader takes the page's loading-state component, and a lint/test fails if a route has no skeleton registered.
7. Check whether the whole shell (top bar, header, sidebar) is offset by about 2px between skeleton and loaded states. If real, fix it. If it was a screenshot artifact, say so with measured numbers.

## 8. Region classes (classify by cause)
- FIXED-SIZE: height and width independent of returned data (fixed-aspect images, single-line values that cannot wrap, controls, avatars, stat tiles with single-line content). Strict zero layout shift.
- VARIABLE-LENGTH / CONTENT-DEPENDENT: height depends on returned content (lists, roster tables, gradebook grids, wrapping text such as addresses, names, notes, descriptions, optional fields that may be absent). Mark with data-sk-variable. When unsure, classify as variable. A component may contain both: keep its fixed parts strictly zero-shift and treat only the content-dependent field as variable.
- AUTO-COLUMN: tables whose column widths are sized automatically from returned content. Mark with data-sk-auto-columns.

Rules for variable regions:
- Row/line count, in priority order: page size if paginated; else the last known count for that view or field (cached in memory per view); else the typical count that fits the viewport (rows: 3 to 6; wrapping fields: typical line count, for example 2 for an address, never 1 if the field commonly wraps). Never more rows than fit the viewport.
- Match the real field's width, font metrics, row height and cell padding so wrapping behaves the same.
- A single instant height change at swap is allowed. Never animate height, width, top or left.
- Empty results: render the app's real empty state in the same cell; shrinking is allowed.
- Keep critical things (primary actions, pagination, totals) above the list or sticky so a resize does not displace them.
Rules for auto-column tables:
- Skeleton rows use the same table markup and column definitions as the loaded state. Skeleton column widths, in priority order: (a) last-known column widths for that table cached per view after each successful load; (b) widths derived from the real header label widths plus typical content (short for status/date, wide for names/descriptions); (c) equal shares. One instant width adjustment at swap is allowed; never animate width or left.
Always: the skeleton mounts at t=0 invisible, so revealing it never shifts anything.
Record in DESIGN-AUDIT.md every region, its class, the reason, and the row/line/column source chosen.

## 9. Behavior rules (all mandatory, fixed)
- Delay: reveal the skeleton only if loading exceeds 200ms. Faster loads never flash a skeleton.
- Minimum: once revealed, keep it at least 400ms, then swap.
- Space reservation: mount the skeleton at t=0 but invisible (visibility:hidden) so it reserves its space, then reveal it after the delay. Skeleton and content share one grid cell.
- Swap: cross-fade over 200ms with content rising 6px. Never remove-then-insert.
- Stagger: items marked data-sk-item reveal 40ms apart when there are 2 to 8; more than 8 reveal together.
- Animate only opacity and transform. Never width, height, top, left, or background-position.
- One easing curve (--sk-ease) for every transition. The shimmer sweep is linear.
- Shared shimmer clock: after mounting, set startTime = 0 on every shimmer animation so skeletons mounted at different times are in phase.
- Reduced motion (prefers-reduced-motion: reduce): no shimmer, transitions effectively instant (<= 0.01ms), no waiting for fades.
- Accessibility: container has aria-busy="true" while loading and "false" after. The skeleton layer is aria-hidden="true". A visually hidden role="status" element announces "Loading…" only when the skeleton is actually revealed and is removed afterward.
- Errors: on failure remove the skeleton, show role="alert" with a retry button that re-runs the load. Never leave a skeleton spinning forever.
- Cleanup: when finished, no skeleton layer, status element, or infinite animation remains.

## 10. Spinner removal (no data-loading spinner may remain, tables included)
1. Replace every data-loading spinner (the component library's Spinner/CircularProgress/Loader, custom ones, "Loading..." text, rotating icons, loading overlays on tables) with the skeleton for that region, using the shared loader. For tables, only body rows become skeleton.
2. Full-page and overlay spinners (route transitions, "loading page" overlays) are replaced by the page's own skeleton with the real shell visible.
3. Refetches on an already-loaded table or list (sort, filter, search, page change): no spinner. Keep the current rows visible and dim them with opacity only (about 0.6) while the new data loads, then cross-fade to the new rows. If the table was empty before, or the refetch takes longer than 2 seconds, show skeleton rows instead. Use the same 200ms delay so quick refetches never dim.
4. Do NOT change spinners inside action buttons (submit, save, delete) or upload progress indicators. List each in the final message so I can decide.
5. Delete the old spinner components, styles and unused dependencies once nothing uses them. Add a lint rule or test that fails if they are imported again.

## 11. Apply it
First audit every already-converted page against sections 3, 6, 7 and 8 and fix deviations (list the changes per page: which skeleton elements were actually known before the fetch and now render for real, which invented elements were removed, geometry fixes). Then convert every remaining route, page by page. List every page covered and every place changed.

## 12. Verification (required; do not self-certify)
Add Playwright tests in real Chromium (not jsdom). Use a small harness page with controllable fake fetch latency for behavior tests, and real routes for per-page tests.

Behavior:
1. Latency 60ms: skeleton never becomes visible.
2. Latency 320ms: skeleton appears at about 200ms (±80ms) and stays at least ~390ms before the swap.
3. Latency 1500ms: content appears right after data arrives (within ~150ms).
4. FIXED-SIZE regions: height identical at t=0, while visible, and after swap; CLS from PerformanceObserver("layout-shift") is 0 with a visible element placed below (measure CLS after the initial mount).
5. VARIABLE regions, tested with empty, short (fewer than the skeleton) and long (more than the skeleton, wrapping to more lines) data: (a) height at t=0 equals height while the skeleton is visible; (b) bounding boxes of everything above and beside the region are identical before and after swap; (c) at most one layout-shift event during the whole load, only at swap.
6. AUTO-COLUMN tables: (a) skeleton column layout does not change between t=0 and while visible; (b) at most one layout shift, only at swap; (c) everything above and beside is unchanged; (d) after one successful load, a repeat load renders skeleton columns within 2px of the loaded widths; (e) widths are never animated. Strict 1px column check stays for all other tables.
7. Classification safety: a region may be marked FIXED-SIZE only if its loaded size does not change across the test data sets; a table may be marked auto-column only if its widths are observed to change. Fail on violations.
8. Every animation's keyframes (document.getAnimations() + effect.getKeyframes()) use only transform/opacity.
9. Skeletons mounted at different times have equal effect.getComputedTiming().progress (within 0.01).
10. Shimmer duration is 1800ms; all transitions use the same timing function.
11. Stagger delays: 5 items → 0, 40, 80, 120, 160ms; 12 items → all equal.
12. Reduced motion (emulated): no infinite animations running; transition duration <= 0.001s.
13. A11y: aria-busy true then false, layer aria-hidden, role=status contains "Loading" only while revealed.
14. Error: role=alert and retry button present, skeleton gone, aria-busy false.
15. After completion: zero skeleton layers, zero status elements, zero infinite animations.
16. Negative controls on a fixed-size region: a deliberately mismatched-height skeleton must produce a height mismatch and CLS > 0; with the shared-clock sync disabled, shimmer phases must differ by more than 0.05.

Design and per-page (for EVERY route):
17. Skeleton CSS contains no hard-coded colors, only tokens.
18. Contrast: skeleton vs background within 1.1-2.0 in light and dark on every surface type where a skeleton appears; shine vs surface at least 1.03.
19. Route coverage: enumerate the app's routes and assert each has a registered skeleton. Fail if any has none.
20. Region match: for every data-sk-region present in both states, bounding-box position and size match within 1px (variable/auto-column regions per section 8). FAIL if a region exists in only one state (catches invented or missing elements).
21. Static-content check: collect the visible text of static elements in the loaded state (tab labels, button labels, column headers, data-independent titles, fixed row labels). Assert the same text is present and readable (not inside a .sk element, not aria-hidden) in the skeleton state. Also assert session-known values (such as the user's name) are not skeletonized.
22. Chart shape: skeleton chart shape matches the loaded chart type.
23. Adjacent text bars in a block don't share the same width.
24. Pixel check: screenshot the skeleton with animations paused at shimmer phases 0, 25, 50 and 75%. Assert no skeleton shape's visible area drops below 90% of its static area (catches shine blending into the surface) and that no hard vertical edge exists across rows.
25. Overlay diff: for each route at 1280px and 375px, light and dark, produce a skeleton-over-loaded overlay screenshot in ./loading-screenshots/diff/ and fail if more than 2% of skeleton shape pixels fall outside the matching loaded element's box.
26. Screenshots of skeleton and loaded states for each route at 375px and 1280px, light and dark, saved to ./loading-screenshots/. Review them yourself against DESIGN-AUDIT.md and the Teacher Dashboard standard, and fix anything off-brand or misaligned before finishing.

Spinner removal:
27. Static check: no imports or usages of removed spinner components remain (except the action-button cases from section 10.4).
28. For EVERY route, while data is loading, no element matches spinner patterns (role="progressbar", the library's spinner classes, rotating svg/icon animations, the text "Loading...") outside the skeleton's visually hidden status element.
29. Tables: initial load shows skeleton rows; on sort/filter/page change the old rows stay visible, dimmed via opacity only, with no spinner and no layout shift above or beside the table; a refetch under 200ms never dims.

Prove the tests work: for every new test in 17-29, show that it FAILS on the code before the fix (the subject page's current skeleton, and the old spinner code) and PASSES after. If a new test passes on the old broken code, it is not testing the right thing: fix the test first. The earlier suite passed despite visible defects, so treat it as insufficient.

Run the whole suite at least 3 times to check for flakiness.

## 13. Final message
- Files changed, every page converted, and any page not covered (with reason).
- Per-page list of changes from the audit in section 11.
- DESIGN-AUDIT.md summary: derived token values, region classifications, row/line/column sources, auto-column tables, and the spinner inventory.
- Action-button and upload spinners left in place.
- A short LOADING.md: tokens, primitives, the fixed vs variable vs auto-column rule, the "known before the fetch renders for real" rule, and the single rule for adding a new page skeleton.
- The real, unedited output of the final test run (all passing) and which new tests failed before the fix.
- Anything you could not verify.

## Subsequent accepted decisions
- Fixed overlays: the 2% outside-box limit applies only to fixed-size regions. Variable regions use reserved geometry and the permitted one-time resize.
- Variable-aligned static elements: preserve the existing alignment next to content-dependent regions. Static text/control dimensions stay unchanged; position may respond once at swap to the variable sibling. No forced alignment, truncation, dimensions or widths.
- Apply known conflict classes without stopping. Existing mobile chart clipping is preserved and reported; do not introduce a new scroll container.
- Required final verification: production build and three consecutive full Chromium suites. Preserve unedited output, before/after evidence, screenshots in loading-screenshots, and report any unverified requirement.


## Pet Quiz animation decision
The user explicitly preserves existing gameplay, story, breathing, hunger and challenge animations. Cleanup assertions require zero remaining **loading** animations, scoped to skeleton primitives and loading layers; game animations remain unchanged. This is an accepted exception to the original blanket infinite-animation wording.
# Latest decisions — 2026-10-10

These decisions supersede any earlier pending or three-run instructions below.

* Known-role lazy loading uses the real role shell and matched registry composition; no QedLoader. Unknown-role auth uses the sole named exception `QedBootstrapLoader`: reveal after 200ms, minimum 400ms, logo opacity only, reduced motion static, aria-busy, role=status Loading… only while revealed, full DOM cleanup, no protected component/data before auth resolves.
* Add fast (<200ms), rotation, reduced-motion, accessibility/minimum/cleanup, protection and two viewport shell/fallback tests. Five fail on the original implementation; the two already-correct original families require mutation proof.
* Unchanged static pages and negative-control helpers require one implementation mutation check per family, with real assertion failure, restoration and passing control; record exact patches/logs in LOADING-BEFORE-COVERAGE.json. Do not claim each individual test failed original code.
* Preserve the nine action/upload spinner placements and determinate progress graph.
* Exact Pet Quiz user decision: “Preserve game animations; require zero remaining loading animations (recommended)”. Preserve gameplay breathing, hunger, story clouds and challenge effects; the zero-animation cleanup requirement applies to loading effects.
* Create a new git branch and commit everything; do not push or deploy. Production build and one complete suite after these changes are required. No need to rerun three full suites.


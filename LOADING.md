# QED loading system

The 55 route compositions are registered in `src/shared/loading/routeSkeletons.ts` and connected to the real lazy router. Registration is enforced independently with an AST coverage test. It does not replace per-region visual verification. See LOADING-PROGRESS.md for current verification status and LOADING-SPEC.md for every requirement and accepted exception.

## Tokens and primitives

`src/style.css` owns the behavior and visual tokens. Reveal delay: **200ms**. Minimum visible time: **400ms**. Shimmer: **1800ms linear** on a shared clock. Fade: **200ms**; item stagger: **40ms** for 2–8 items; lift: **6px**; easing: `cubic-bezier(0.22, 1, 0.36, 1)`. More than 8 items reveal together. Reduced motion removes shimmer and fade waiting; transition duration is at most **0.01ms**.

Light base uses the existing #DDDDDD border neutral; dark uses #444444. Shine mixes the base toward the existing white surface, independently tuned for each theme. Scoped tokens handle maroon, sidebar, quiz, courseware video, charts, controls and the profile avatar. Base/surface contrast must be **1.1–2.0**, shine/surface at least **1.03**. Skeleton styles use tokens rather than hard-coded colors.

Extend the existing `SkeletonLoading.tsx`: `SkeletonText` (exactly **1lh**, visually inset with clip-path), `SkeletonAvatar`, `SkeletonImage` (real aspect ratio), `SkeletonControl`, and `Skeleton` (block). Reuse the loaded component's radius, typography, padding, wrappers and breakpoints. Vary adjacent text widths. Chart placeholders retain the real ring, line, radar or bar shape.

## Shared loader

`DataLoader` accepts `fetcher`, `render`, `skeleton`, and optional timing/label settings. Existing contexts use `LoadingRegion`; tables use `LoadingTable`; unknown input values use `LoadingFormValue`. These adapters share one timing engine. `frame(pending)` lets the real layout render known labels and controls while only fetched leaves become primitives.

Mount the pending layout invisibly at t=0. Reveal only after 200ms. Freeze its reservation until swap. Cross-fade in the same grid cell; the outgoing layer becomes absolute to avoid a second resize. Animate only opacity and transform. `aria-busy` reflects pending state; primitives are aria-hidden; a hidden status announces loading only after reveal. Errors remove shapes and present an alert and Retry.

For refetches, use `retainPrevious` and `hasContent`: keep old nonempty results real for 200ms, then dim to **0.6** opacity; after **2000ms** use reserved skeleton rows. Previously empty results use initial-load behavior. `initialContentKnown` renders already-cached content immediately. Update reservations after successful settlement.

## Region rules

Anything known before the fetch renders for real: session identity, date/calendar, headings, labels, tabs, controls, legends, table headers and cached data. Mask only unknown leaves. Never invent elements or change loaded layouts to make a test pass.

- **FIXED-SIZE:** geometry independent of returned data. Require zero shift and **1px** region/column tolerance. The fixed overlay outside-box limit is **2%**.
- **VARIABLE:** wrapping text, optional fields, unknown item counts and other content-dependent geometry. Mark `data-sk-variable`. Mount and revealed reservation must match; allow one instantaneous resize at swap. Preserve existing layouts without new truncation, fixed dimensions or scrolling. Fixed controls aligned with variable siblings may move once with that sibling while retaining their size.
- **AUTO-COLUMN:** native table widths demonstrably vary across data fixtures. Mark `data-sk-auto-columns`. Share the actual table markup, headers and row renderer. Pending columns prefer the last successful widths per view, then header/typical metrics, then equal shares. A repeat reservation must be within **2px**. Allow one instantaneous adjustment at swap; never add loaded column widths. Unmarked tables retain the strict **1px** check.

`reservations.ts` caches row counts, field line counts, intrinsic control widths and native column widths in memory. Lists prefer existing page size, then view cache, then viewport-derived **3–6** rows, never more than fit. Wrapping fields prefer the field cache, then typical lines (**2** for an address/name, **3** for descriptions). Match actual width/font/line height; add `data-sk-field` to the loaded field for line measurements. Optional fields may shrink away at swap. Document each region's cause, count source and measured classification in DESIGN-AUDIT.md.

## New-page rule

**Build the loading state from the page's real shared composition, document its regions, verify the actual route at 375px/1280px in light/dark with the relevant short/typical/long/empty and repeat-cache cases, then register its role and lazy controller in `routeSkeletons.ts`, connect its route in that role's `src/routes/roles/*Routes.tsx`, and register its eager composition in that role's `*Views.tsx`.** The independent router AST guard rejects missing or disconnected registrations, including nested routes.

## Auth and lazy routes

The 55 registered routes share 46 actual compositions. A `.loading-view.tsx` owns the page's real layout/state; its lazy controller mounts the original data effects. A role layout keeps its real shell outside Suspense and uses `RouteSkeleton` for the matched composition. Preview context suppresses page/child fetch effects and explicitly supplies the shell's outlet context. No copied placeholder page or second request is introduced.

Before auth resolves, `QedBootstrapLoader` is the single allowed brand-loader exception. Its real logo fades opacity only, after **200ms**, with **400ms** minimum once revealed. Reduced motion has no running animation. The gate exposes `aria-busy` and a `Loading…` status only during reveal, then removes its entire DOM. Protected content mounts once, only after authentication and gate settlement; the protected shell is never animated by this gate. `QedLoader` was deleted.

## Verification and preserved indicators

Run `npm run build`, then `npx playwright test --reporter=line --workers=1` **once**, per the latest user decision. Do not edit source/tests during a running browser suite. Current raw output is retained in `loading-decision-final-suite.log`; earlier three-run logs are historical. Screenshots are in `loading-screenshots/`, including `diff/` and `phases/` evidence. No retries are configured. Mutation proofs are recorded per family in `loading-screenshots/audit/LOADING-BEFORE-COVERAGE.json`; `node scripts/verify-loading-mutations.mjs` runs missing proofs, restoring each mutation before its control. Delete only the desired ledger entry to deliberately repeat a proof.

Preserve the nine save/submit/import/upload spinners and the determinate progress graph. Pet Quiz gameplay/story/breathing/hunger/challenge animations are explicitly preserved; cleanup requires zero remaining **loading** animations. The user's exact decision was: “Preserve game animations; require zero remaining loading animations (recommended)”.

## Role code and library boundaries

AuthService preloads only the role named by the successful login/session response. No page data is prefetched. The bootstrap gate also covers arrival of known-role code; shells and matching views live in role-specific modules. Shared help and teacher profiles are used by their existing audiences. Recharts loads when a chart mounts, in parallel with its existing data effects; the lightweight preview interprets the original chart JSX/axes without waiting for that library. XLSX loads only when parsing an uploaded template. Never import concrete views into the metadata registry or a global all-role manifest. npm run build enforces fixed entry/eager-closure budgets and these graph boundaries.

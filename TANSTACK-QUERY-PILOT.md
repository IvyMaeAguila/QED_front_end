# Principal Teachers Directory query pilot

Historical pilot/blocker verification. See `QED-COMMIT-VERIFICATION.md` for
the final commit-preparation results and current deployment limitations.

Scope: only the Principal Teachers Directory uses TanStack Query. No backend,
database, grade, attendance, holistic, intervention, or parent-record changes.

## Implementation

- `@tanstack/react-query` is pinned to stable 5.104.1 (React 18/19 compatible).
- `src/shared/query/queryClient.ts` owns one in-memory QueryClient. Freshness is
  five minutes; inactive results are collected after ten minutes. Retries are
  explicit; focus/reconnect do not refetch completed queries. Requests paused
  offline resume once when connectivity returns.
- The provider wraps the directory composition, rather than the public app.
  This keeps Query out of the public entry dependency closure.
- Keys contain a session generation, role, user ID, and directory resource name.
- `sessionQueries.ts` connects auth cleanup without eagerly loading Query.
  Login, logout, and identity changes cancel/remove pilot queries. Old auth
  completions and expiration signals cannot overwrite a newer session.
- A 401 from a directory request expires the current local auth session. A 403
  remains a permission error. This detects expiry when a request occurs; it does
  not poll the server for cookie expiry or synchronize account changes across tabs.
- Teacher-list service caching is removed. Directory school-year requests bypass
  the separate schedule cache. Existing profile/schedule caching is preserved.
- Preview/auth/role gating prevents directory requests before they are permitted.
  Both requests receive an AbortSignal. Cached rows remain usable during refresh.
- The hook interface, directory UI, manual retry, and loading components remain.

## Final-review blocker corrections

- Offline/paused requests now stop the initial loading indicator and use the
  existing LoadingRegion connection-error and Retry presentation. Cached rows
  remain visible alongside the error. Offline/repeated retries cannot enqueue
  duplicate requests. Fresh caches do not refetch unnecessarily on reconnect;
  paused initial/stale requests resume once.
- Each endpoint has its own authentication-error handler before Promise.all.
  A late 401 expires the owning session even after the other endpoint fails.
  Aborted requests and old-session expiration signals cannot clear a newer
  session. A 403 remains an ordinary permission error.
- QueryHttpError moved to a framework-independent HTTP module without behavior
  changes. Shared teacher profile/schedule services no longer pull QueryClient
  into Admin. Production graph guards reject TanStack in public/non-Principal
  eager closures, and production browser tests check script-request isolation.

Correction files: `src/shared/http/QueryHttpError.ts`,
`src/shared/query/queryClient.ts`, the directory hook/service/composition above,
`src/features/profiles/principal/pages/teachers/hooks/directoryOfflineError.ts`,
`scripts/check-bundle-budget.mjs`, `tests/bundle-budget.spec.ts`,
`tests/role-bundles.spec.ts`, and `tests/query-pilot-blockers.spec.ts`.

## Changed files

- `package.json`, `package-lock.json`
- `src/features/auth/context/authContext.tsx`
- `src/shared/query/queryClient.ts`, `src/shared/query/sessionQueries.ts`
- `src/features/profiles/principal/pages/teachers/PrincipalTeachersPage.loading-view.tsx`
- `src/features/profiles/principal/pages/teachers/hooks/useTeachersDirectory.ts`
- `src/features/profiles/principal/pages/teachers/services/teachers.service.ts`
- `tests/query-pilot.spec.ts`, `tests/query-pilot-harness.tsx`, `tests/query-pilot.html`
- This report

## Verification

- `npx tsc -b`: passed.
- `npm run build`: passed, including strengthened bundle guards. Public entry
  eager closure: 133,397 gzip bytes; budget: 135,349 bytes. Admin eager download
  beyond public: 140,817 gzip bytes versus 151,512 before corrections (10,695
  bytes less). Principal: 130,284 versus 129,800 (484 bytes more).
- Final combined verification passed all 74 tests: directory/loading, bootstrap,
  query-pilot, ten new blocker regressions, production role bundles, bundle
  budgets, and user details (including Admin teacher profile mapping/controls).
- Tests cover mobile/desktop and light/dark directory/profile loading, errors,
  retries, empty responses, fresh cache reuse, stale refresh, auth readiness,
  preview gating, request cancellation, account/role switching, logout/relogin,
  401/403 handling, old-session rejection, and preserved schedule/profile caches.
- Targeted ESLint reports only two existing Fast Refresh export errors in
  `authContext.tsx`; both also occur on the original Git version. No lint rules
  were weakened and no unrelated export refactor was performed.
- npm audit reports 12 findings in existing dependencies (one low, four moderate,
  seven high), with none attributed to the added TanStack packages. Dependency
  remediation outside the pilot was not attempted.
- Correction-only targeted ESLint passed. No packages or lock entries were
  changed during corrections. The existing high-severity xlsx prototype-pollution
  and ReDoS findings remain a separate security follow-up for spreadsheet import;
  they were not addressed in this scoped task.

## Limits and next decision

All three implementation blockers are resolved; the pilot is ready for manual
acceptance testing. API behavior is verified with mocked browser requests, not
production accounts.
Manual acceptance still needs real Principal cookies/CORS, offline/reconnect in
the browser, expired-cookie responses from both endpoints, logout/account switch
during slow requests, and teacher profile/schedule navigation. Check the cached
offline alert at mobile/desktop sizes in both themes.
Other modules' caches and synchronization remain unchanged. This pilot supports
incremental adoption in another read-only module after review; it does not justify
an automatic migration of editing workflows. No commit, push, or deployment.

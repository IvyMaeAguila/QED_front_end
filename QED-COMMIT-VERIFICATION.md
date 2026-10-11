# Principal Teachers Directory pilot: local commit verification

Date: 2026-10-11 (Asia/Manila). Approved scope: TanStack Query pilot limited to
the Principal Teachers Directory, its three blocker corrections, API
configuration correction, automated acceptance tests and verification reports.

The earlier reports document successive historical verification stages.
`QED-QUERY-ACCEPTANCE.md` records the former API mismatch and failed tests;
`QED-API-CONFIG-CORRECTION.md` records their resolution. This report is the final
commit-preparation record. Generated test-results links in earlier reports are
local, ephemeral evidence, not artifacts included in the Git commit.

## Scope review

Reviewed the complete staged/unstaged/untracked inventory. No changes were staged
at the start. The package manifest/lock diff adds only TanStack React Query and
Query Core 5.104.1; there are no unrelated dependency upgrades. Implementation
changes are restricted to the directory composition/hook/service, lightweight
HTTP error, centralized QueryClient, and auth-session cache cleanup bridge.
Profile/schedule caches remain independent. No backend/database or academic
calculation changes are included.

The pre-existing `playwright.config.ts` change excluding live tests, plus
`playwright.live.config.ts`, `tests/gradebook-two-advisories.spec.ts`, and
`tests/live/gradebook-live.spec.ts`, are unrelated to the approved pilot. They
are excluded and preserved locally. The acceptance configs explicitly select
their test files; the unrelated live-test exclusion does not affect those runs.
Generated screenshots, dist, test output, node_modules, .env files, credentials,
cookies and private fixtures are excluded from the commit.

## API configuration

At commit preparation the working tree again selected hardcoded localhost.
To meet the user's latest production-safety requirement, it was restored to the
verified committed configuration with canonical `baseURL`, Vite mode selection,
trailing-slash normalization and the established Render fallback.

- Development `.env.development`: `http://localhost:7400`.
- Production `.env.production`: `https://thesis-qed-1.onrender.com`.
- Fresh compiled configuration: Render endpoint present; localhost absent.
- A normal production build does not default to localhost. An explicit Vite
  environment override remains supported, so deployment environment variables
  must retain the intended production URL.

`src/config/api.config.ts` is identical to HEAD after this restoration, so it
does not require a new changed-file entry in this pilot commit. No environment
files were edited or staged.

## Commit file inventory

The final commit contains the following scoped files; the API config above is
already part of the base commit:

- `package.json`
- `package-lock.json`
- `scripts/check-bundle-budget.mjs`
- `src/features/auth/context/authContext.tsx`
- `src/features/profiles/principal/pages/teachers/PrincipalTeachersPage.loading-view.tsx`
- `src/features/profiles/principal/pages/teachers/hooks/useTeachersDirectory.ts`
- `src/features/profiles/principal/pages/teachers/hooks/directoryOfflineError.ts`
- `src/features/profiles/principal/pages/teachers/services/teachers.service.ts`
- `src/shared/http/QueryHttpError.ts`
- `src/shared/query/queryClient.ts`
- `src/shared/query/sessionQueries.ts`
- `tests/bundle-budget.spec.ts`
- `tests/role-bundles.spec.ts`
- `tests/query-pilot.spec.ts`
- `tests/query-pilot-blockers.spec.ts`
- `tests/query-pilot-acceptance.spec.ts`
- `tests/query-pilot-harness.tsx`
- `tests/query-pilot.html`
- `playwright.acceptance.config.ts`
- `playwright.acceptance-build.config.ts`
- `playwright.acceptance-retained-build.config.ts`
- `TANSTACK-QUERY-PILOT.md`
- `QED-QUERY-ACCEPTANCE.md`
- `QED-API-CONFIG-CORRECTION.md`
- `QED-COMMIT-VERIFICATION.md`

## Deployment limitations

Browser API responses are mocked, with synthetic data only. Real Principal
cookie/CORS, actual backend authorization and real account workflows remain
unverified because no authorized test credentials are configured. Chromium
automation does not certify other browser engines. Existing xlsx audit findings
remain a separate security follow-up; no vulnerability remediation is included.
The two previously documented Fast Refresh lint errors were not refactored.

No push or deployment is authorized or performed. Local commit results and
verification totals are recorded below after successful checks.

## Final verification rerun before commit

- Complete regression/acceptance suite: **78 passed, 0 failed, 0 skipped**, 139.7 seconds; started 2026-10-11T03:17:49.590Z UTC.
- Fresh production browser suite: **52 passed, 0 failed, 0 skipped**, 71.8 seconds; started 2026-10-11T03:20:16.929Z UTC.
- Independent TypeScript compilation: passed.
- Fresh production build and standalone bundle guards: passed.
- Public eager closure: 133,397 gzip bytes / 135,349 budget.
- Admin eager download beyond public: 140,817 gzip bytes / 151,512 budget.
- Production configuration check: Render URL present, localhost absent.
- Scoped credential-pattern check: no findings; environment/private files excluded.
- Browser APIs: mocked only. Hook/bootstrap source harnesses use Vite; the separate 52-test pass serves fresh production dist.

The approved scope is verified for a local commit. Only the scoped allowlist is staged; unrelated live/gradebook files remain unchanged outside the commit. The commit deliberately retains the historical acceptance reports with explicit supersession notes.

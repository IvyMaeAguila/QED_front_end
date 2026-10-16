# Account provisioning / User Management security verification

Date: 2026-10-12. Dedicated security correction; no TanStack Query migration.
This report supersedes the historical findings in QED-ADMIN-USERS-SECURITY-BLOCKERS.md
for the corrected paths. Release limitations below still apply.

## Root causes and corrected behavior

Before correction, public registration accepted a caller-selected privileged role
and issued a JWT. User-record routes checked only token validity. Profile creation
trusted a submitted userId and could delete that authentication row on duplicate
email/error. Authentication and profile creation were two independent requests.
Credential email was unconditionally redirected to a development recipient, while
the form claimed mail was sent to the new user regardless of provider outcome.

The prior isolated reproductions confirmed all three authorization/integrity
failures: unauthenticated ADMIN registration returned 201, its JWT passed the
already secured Admin analytics route, a Teacher could create a profile, and a
supplied unrelated auth ID reached DELETE on duplicate email. These are historical
vulnerability reproductions, not historical passing security acceptance tests.

The correction requires verifyToken plus a strict Admin caller check on both
provisioning aliases and every administrative user-record route. Roles derive
from verified JWT claims; request body/params cannot elevate the caller. Non-string,
missing, unknown and whitespace-padded caller roles fail closed. Case normalization
preserves existing valid Admin conventions. Self-service profile/auth routes stay
on their existing ownership-based contracts; they were not made Admin-only.

## Before/after authorization matrix

| Operation | Before | After |
| --- | --- | --- |
| POST /api/auth/register | Public; caller could obtain privileged token | Admin-only complete provisioning; no token issued |
| POST /api/user/addUser | Any valid JWT; client auth ID | Admin-only; server-owned auth/profile transaction |
| PUT /api/user/editUser/:id, including status | Any valid JWT | Admin-only |
| PATCH /api/user/deleteUser/:id | Any valid JWT | Admin-only; existing server-linked soft deletion |
| GET /api/user/getUser/:role/:id, /usersList | Any valid JWT | Admin-only |
| GET /api/user/totalUser, /teacherCount, /parentCount | Any valid JWT | Admin-only |
| Existing /auth/login, /auth/me, owned profile/password routes | Existing identity/ownership behavior | Unchanged |

Missing cookie remains 401; invalid/expired JWT retains the existing 403 contract;
valid non-Admin/unknown/malformed/missing caller role receives 403 before DB access.
The existing Calendar and login-frequency authorization implementations are unchanged.
No public first-Admin exception was added. Bootstrap requires a separate controlled
operator process; existing authorized Admin identities use their normal login.

## Provisioning and transaction contract

POST /api/user/addUser and POST /api/auth/register are aliases for one operation.
Required profile fields: role, firstName, lastName, email, contactNumber, status;
gender is required for Teacher/Principal/Parent. middleName remains optional.
Co-Admin remains ADMIN. Both aliases reject submitted userId/password/generatedPassword.
The frontend sends one profile POST, without creating authentication separately.
The unused split-registration frontend service/type and old backend register/create
and client-ID rollback functions were removed. Login code was preserved unchanged.

The server retains the existing name-based institutional username convention,
generates a cryptographically random 16-character password satisfying the current
policy, bcrypt-hashes it and sets must_change_password=1. No generated password,
hash or new JWT is returned to the caller. Provisioning does not replace Admin cookies.

A dedicated connection holds a bounded MySQL provisioning lock shared by both aliases
across app workers. Schema readiness is checked without DDL. A single transaction
checks username/cross-role email conflicts, inserts authentication, uses its new ID
to insert one profile, and commits. Active Principal creation also enforces the
existing single-active-Principal rule. Duplicate conflicts are 409, invalid inputs
400. Failures roll back and never delete a submitted ID. Failed/uncertain connection
state is destroyed rather than returned to the pool. Lock release is checked.

No model/schema changes were necessary. Provisioning explicitly requires InnoDB
account tables and required columns; absent/unverifiable readiness yields 503 before
writes. It does not invoke the models' runtime ALTER helpers inside a transaction.
Historical orphan/duplicate accounts are preserved for a separately authorized audit.
Named locks coordinate these API paths, not external SQL maintenance tools.

## Credential delivery

After commit and connection release, the server sends credentials to the validated
profile email. Production requires QED_CREDENTIAL_EMAIL_FROM to identify a verified
provider sender; missing configuration returns failed without provider contact.
QED_TEST_EMAIL_RECIPIENT is an explicit non-production override only; production
ignores it. The previous shared hard-coded redirection is removed, also allowing
existing OTP/visibility helpers to use their intended recipients in production.
No grading/visibility calculations or notification business behavior changed.

201 preserves success/message/profile data and adds credentialDelivery:
accepted, test-recipient or failed. Accepted means provider acceptance, not proven
inbox delivery. Email rejection/exception does not undo the committed account.
The existing feedback modal reports failure/test redirection truthfully and does
not imply credentials reached the intended recipient. Failed account creation
neither refetches the list nor reports success. Credential HTML is escaped and
provider errors/credentials are not logged by the new delivery path.

Temporary-password email retains the established contract but has mailbox exposure
risk; forced first-login password change is preserved. Single-use activation is a
recommended separately reviewed improvement, requiring token persistence/expiry
and recovery design. No activation schema or unrelated auth redesign was introduced.

## Exact files changed

Frontend (6):
- src/features/profiles/admin/pages/usermanagement/UserFormPage.loading-view.tsx
- src/features/auth/services/authentication.service.ts
- tests/account-provisioning-acceptance.spec.ts
- playwright.acceptance.config.ts
- playwright.acceptance-build.config.ts
- QED-ACCOUNT-PROVISIONING-SECURITY-VERIFICATION.md

Backend (10):
- src/modules/authentication/authentication.router.js
- src/modules/authentication/authentication.controller.js
- src/modules/authentication/requireAdmin.middleware.js
- src/modules/admin/user-record/userRecord.router.js
- src/modules/admin/user-record/userRecord.controller.js
- src/modules/admin/user-record/provisionAccount.controller.js
- src/services/mailer.service.js
- test/accountProvisioningSecurity.test.js
- test/credentialDeliverySecurity.test.js
- docs/ACCOUNT-PROVISIONING-SECURITY.md

## Executed verification

Backend baseline executed before application changes: 236/236. Historical supplied
frontend baseline: source 581/581, production 251/251; these were not rerun as a
pre-change frontend baseline in this task.
Focused final security tests: 157/157; complete isolated backend: 393/393.
The complete backend suite was also run successfully at intermediate counts
362/362, 378/378, 380/380, 387/387, 389/389 and 391/391 as coverage expanded.
Existing user-form source tests: 17/17. New browser workflows: 8/8 focused source,
and 8/8 included in each full source/production suite. Fresh production: 259/259.
Full source: 589/589 (11.6 minutes). Fresh production completed in 6.3 minutes. Both suites report zero failures, skips and flaky cases, with retries zero.
TypeScript compilation passed independently; npm run build passed with a fresh
artifact and unchanged bundle guards. Both full suites include role-isolation and
bundle tests. Nine backend JavaScript syntax checks passed. Scoped lint for the
form/new browser tests/acceptance configs passed. Authentication service retains
one pre-existing no-explicit-any error: running ESLint on its committed pre-change
source reproduces that same annotation error (old line 47, now line 40).
No lint rule/assertion was suppressed. Whole-checkout lint is not certified clean.

Tests cover denied callers across all nine route/method pairs before any DB calls;
invalid/expired/unsigned JWTs; role spoofing; authorized creation of all four roles;
server-owned IDs; no JWT/password/hash/cookie response; bcrypt verification;
validation; duplicate names/email; concurrent duplicate and distinct provisioning;
auth/profile/duplicate/commit failure rollback; fail-closed schema readiness; mail
provider failures/redirection/escaping/configuration; correct login of every role;
unknown/wrong-password/inactive/deleted login denials; Admin reads, editing/status
and deletion; unrelated account preservation and Teacher denial from Admin analytics.

Backend tests use actual local Express/JWT/controllers/models and isolated database
and email doubles. Transaction-memory fixtures verify operation ordering/rollback,
not actual MySQL isolation/constraints. Browser tests use deterministic mocked APIs
and authentication. No live data, real school account, email recipient or .env was
accessed. No mysql/mysqld/docker executable was found for a local isolated DB fixture.
Real MySQL persistence, provider delivery and cookie/CORS integration are unverified.

New browser assertions require one creation POST, zero registration POSTs and one
post-success list read; failures cause no list refresh. The old static form flow
had two creation POSTs (registration then profile). No Query cache/invalidation
migration or optimistic update was introduced. Existing list refresh remains intact.

Exploratory issues are retained in evidence: the first edit-script command failed
because Python was unavailable and changed no files; the corrected Node command
applied the edits. An early email-test file had a syntax error (121 passed, one file
failed); corrected syntax yielded passing runs without changing assertions. The
first browser command used the wrong button label and was interrupted; the corrected
selector uses the existing Add User button and all eight workflows passed. Early
login fixtures lacked schema-column metadata and emitted warnings while passing;
the fixture now accurately supplies existing column metadata. No application or
full-suite failure was hidden and no retries/assertions/budgets were weakened.

## Bundle impact

| Gzip metric | Previous verified build | Fresh build | Fixed cap |
| --- | ---: | ---: | ---: |
| Public eager closure | 133455 | 133411 | 135349 |
| Admin eager beyond public | 141633 | 141464 | 151512 |

Public decreases 44 bytes; Admin eager decreases 169 bytes. No dependencies were
installed. Existing public/non-Principal eager Query isolation is retained. These
are bundle/request measurements, not a real-backend latency or CPU benchmark.

## Release limitations and readiness

The scoped correction is ready for safe end-to-end acceptance in an isolated,
representative MySQL/email environment, with all requested regression gates above executed.
It is not a certified production release:
- Rotate JWT_SECRET and restart all instances to revoke tokens issued by the old
  public registration vulnerability. No secret was read or changed here.
- Verify transactional table metadata, required columns, connection privileges,
  duplicate constraints and rollback against isolated MySQL before deployment.
  Missing prerequisites must remain a 503, not bypassed for convenience.
- Configure a verified production credential sender and verify safe delivery and
  account recovery, including existing password-reset behavior. Inbox receipt and
  recovery were not certified by these tests. Static review found an existing recovery concern: forgotPassword indexes the lowercase ROLE_TABLES map with the raw stored role, while existing and newly provisioned roles are uppercase. That unchanged recovery path needs a focused follow-up before relying on it for mail-failure recovery.
- Deploy frontend/backend together; old split-provisioning clients intentionally
  fail. Review initial-system bootstrap separately; no public exception exists.
- Audit historical accounts separately; the correction does not clean up earlier
  unauthorized or orphaned records. A COMMIT connection loss can leave client-visible
  outcome uncertain; check existing records before retrying creation.
- The localhost/Render manual toggle is untouched and still selects localhost.
  This is not a Render-targeted release artifact. The existing xlsx issue remains
  separate; no unrelated dependency/security upgrade was attempted.

Preservation audit: all pre-existing backend modifications retain their original hashes. Only the two frontend acceptance configs were extended among pre-existing modified files; all other prior frontend changes retain their hashes. No unexpected new or modified file was found. Generated tracked screenshots were initially clean and restored after testing. Both HEADs and empty indexes are unchanged; the API toggle retains its initial SHA-256 hash.
No stage, commit, push, deployment or additional module migration. Stop for review.
Evidence is retained under the local TEMP/qed-provision-security-20261012 directory.
See backend docs/ACCOUNT-PROVISIONING-SECURITY.md for the release and API contract.

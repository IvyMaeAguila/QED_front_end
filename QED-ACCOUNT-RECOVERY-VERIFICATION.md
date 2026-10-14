# Account recovery and Teacher creation verification

Date: 2026-10-12. Scope: password recovery reliability/security and verification of
the completed atomic account-provisioning correction. No TanStack Query migration.

## Reproduced defects and correction

The original forgot-password code indexed the lowercase ROLE_TABLES map using the
raw uppercase authentication role. A local Express/router/database-double
reproduction returned 500 for a valid uppercase Teacher. Login already normalized
roles; recovery did not. Recovery now normalizes only server-owned role strings
through an own-property allowlist. All four supported uppercase roles work; mixed
case remains supported. Unknown, missing, malformed and padded roles fail closed.
SQL table names can only come from that allowlist, never request body parameters.

Two additional recovery defects were reproduced before editing application code:
the same reset JWT successfully changed the password twice, and a recovery JWT
could authenticate the ordinary session password-change endpoint. The three new
initial regression tests failed 0/3 before correction and passed 3/3 afterward.
They remain in the expanded recovery suite.

Recovery is isolated in accountRecovery.controller.js. OTP verification atomically
consumes the existing code using its account, expiry and password version. Reset
JWTs retain purpose/password_reset, HS256 and fifteen-minute expiry, with an HMAC
binding to the server-owned account ID and current password hash. Reset validates
the binding and active, nondeleted profile before a conditional password UPDATE.
Concurrent/reused tokens have one successful update; any password hash change
invalidates previously issued tokens. Session verification rejects purpose-bearing
recovery tokens before controllers. Ordinary session tokens remain compatible.
No schema, account ID, role, provisioning transaction or login payload was changed.
Previously issued reset JWTs without the binding require a fresh OTP request.

The forgot endpoint gives the same 200/body for a valid-shape matching/nonmatching
account/email, inactive/deleted account, unsupported role, rate limit and provider
failure. OTP failures share a generic 400; invalid reset tokens return 401. This
protects response status/body disclosure; constant timing is not claimed. Invalid
input shape remains 400. The OTP modal's sole copy change uses conditional delivery
wording, avoiding a false email-success claim. Layout/styles are unchanged.

Ten-minute process-local IP/account limits bound OTP guesses and resend requests,
with a bounded map. Multi-instance deployments still need shared gateway limits.
Provider rejection clears only the matching code, not an unrelated newer code.
Production OTP mail uses QED_CREDENTIAL_EMAIL_FROM and fails closed without it.
OTP/provider payload/recipient logging was removed from that helper. Passwords
retain the existing lowercase/digit/minimum-eight policy with a 72-byte bcrypt cap.

## Teacher provisioning verification

Actual local Express/JWT/bcrypt/controllers/models, with isolated database, email
and audit doubles, verify authorized Admin creation through both aliases, validation,
server-owned identity, transaction ordering, schema-readiness refusal, rollback,
duplicate/concurrent creation, password hash, TEACHER role, forced initial password
change and truthful provider results. Readiness checks were not bypassed or relaxed.

A newly created Teacher is read back through the actual Admin users-list route,
authenticates with its generated password through the actual login route, and
reads its name through the actual Teacher dashboard summary router. Its signed
identity receives 403 from Admin users-list and login-frequency routes; the users
denial performs zero database calls. Browser fixtures verify one creation POST,
one post-success list read, no split registration, truthful failure feedback,
Teacher shell access and rejection of Admin navigation. These are complementary
isolated checks, not a single live-database/browser end-to-end persistence claim.

## Exact files modified in this checkpoint

Frontend root: C:/Users/Mavys/Downloads/QED_System/QED_front_end

- src/shared/components/manage_password/OtpVerificationModal.tsx
- tests/account-recovery-acceptance.spec.ts (new)
- playwright.acceptance.config.ts
- playwright.acceptance-build.config.ts
- QED-ACCOUNT-RECOVERY-VERIFICATION.md (new)

Backend root: C:/Users/Mavys/Downloads/QED_System/thesis_qed

- src/modules/authentication/accountRecovery.controller.js (new)
- src/modules/authentication/recoveryRateLimit.js (new)
- src/modules/authentication/authentication.controller.js
- src/modules/authentication/authentication.middleware.js
- src/services/mailer.service.js (OTP helper only in this checkpoint)
- test/accountRecoverySecurity.test.js (new)
- test/accountProvisioningSecurity.test.js (Teacher workflow addition)
- test/credentialDeliverySecurity.test.js (OTP sender/failure additions)
- docs/ACCOUNT-PROVISIONING-SECURITY.md

## Executed verification

| Gate | Result / boundary |
| --- | --- |
| Pre-change isolated backend baseline | 393/393 passed in this checkpoint |
| Focused recovery | 54/54 passed; actual router/JWT, DB/email doubles |
| Focused provisioning | 149/149 passed; actual router/JWT/bcrypt, DB/email doubles |
| Focused mailer | 13/13 passed; provider double |
| Combined focused backend | 216/216 passed |
| Complete isolated backend | 452/452 passed; zero skips/failures |
| Focused browser recovery + provisioning | 16/16 passed; mocked APIs/auth |
| Complete configured source acceptance | 597/597 passed; mocked APIs/auth and isolated hook fixtures |
| Complete fresh-production acceptance | 267/267 passed; mocked APIs/auth, fresh dist |
| TypeScript | npx tsc -b passed independently and in build |
| Fresh production build | npm run build passed; includes bundle guard |
| Scoped frontend lint | OTP modal, new browser spec and both configs passed |
| Backend syntax | All eight changed JavaScript files passed node --check |

The last verified frontend baselines supplied for comparison were source 589 and
production 259; eight new browser cases increase each total by eight. Those old
frontend counts are historical baselines, not a rerun of the unmodified checkout
in this checkpoint. Source completed in 11.5 minutes; fresh production in 6.4
minutes. Both final JSON reports have zero unexpected, skipped and flaky cases;
Playwright retries remain zero.
No retries, assertions or bundle caps were weakened. Existing Calendar, Analytics,
Principal migrations and Admin Dashboard are covered by the complete suites.
The backend has no configured ESLint gate; syntax checks were used for its changed
files. Whole-checkout frontend lint is not certified clean: the earlier documented
authentication-service no-explicit-any issue is outside this checkpoint and unchanged.

Exploratory failures: the original three backend reproductions failed as expected.
The first new browser run passed four and failed four because my new assertion
incorrectly expected every dialog to disappear after reset; the existing login
dialog correctly remains. The corrected assertion checks reset-dialog closure,
login-dialog visibility and all three exact API calls. The subsequent focused
16-case run passed. Intermediate backend runs passed 396, 451 and 452 tests as
coverage grew. No failed application assertion was concealed. The source browser
Teacher hard-navigation fixture emitted four Failed-to-fetch console messages
while leaving the old page; its route assertions passed. No console-clean Teacher
dashboard/data-performance certification is claimed by that fixture.

## Bundle measurements

| Gzip bytes | Previous verified build | Fresh build | Unchanged cap |
| --- | ---: | ---: | ---: |
| Public eager closure | 133411 | 133427 (+16) | 135349 |
| Admin eager beyond public | 141464 | 141474 (+10) | 151512 |

No dependency was installed. The only frontend runtime change is recovery copy;
there is no new frontend fetching/cache implementation or changed polling. Public
Query isolation and lazy Admin Dashboard boundaries remain guarded. These are
bundle measurements, not real-backend latency/CPU benchmarks.

## Database, email and release boundaries

No mysql, mysqld or docker executable is available. The configured database is
remote and was not accessed. In-memory doubles verify SQL intent, ownership,
transaction order and rollback; they cannot prove real MySQL persistence,
collation/date behavior, privileges, locking or connection-loss outcomes. An
isolated representative InnoDB integration run remains required before deployment.
No real account, school record, password, cookie, reset token or provider secret
was logged. Browser APIs/authentication were mocked; no real-backend browser
acceptance or inbox delivery is claimed. Provider acceptance is not inbox receipt.

Remaining production actions:

- Rotate JWT_SECRET/restart all instances to revoke tokens obtainable before the
  previously corrected public privileged-registration vulnerability. Audit old
  accounts separately; no credentials or live records were changed here.
- Verify isolated MySQL provisioning and recovery, including actual date precision,
  conditional-update affectedRows and transaction-readiness metadata/privileges.
- Configure a verified sender and test safe credential/recovery delivery and the
  production cookie/CORS/HTTPS environment. Confirm failure and retry operations.
- Add shared deployment rate limiting for multiple processes, with correct trusted
  proxy/IP configuration. Generic bodies do not constitute constant-time responses.
- Existing session JWT revocation after ordinary password reset is not redesigned:
  reset tokens are invalidated, but existing normal sessions retain their existing
  expiry behavior. Credential email retains the prior temporary-password contract.
- The existing xlsx issue is a separate follow-up. The manual localhost/Render
  toggle remains unchanged and selects localhost; this is not a Render release
  artifact. No API configuration change was authorized in this checkpoint.

The development migration can resume after review: all required regression gates
are green. This checkpoint does not certify production readiness or actual MySQL
persistence. No migration, stage, commit, push or deployment was performed.

## Preservation audit

Compared against the task-start status/hash snapshots, only the files listed above
changed or were added. All other pre-existing dirty/untracked files retain their
hashes, including Calendar/Analytics authorization and existing Query migrations.
Generated tracked screenshots were initially clean and restored after both runs.
Both HEADs and empty indexes are unchanged. The untouched API toggle SHA-256 is
CD1575285D7C5243F17D68FF960F38EBE983E813C14997D0FDDE59638E887C5D.

Evidence: C:/Users/Mavys/AppData/Local/Temp/qed-recovery-20261012 contains before
snapshots, initial reproductions, focused/full run logs and result JSON files.

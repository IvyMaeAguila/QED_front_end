# Admin User Management / Teacher creation — security stop

Date: 2026-10-12. Status: BLOCKED before application changes or Query migration.

## Required stopping condition

The approved request says to stop immediately for unresolved serious security or
data-integrity issues. Dependency review exposed shared registration and arbitrary
account deletion risks. A Teacher-only fix cannot establish the required Admin
security boundary while leaving public privileged registration unchanged. Repair
requires a separate coherent account-provisioning security scope, including all
roles, credential delivery and rollback ownership/atomicity.

## Reproduced findings

Tests used actual local Express routers, JWT verification and controllers with
injected database/model/email/audit doubles. No .env, live database, mail provider,
real identity, production credentials or production records were accessed.

1. POST /api/auth/register has no authentication/authorization middleware. Its
   controller accepts the supplied role, inserts authentication credentials and
   returns a signed JWT. An unauthenticated request selecting ADMIN returned 201;
   JWT verification confirmed ADMIN. Using that token against the unchanged,
   already secured GET /api/analytics/login-frequency returned 200. That endpoint's
   Admin check is working; the vulnerability is issuance of trusted Admin tokens.
2. POST /api/user/addUser uses verifyToken without an Admin role gate. A synthetic
   signed TEACHER caller reached profile creation and received 201. The actual
   role model create operation was replaced with a deterministic inert double.
3. On duplicate profile email, createUser calls rollbackAuthAccount with the
   untrusted request body userId. A Teacher caller supplied an unrelated fixture
   ID and received 409; the database double recorded DELETE FROM
   qed_authentication WHERE id = ? using exactly that ID. No row was deleted.
4. Static inspection: sendCredentialsEmail unconditionally chooses a hard-coded
   DEV_EMAIL_OVERRIDE over the intended recipient. The form nevertheless claims
   credentials were sent to the new user's email. No email delivery was attempted.

Other user-record edit/delete/read routes likewise have only JWT verification;
these require authorization review in the provisioning correction, not an
unsupported claim that fixing addUser alone secures user management.

## Existing flow and dependency review

The form validates required name, gender (non-Admin), email and contact, generates
credentials, POSTs /api/auth/register, then POSTs /api/user/addUser with userId,
name, role, email, contact, status, gender and credential-mail fields. Authentication
hashing uses bcrypt. Registration and profile insertion are separate operations;
profile errors may roll back the supplied auth ID. Success refetches UsersContext.
The current eager Admin UsersProvider is also observed by Dashboard startup;
list, detail, form and Principal-conflict checks share that provider. A future
migration must preserve lazy Query bundle isolation and avoid two list caches.
Search/filter/pagination are presentation-owned until server parameters exist.

Reviewed roadmap, invalidation map, API inventory and completed Admin Dashboard
report. Previous migrations/security fixes/API toggle remain unchanged.

## Executed checks and limits

Four isolated security reproductions above passed their assertions. Evidence:
C:/Users/Mavys/AppData/Local/Temp/qed-admin-users-20261012/security-probe.cjs
C:/Users/Mavys/AppData/Local/Temp/qed-admin-users-20261012/security-probe.log

These are vulnerability reproductions, NOT passing security acceptance tests.
Actual MySQL persistence, email delivery and Teacher login were not verified.
No application migration or repair was attempted after the mandatory stop.
Full source/production/backend suites, TypeScript/build, lint and bundle gates
were not rerun: the task stopped during pre-implementation analysis. The supplied
581/251/236 baseline remains historical, not a new verification result.
No new Query keys, invalidation, request-count improvement or bundle change.

## Exact task changes and next scope

Only this report was added: QED-ADMIN-USERS-SECURITY-BLOCKERS.md.
No frontend/backend application file, API toggle, test assertion or dependency
changed. No stage, commit, push, deployment or live operation.

Do not treat this checkout as production-ready based on earlier migration gates.
Recommended prerequisite: authorize a dedicated shared account-provisioning
security correction covering Admin-only registration, all user-management role
checks, trustworthy profile/auth linkage, safe rollback/transaction behavior,
credential recipient configuration and isolated role/login/integrity regressions.
Resume User Management Query migration only after that checkpoint passes.

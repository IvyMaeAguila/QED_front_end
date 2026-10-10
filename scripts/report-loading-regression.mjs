import fs from 'node:fs';
import crypto from 'node:crypto';
const folder = 'loading-screenshots/audit/';
const json = name => JSON.parse(fs.readFileSync(folder + name));
const cold = json('cold-clean-current-summary.json');
const coldFailures = cold.filter(run => run.status !== 'passed').length;
const fixedCold = json('cold-fixed-final-summary.json');
const before = json('role-downloads-current.json');
const after = json('role-downloads-fixed.json');
const networkBefore = json('role-network-current.json');
const networkAfter = json('role-network-fixed.json');
const budget = json('part-c-bundle-budget.txt');
const times = ['before', 'current', 'fixed'].map(stage => json(`startup-${stage}.json`));
const fullPath = folder + 'part-c-final-suite.txt';
const raw = fs.existsSync(fullPath) ? fs.readFileSync(fullPath) : null;
const clean = raw?.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const summaries = clean?.match(/\d+ (?:passed|failed|skipped)(?: \([^\r\n]*\))?/g);
const summary = summaries?.slice(-3).join('; ') ?? 'Full suite not run yet';
const kb = value => (value / 1000).toFixed(3);
const sec = value => (value / 1000).toFixed(3);
const roleRows = Object.keys(before.roles).map(role => {
  const old = before.roles[role], now = after.roles[role], key = role.toUpperCase();
  return `| ${role} | ${kb(old.beyondPublic.rawBytes)} / ${kb(old.beyondPublic.gzipBytes)} | ${kb(now.beyondPublic.rawBytes)} / ${kb(now.beyondPublic.gzipBytes)} | ${kb(networkBefore.roles[key].scriptTotal.rawBytes)} / ${kb(networkBefore.roles[key].scriptTotal.gzipBytes)} | ${kb(networkAfter.roles[key].scriptTotal.rawBytes)} / ${kb(networkAfter.roles[key].scriptTotal.gzipBytes)} |`;
}).join('\n');
const timingRows = times.map(time => `| ${time.stage} | ${sec(time.median.loginVisibleMs)} | ${sec(time.median.loginToSkeletonMs)} | ${sec(time.median.loginToDataMs)} |`).join('\n');
const coldRows = cold.map(run => `| ${run.run} | ${sec(run.navigation.durationMs)} | ${sec(run.main.durationMs)}${run.status === 'failed' ? ' (timeout)' : ''} | ${sec(run.navigationToMainMs)}${run.status === 'failed' ? ' (censored)' : ''} | ${run.status} |`).join('\n');
const report = `# Narrow Part A regression follow-up — 2026-10-10

Scope authorized by the latest user decision: fix Part A, isolate Add Subject ten times first, preserve every test assertion/threshold/timing, no data prefetch or other-role browser code, fixed bundle budgets, one additional full run only. Main/remotes/deployment untouched; branch codex/finish-loading-verification. Earlier pending-permission notes below are historical and superseded.

## Cold diagnosis

Ten separate CLI invocations each started a fresh Vite server and browser against an archive of untouched current commit 67a3c5b. Reporter only observed existing Playwright step times; no test/fixture edits and no tracing overhead in these ten. ${10 - coldFailures} passes, ${coldFailures} failures: a real cold compilation slowdown produces a flaky pass/fail at the existing 5000ms assertion. Navigation-to-main times include the real navigation; failed values are censored at timeout, not successful first-render times. The first exploratory ten runs overlapped the throttled-login diagnostic, so they were repeated without another diagnostic running; original cold-current-* and startup-current-exploratory.json evidence is retained, not used as the final isolated result. Clean evidence: cold-clean-current-*; the final current startup sample was also remeasured alone.

| Run | Navigation s | Main assertion s | Navigation to main/end s | Result |
| --- | ---: | ---: | ---: | --- |
${coldRows}

Separate trace: 205 requests, 179 source-module requests; auth responses ~9ms, source transforms waited up to 2374ms. The dev graph recursively discovers uncompiled modules after auth. This source-transformation cost is development-environment-only; production serves built JS. Evidence: cold-current-trace.zip and cold-current.network. Production has a separate bandwidth/parse cost, not dismissed as a test issue.

Development fix: explicitly finish static source transforms before advertising HTML readiness. It neither executes protected components nor sends browser/page data requests. All four role roots are transformed server-side; the browser still receives only its authenticated role. Static imports are parsed from transformed JS, excluding dynamic controllers and optional libraries. This deliberately moves compilation into dev-server readiness; it is not a claim that total dev-server startup is free. Entire isolated CLI runs took 29.1s, 26.5s and 25.8s, including readiness. No fixture was changed. Final independent cold reruns: ${fixedCold.map(run => `${run.status}, navigation ${sec(run.navigation.durationMs)}s + main wait ${sec(run.main.durationMs)}s = ${sec(run.navigationToMainMs)}s`).join('; ')}. Intermediate unsuccessful warmup approaches and their actual timings are retained in cold-fixed-*.json/txt.

## Production changes and full downloads

Role/static-dependency modulepreload already ran at the first successful auth response; built Vite dependency maps already included the full static closure. No page controller or page-data request was moved earlier. Production groups modules by their exact role audience sets and coalesces shared/public modules without duplicating them. Only source audit descriptions (regions) are omitted from runtime registry output; source classifications, registry load functions and all tests remain intact. Recharts/XLSX/ExcelJS remain outside every role eager closure. No layout, effect, route, API or calculation source file changed.

Entry before this fix: ${kb(before.entry.rawBytes)} raw / ${kb(before.entry.gzipBytes)} gzip kB. After: ${kb(budget.entry.rawBytes)} / ${kb(budget.entry.gzipBytes)} kB facade. The meaningful complete public eager closure is ${kb(before.publicTotal.rawBytes)} / ${kb(before.publicTotal.gzipBytes)} before, ${kb(budget.entryEagerClosure.rawBytes)} / ${kb(budget.entryEagerClosure.gzipBytes)} after. Its gzip grows within the unchanged 135349-byte ceiling; the entry ceiling remains 112153 bytes. A tiny facade does not represent the full initial download.

All sizes below are decimal kB, raw / calculated Node gzip level 6. The HTTP harness actually transfers uncompressed content. Eager totals exclude public code; first-skeleton request totals INCLUDE public code, controllers already requested, and optional chart code requested by that point. The latter inventory includes in-flight requests, not a claim that every response finished at that instant.

| Role | Eager beyond public before | Eager beyond public after | Scripts requested by skeleton before | Scripts requested by skeleton after |
| --- | ---: | ---: | ---: | ---: |
${roleRows}

Every role chunk, shared/vendor chunk, import edge and eager composition is listed in role-downloads-{current,fixed}.json. Actual first-skeleton requests, scripts AND CSS/images, are listed individually with byte sizes in role-network-{current,fixed}.json. Current network inventory was reproduced from an archive of unmodified commit 67a3c5b in a temporary directory (no checkout/main changes); its production build output is part-c-current-reconstruction-build.txt. Gzip/hash noise of a few bytes in the reconstructed build is retained honestly.

Largest pre-fix contributors: Teacher's full role preview graph (581kB beyond public), shared Header chunk (157kB, including registry/shared UI), Subject Records (54kB), Attendance Records (43kB); Parent Child Detail (128kB) and Pet Quiz (94kB); Principal Dashboard (46kB). After coalescing, Teacher's own eager chunk and the common role UI dominate. Principal also requests deferred Recharts after chart mount; it is not an eager role dependency. Complete per-file rankings are in the JSON inventories.

## Slow 4G / 4x CPU

Same harness/profile: 150ms RTT, 1.6Mbps download, 750kbps upload, 4x CPU, 320ms mocked teacher data response, three cold browser contexts, median. Login content is measured from navigation; skeleton/data from Login click. Original baseline is 417100a. Current remeasurement is 67a3c5b. Historical prior current measurements (startup-after.json) remain intact too.

| Version | Login content s | Teacher skeleton s | Teacher first data s |
| --- | ---: | ---: | ---: |
${timingRows}

**Target not reached.** The measured achieved result is ${sec(times[2].median.loginToSkeletonMs)}s / ${sec(times[2].median.loginToDataMs)}s; this is not claimed as an absolute mathematical optimum. Teacher still needs ${kb(after.roles.Teacher.beyondPublic.rawBytes)}kB of real shared page compositions before its registered route skeleton can render. At 200000 bytes/s, that code alone has a ${(after.roles.Teacher.beyondPublic.rawBytes / 200000).toFixed(2)}s transfer lower bound, before latency, competition, parsing/evaluation at 4x CPU, bootstrap settling, and the lazy controller/data round trip. Those costs explain the remaining delay. A route-composition loading architecture change or production compression policy needs separate scope; neither was smuggled into this fix. No data prefetching was used.

## Verification

No new tests, fixture changes, assertion/timing/threshold edits, skips, deletions or weakened checks in this follow-up. Existing Add Subject case failed on current code in ${coldFailures}/10 clean independent starts and passed all final isolated reruns AND the full run. Existing seven bootstrap/lazy and two budget cases were used while iterating. Historical nine new Part A tests retain their recorded old-code/mutation proof in LOADING-BEFORE-COVERAGE.json.

Final full suite (one additional invocation, no retries): ${summary}. Raw, unedited output: part-c-final-suite.txt. All 580 source/test/config and 13 tooling hashes were unchanged during the run. Two failures remain: loading.spec.ts variable text size 4 expected transient revealed but observed settled; teacher-subjects.spec.ts 375 dark measured a 6.671875px card Y shift against the unchanged <=1px limit. Neither was dismissed as a flake or fixed after the single authorized full run. Failure contexts are saved as part-c-failure-*.md. Frozen inputs and post-run comparison: part-c-input-freeze.txt / part-c-input-check.txt / part-c-tooling-check.json. Production build/guard: part-c-final-build.txt; final unchanged-app rebuild: part-c-post-verification-build.txt. Nine action/upload spinners and determinate graph are unchanged. Pet Quiz gameplay is preserved under the user's exact decision: “Preserve game animations; require zero remaining loading animations (recommended)”.

Uncertified: requested 1.5s-added teacher latency target; the two failed checks above (so no full-suite certification); real backend timing/data and deployed compression/network behavior; absolute optimal latency floor; late chart code arrival after data has loaded and dark radar preview visual parity from the previous report; exhaustive optional-region combinations. Teacher Subjects 375 dark loaded screenshot was not refreshed because its geometry assertion failed before capture. Full route inventory, classifications, spinner list, screenshot matrix and original mutation evidence below remain applicable; current route/screenshot results are part-c-route-status.json and part-c-screenshot-validation.json.
`;
function prepend(file, section) {
  const marker = '<!-- PART-C-REGRESSION -->';
  const end = '<!-- END-PART-C-REGRESSION -->';
  const original = fs.readFileSync(file, 'utf8').replace(new RegExp(`${marker}[\\s\\S]*?${end}\\s*`), '');
  fs.writeFileSync(file, `${marker}\n${section}\n${end}\n\n${original}`);
}
prepend('LOADING-REPORT.md', report);
prepend('LOADING-PROGRESS.md', `# Current regression checkpoint\n\nLatest user authorization supersedes prior pending-decision notes. Narrow Part A fix implemented; tests unchanged; no data prefetch, main/remotes/deployment untouched. Final isolated results: ${fixedCold.map(run => run.status).join(', ')}. Full run: ${summary}. See LOADING-REPORT.md and loading-screenshots/audit/part-c-*.txt. Build: npm run build. Allowed targeted checks were Add Subject isolation, bootstrap-loading.spec.ts (including lazy cases), bundle-budget.spec.ts. One additional full invocation only. Commit on codex/finish-loading-verification, no push. Performance goal remains unmet; measured results and transfer floor are recorded, not certified as meeting target.`);
prepend('LOADING-SPEC.md', `## Latest regression authorization\n\nKeep the existing 5000ms Add Subject assertion and every other assertion/threshold/timing unchanged. No fixture change unless proven environment-only and recorded. No page-data prefetch. Role chunk plus all static dependencies start at the earliest authenticated role response; never load another role's browser code. Fixed gzip budgets remain entry 112153 bytes and entry eager closure 135349 bytes. Compare teacher against baseline skeleton 1.55s / data 2.15s, goal added delay about 1.5s. Same Slow 4G/4x profile, report achieved numbers if unmet. Ten isolated fresh-server runs before edits; iteration only isolated failing case, bootstrap/lazy, budget and production build; exactly one additional full suite at end. Only loading branch may be committed; main/remotes/deployment untouched. All prior geometry/motion/classification decisions stand.`);
prepend('DESIGN-AUDIT.md', `## Part C regression audit\n\nNo regions/routes/layouts reclassified or changed. Production-only removal of registry region descriptions reduces shipped text; the complete source audit and tests retain every classification and reason. Role audience chunk grouping preserves role boundaries and deferred libraries; detailed eager compositions/imports are in role-downloads-fixed.json. Dev-only static module warmup changes readiness, not browser protected rendering, data effects or any fixture/assertion. See LOADING-BEFORE-COVERAGE.json partCRegression for environmental proof and exact cold timings. Pet Quiz gameplay preserved by explicit user decision.`);
prepend('LOADING.md', `## Production and development loading\n\nRole preloading begins when auth returns the role. Vite modulepreloads that role's static dependency closure; page controllers and data effects remain lazy. Production coalesces identical audience groups and excludes audit-only region prose from runtime output. Never add another role's code or optional heavy libraries to the eager path. Development HTML readiness waits for static source compilation; dynamic controllers/libraries are excluded. This warmup is server-side and is not a page-data prefetch. All original skeleton rules below stand.`);
const coveragePath = folder + 'LOADING-BEFORE-COVERAGE.json';
const coverage = JSON.parse(fs.readFileSync(coveragePath));
coverage.partCRegression = {
  baselineCommit: '67a3c5bb4a7904f017f875ab72162f08e44e9273',
  coldRuns: cold, fixedColdRuns: fixedCold,
  diagnosis: `Real cold source compilation slowdown, flaky at unchanged 5000ms main assertion: ${10 - coldFailures} pass / ${coldFailures} fail in clean isolated runs. Separate trace auth ~9ms; source response wait up to 2374ms. First exploratory measurements overlapped another diagnostic and are retained separately.`,
  fixtureChanges: [], testChanges: [], assertionThresholdTimingChanges: [],
  environmentalChange: { file: 'vite.config.ts', change: 'Static server-side source compilation before HTML readiness', proof: 'cold-current.network: /src TSX waits occur only in Vite dev; production graph contains built JS. No browser code/data prefetch. Entire fixed CLI times 29.1/26.5/25.8s include the moved compilation cost.', before: 'cold-clean-current-summary.json', after: 'cold-fixed-final-summary.json' },
  newTests: 0, inheritedNewTestProof: 'roleBundleFollowup',
  fullSuite: { summary, raw: 'part-c-final-suite.txt', sha256: raw ? crypto.createHash('sha256').update(raw).digest('hex') : null },
  performanceGoalMet: false, startup: times,
};
fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + '\n');
console.log(summary);

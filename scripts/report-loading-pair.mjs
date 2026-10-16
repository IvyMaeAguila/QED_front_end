import fs from 'node:fs';
import crypto from 'node:crypto';
const dir = 'loading-screenshots/audit/';
const read = name => JSON.parse(fs.readFileSync(dir + name, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const revisions = ['a94f3d0', '67a3c5b', '417100a'];
const isolated = revisions.map(commit => ({commit, ...Object.fromEntries(['subjects', 'text'].map(name => {
  const file = commit === 'a94f3d0' && name === 'subjects' ? 'part-d-current-subjects.json' : `part-d-${commit}-${name}.json`;
  const stats = read(file).stats;
  return [name, {passed:stats.expected,failed:stats.unexpected,skipped:stats.skipped,report:file,sha256:hash(dir+file)}];
}))}));
fs.writeFileSync(dir+'part-d-isolation-summary.json', JSON.stringify({method:'Each exact existing case repeated ten times, one worker, zero retries, independent browser contexts, one Vite server per case/commit batch. No overlapping test or measurement jobs. Historical trees from git archive, node_modules junction only; current tests run in original checkout. No test/assertion/timing edits during baseline repetitions.', isolated, excludedInfrastructureAttempt:{report:'part-d-a94f3d0-subjects.txt',reason:'Archive development-server readiness timed out before any test executed; zero cases, not counted. Current-commit ten actual repetitions subsequently ran in original checkout.'}},null,2)+'\n');
const before = read('part-d-slow-css-before-text-0.json');
const after = read('part-d-slow-css-after-text-0.json');
const timings = result => ({mountedMs:result.data.mounted,navigationReady:result.boxes[0].navigationReady,phases:result.data.events.filter((e,i,a)=>!i||e.phase!==a[i-1].phase).map(e=>({phase:e.phase,afterMountMs:e.time-result.data.mounted})),status:result.status});
const fixed = fs.existsSync(dir+'part-d-fixed-pair.json') ? read('part-d-fixed-pair.json').stats : null;
const finalName=fs.existsSync(dir+'part-d-final-suite-retry.txt')?'part-d-final-suite-retry':'part-d-final-suite';
const fullFile=dir+finalName+'.txt';
const raw = fs.existsSync(fullFile) ? fs.readFileSync(fullFile) : null;
const summary = raw?.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g,'').match(/^\s*\d+ (?:passed|failed|skipped)(?: \([^\r\n]*\))?\s*$/gm)?.map(s=>s.trim()).join('; ') ?? 'Not run yet; exactly one final invocation authorized.';
const ledger = read('LOADING-BEFORE-COVERAGE.json');
ledger.partDRemainingFailures = {
  scope:'Accepted latency cost; two test-environment readiness fixes only; no production source/build config changes, data prefetch, assertions, thresholds or loading timing changes. Main/remotes/deployment untouched.',
  isolated,
  subjectCause:{evidence:'part-d-probe-subjects-0.json',before:{x:33,y:406,width:309,height:218,fontStatus:'loading',pageY:115,sectionHeadingHeight:16},after:{x:33,y:412.671875,width:309,height:218,fontStatus:'loaded',pageY:121.671875,sectionHeadingHeight:16},relativeCardY:291,reason:'Remote Inter font arrival reflows the real shell above the page. The first boundingBox precedes fonts.ready; screenshot waits for fonts.ready before data release. Card and group heading heights are unchanged; this is not a skeleton size/count or role-chunk regression.',fix:'Only /teacher/subjects in routeReady waits for document.fonts.ready, preserving the actual font and every geometry assertion.',afterProof:['part-d-font-ready-after-subjects-0.json','part-d-font-ready-after-subjects-1.json','part-d-font-ready-after-subjects-2.json']},
  textCause:{reason:'Vite-injected CSS @import can finish after the primitive fixture mounts. page.goto waits for document load while its real 1200ms request/reveal/swap cycle runs. Delaying only the external font stylesheet 2200ms reproduces settled at navigation return with unchanged reveal and minimum-duration logic.',controlledEnvironmentOnly:'A diagnostic beforeEach delayed fonts.googleapis.com traffic, without altering any test body, assertion, threshold, request delay or production implementation. Before/after use the same delayed resource. These diagnostic-only hooks were applied to an archive and removed afterward; they are not full-suite fixtures.',before:timings(before),after:timings(after),fix:'Harness waits for window load and real font registration before mounting, so its request clock starts after navigation resources are ready. All 60/320/900/1200/1500ms test delays and 200/400/200ms loader rules stay unchanged.'},
  fixedPair:fixed,
  full:{summary,rawFile:fullFile,sha256:raw?hash(fullFile):null,exit:fs.existsSync(dir+finalName+'-exit.txt')?fs.readFileSync(dir+finalName+'-exit.txt','utf8').trim():null,initialStartup:'part-d-final-suite.json: zero cases executed, readiness timeout; raw log retained. User subsequently replied continue to the explicit retry request, authorizing one retry invocation.'},
  assertions:'No .spec.ts changed. No assertions, thresholds, timing constants, tests, skips or retries changed. Only tests/harness.tsx and the route-specific readiness branch in tests/fixtures/routeReady.ts changed.',
};
fs.writeFileSync(dir+'LOADING-BEFORE-COVERAGE.json',JSON.stringify(ledger,null,2)+'\n');
const table=isolated.map(r=>`| ${r.commit} | ${r.subjects.passed} / ${r.subjects.failed} | ${r.text.passed} / ${r.text.failed} |`).join('\n');
const block=`<!-- PART-D-FIXTURES -->
# Remaining full-suite failures — latest checkpoint

This decision supersedes earlier pending-permission and latency-target notes below. Latency miss accepted: no further bundle/latency work and no data prefetching. Branch: codex/finish-loading-verification; main/remotes/deployment untouched.

| Commit | Subject 375px dark: pass / fail | Variable text size 4: pass / fail |
| --- | ---: | ---: |
${table}

Ten exact-case isolated repetitions per cell, one worker, zero retries and no skipped cases. On 67a3c5b, one failure is the existing cold shell-readiness timeout and one is the exact 6.671875px Y shift. On 417100a, both failures are the exact Y shift. The card defect therefore predates the role split. A separate archive startup timeout executed zero tests and is excluded, with raw evidence retained. Full details: part-d-isolation-summary.json and raw per-commit logs.

Subject root cause: late external Inter font swap moves the real page and card together by 6.671875px, with card-relative Y unchanged at 291px, width 309px, height 218px and group-heading height 16px. Before geometry used fallback typography; screenshot then awaited loaded fonts before release. Fixture now awaits the real fonts only on this route. No production layout, dimension or classification workaround. Probe before failed; three delayed-font after runs passed with identical card geometry.

Text root cause: the fixture's 1200ms request starts before Vite's external CSS @import finishes, while page.goto awaits document load. A controlled 2200ms stylesheet delay reproduces the exact settled observation: reveal at ${(timings(before).phases.find(p=>p.phase==='revealed').afterMountMs).toFixed(1)}ms, swap at ${(timings(before).phases.find(p=>p.phase==='swapping').afterMountMs).toFixed(1)}ms, navigation returns at ${before.boxes[0].navigationReady.time.toFixed(1)}ms already settled. After waiting for navigation resources before harness mount, the same delayed-resource test passes. This is an observation/setup race, not a loading-engine timing regression. No production source or .spec.ts changed, no assertion/threshold/timing changes. Exact before/after evidence and fixture rationale are in LOADING-BEFORE-COVERAGE.json.

Accepted known cost: cold cache, Slow 4G (150ms RTT, 1.6Mbps down / 750kbps up), 4x CPU, three-sample medians with 320ms mocked page-data response and uncompressed local HTTP: navigation → login content **3.8162s**; login → Teacher first skeleton **4.4329s**; login → Teacher first data **5.5911s**. Original pre-split numbers: 14.8893s / 1.5517s / 2.1521s respectively. These are recorded costs, not performance targets met. Real cache headers on the hashed assets are required for returning users. Deployed compression/cache behavior remains unverified; no deployment performed.

After-fix isolated results: ${fixed ? `${fixed.expected} passed, ${fixed.unexpected} failed, ${fixed.skipped} skipped` : 'pending'}. Final full suite: **${summary}**. ${raw?`Raw unedited output: ${fullFile}.`:'Freeze inputs before the final full invocation; do not edit them during it.'} The initial final invocation stopped at server readiness before any cases executed (part-d-final-suite.json and .txt retained). The user replied "continue" to the explicit request to retry once; part-d-final-suite-retry records that authorized retry.

Build: npm run build (includes fixed bundle budget). Allowed targeted checks: exact two cases, bootstrap-loading.spec.ts (includes lazy handoff), bundle-budget.spec.ts. Screenshot matrix: 67 groups × 2 themes × 2 widths × 2 states = 536 files; final validation is part-d-screenshot-validation.json. Existing accepted limits remain: no real backend/deployment certification, no further latency tuning; historical chart-preview parity caveats below remain uncertified.
<!-- END-PART-D-FIXTURES -->
`;
for(const file of ['LOADING-REPORT.md','LOADING-PROGRESS.md']){
 const old=fs.readFileSync(file,'utf8').replace(/<!-- PART-D-FIXTURES -->[\s\S]*?<!-- END-PART-D-FIXTURES -->\s*/,'');
 fs.writeFileSync(file,block+'\n'+old);
}
const auditBlock=`<!-- PART-D-CLASSIFICATION -->
## Subject geometry classification confirmation

The /teacher/subjects assignment card remains FIXED-SIZE: existing 218px height and no data-dependent outer height. No widths, truncation or dimensions were added. Group heading and collection remain VARIABLE because section labels can wrap and returned groups/card counts vary. The failing fixture uses a 16px single-line section heading in both states; its card moves only because late external font loading reflows the real shell above it. All page-relative geometry stays identical. Awaiting the actual font in the route-specific fixture removes mixed-typography measurements; the strict 1px x/y/width/height assertion remains exact. No new conflict class or relaxed classification.

Primitive text remains VARIABLE (60px typical three-line skeleton; size-4 loaded field is 40px). One instant data-dependent resize at swap is allowed, with unchanged surroundings. Fix waits for navigation/font setup before mounting the test harness; 200ms reveal delay, 400ms minimum, 200ms fade and 1200ms test request are unchanged. See part-d probes and LOADING-BEFORE-COVERAGE.json for before/after proof.
<!-- END-PART-D-CLASSIFICATION -->
`;
const audit=fs.readFileSync('DESIGN-AUDIT.md','utf8').replace(/<!-- PART-D-CLASSIFICATION -->[\s\S]*?<!-- END-PART-D-CLASSIFICATION -->\s*/,'');
fs.writeFileSync('DESIGN-AUDIT.md',auditBlock+'\n'+audit);
console.log(JSON.stringify({isolated,fixed,full:summary},null,2));

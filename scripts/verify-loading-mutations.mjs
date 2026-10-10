import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd().replaceAll(String.fromCharCode(92), '/');
const css='src/shared/loading/skeleton.css', engine='src/shared/loading/LoadingRegion.tsx';
const dashboard='src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.loading-view.tsx';
const pixels='tests/design-pixels.ts';
const exact=(from,to)=>source=>{if(!source.includes(from))throw new Error('Mutation anchor missing: '+from);return source.replace(from,to);};
const append=text=>source=>source+'\n'+text+'\n';
const cases=[
 ['token-colors','17: token-only skeleton colors','tests/design-contract.spec.ts','^skeleton CSS has token-only colors$',css,append('.sk-primitive { background: #abcdef; }')],
 ['surface-contrast','18: neutral contrast on real surfaces','tests/loading.spec.ts','^light: neutral contrast on every surface$',css,append('.sk-primitive { background: var(--surface-card) !important; }')],
 ['route-registration','19: every route has a connected registered composition','tests/route-coverage.spec.ts','every real route', 'src/shared/loading/routeSkeletons.ts',exact('    skeleton: "TeacherDashboardHomeComposition",','')],
 ['region-match','20: named pending and loaded regions match','tests/teacher-subject-loading.spec.ts','^teacher subject 375 light keeps real score sheet and controls$',engine,exact('data-sk-region={name ??','data-sk-region={pending ? "invented-pending-region" : name ??')],
 ['known-session','21: static and session-known content stays real','tests/finishing-contract.spec.ts','session identity and fixed attendance labels',dashboard,exact('loading={!user?.name && loading}','loading={loading}')],
 ['chart-shape','22: ring silhouettes match the loaded chart','tests/finishing-contract.spec.ts','attendance skeleton retains the real ring',css,append('.sk-ring { mask-image: none !important; }')],
 ['text-widths','23: adjacent text bars have distinct widths','tests/loading.spec.ts','text line metrics and adjacent widths',css,append('.sk-text { width: 100% !important; }')],
 ['shimmer-pixels','24: measurable silhouettes and feathered shimmer edges','tests/design-contract.spec.ts','^light: pixel area survives',css,append('.sk-sweep { background: linear-gradient(90deg,var(--sk-transparent) 49%,var(--sk-shine) 49%,var(--sk-shine) 75%,var(--sk-transparent) 75%) !important; }')],
 ['fixed-overlay','25: fixed shape pixels fit the loaded field','tests/overlay-contract.spec.ts','^fixed overlay 375 light:',css,append('.sk-text { width: calc(100% + 64px) !important; }')],
 ['removed-spinner','27: removed spinner implementations cannot return','tests/removed-loading-guard.spec.ts','removed splash',css,append('.qed-spinner { opacity: 1; }')],
 ['runtime-spinner','28: no page-data spinners or Loading text','tests/design-contract.spec.ts','^teacher 375 light: static content and spinner guard$',engine,exact('{failed ? <>{layout?', '<span className="animate-spin">Loading...</span>{failed ? <>{layout?')],
 ['refetch-opacity','29: stale rows dim through opacity after the delay','tests/finishing-contract.spec.ts','table refetch keeps old rows',engine,source=>{const next=source.replaceAll('phase === "dimmed" ? .6 : 1','phase === "dimmed" ? 1 : 1');if(next===source)throw new Error('opacity anchor missing');return next;}],
 ['static-landing','26/static: public landing has no invented loading region','tests/static-routes.spec.ts','^/ 375 light: static public page', 'src/features/Landing/LandingPage.loading-view.tsx',exact('data-sk-region="landing-content"','data-sk-region="invented-landing"')],
 ['static-login','26/static: real login form remains present','tests/static-routes.spec.ts','^/login 375 light: static public page','src/features/auth/LoginPanel.loading-view.tsx',exact('data-sk-region="login-content"','data-sk-region="invented-login"')],
 ['static-help','21/static: unchanged role help labels remain readable','tests/static-routes.spec.ts','^ADMIN help 375 light:', 'src/features/profiles/admin/pages/help/HelpSupportPage.loading-view.tsx',exact('Frequently asked questions','Removed static label')],
 ['static-topic','21/static: unchanged quest choices remain real','tests/static-routes.spec.ts','^topic support 375 light:', 'src/features/profiles/parent/pages/Student/Academic/TopicSupportChoice.loading-view.tsx',exact('eyebrow="Study Quest"','eyebrow="Removed choice"')],
 ['negative-area','24/negative: pixel helper detects washed-out silhouettes','tests/design-contract.spec.ts','negative control: shine blending',pixels,exact('expect(visibleArea / staticArea, `${name}: visible area at ${phase * 100}%`).toBeGreaterThanOrEqual(.9);','void visibleArea;')],
 ['negative-edge','24/negative: pixel helper independently detects hard edges','tests/design-contract.spec.ts','negative control: a hard shimmer edge',pixels,exact('expect(maximumJump, `${name}: hard interior sweep edge`).toBeLessThanOrEqual(8);','void maximumJump;')],
 ['negative-overlay','25/negative: overlay helper rejects outside-box pixels','tests/overlay-contract.spec.ts','fixed overlay rejects a shape extending',pixels,exact('expect(outside / pixels.length, `${name}: fixed shape pixels outside the matching loaded box`).toBeLessThanOrEqual(.02);','void outside;')],
 ['negative-height','16/negative: height and CLS mismatch control is meaningful','tests/loading.spec.ts','negative control catches wrong fixed height', 'tests/harness.tsx',exact('const mismatch = params.has("mismatch");','const mismatch = false;')],
 ['negative-clock','16/negative: unsynchronized-clock control is meaningful','tests/loading.spec.ts','negative control catches unsynchronized shimmer','tests/harness.tsx',exact('const sync = !params.has("unsynchronized");','const sync = true;')],
 ['fixed-classification','8/safety: content-dependent tiles cannot be marked fixed','tests/teacher-dashboard.spec.ts','classification rejects fixed regions','src/features/profiles/teacher/pages/dashboard/components/Statcards.tsx',exact('boxShadow: isPrimary','minHeight: String(value).length > 2 ? 160 : undefined,\n              boxShadow: isPrimary')],
 ['auto-classification','8/safety: AUTO-COLUMN must have measured native variation','tests/auto-columns.spec.ts','auto-column classification requires observed',css,append('table { table-layout: fixed !important; }')],
 ['repeat-column-cache','8/cache: repeated native columns use successful widths','tests/auto-columns.spec.ts','auto columns: 1 rows,', 'src/shared/loading/reservations.ts',exact('columns.delete(view); columns.set(view, widths);','columns.delete(view);')],
 ['bootstrap-reduced','bootstrap/iii: reduced motion is fully static','tests/bootstrap-loading.spec.ts','bootstrap reduced motion',css,exact('animation: none !important;','animation: qed-bootstrap-fade var(--sk-shimmer) var(--sk-ease) infinite alternate !important;')],
 ['bootstrap-protection','bootstrap/v: protected components stay unmounted before auth','tests/bootstrap-loading.spec.ts','protected components and page requests', 'src/routes/AppRouter.tsx',exact('  return <QedBootstrapLoader loading={isLoading}>','  if (isLoading) return <><QedBootstrapLoader loading={true}>{null}</QedBootstrapLoader><TeacherSection /></>;\n  return <QedBootstrapLoader loading={isLoading}>')],
 ['busy-accessibility','13/a11y: pending regions expose aria-busy','tests/loading.spec.ts','aria busy, hidden reservation',engine,exact('aria-busy={pending}','aria-busy={false}')],
 ['variable-reservation','8/variable: reveal does not resize reserved variable geometry','tests/loading.spec.ts','^variable text, data size 4:',css,append('.sk-region[data-sk-phase="revealed"] { padding-bottom: 32px; }')],
];
const output=root+'/loading-screenshots/audit/LOADING-BEFORE-COVERAGE.json';
const ledger=JSON.parse(fs.readFileSync(output,'utf8'));
ledger.mutationPolicy='Accepted by user 2026-10-10: one mutation proof per unchanged/static/negative-control test family. No claim that every individual case failed original code.';
ledger.mutationChecks??=[];
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
for(const [id,family,spec,pattern,file,mutate] of cases){
 const grep=pattern.replace(/^\^/,'');
 if(process.argv[2]==='--describe'){
  const record=ledger.mutationChecks.find(x=>x.id===id);
  if(!record)continue;
  const original=fs.readFileSync(root+'/'+file,'utf8'),mutant=mutate(original);
  let first=0,last=0;
  while(first<original.length&&first<mutant.length&&original[first]===mutant[first])first++;
  while(last<original.length-first&&last<mutant.length-first&&original[original.length-1-last]===mutant[mutant.length-1-last])last++;
  record.mutationPatch={offset:first,removed:original.slice(first,original.length-last),inserted:mutant.slice(first,mutant.length-last)};
  record.mutatedSha256=hash(mutant);
  continue;
 }
 if(process.argv[2]&&id!==process.argv[2])continue;
 if(ledger.mutationChecks.some(x=>x.id===id&&x.mutationRejected&&x.restoredPass))continue;
 const target=root+'/'+file, original=fs.readFileSync(target,'utf8'), beforeHash=hash(original);
 const mutant=mutate(original);
 const run=(suffix)=>{
  const log=`loading-mutation-${id}-${suffix}.log`,fd=fs.openSync(root+'/'+log,'w');
  let result;
  try{result=spawnSync(process.execPath,[root+'/node_modules/@playwright/test/cli.js','test',spec,'--grep',grep,'--reporter=line','--workers=1'],{cwd:root,stdio:['ignore',fd,fd],timeout:120000});}finally{fs.closeSync(fd);}
  const text=fs.readFileSync(root+'/'+log,'utf8');
  return {log,exitCode:result.status,error:result.error?.message,summary:text.match(/^\s+\d+ (?:failed|passed) \([^\r\n]+\)/m)?.[0].trim(),failedTitles:[...text.matchAll(/^\s+\d+\) (tests[^\r\n]+)/gm)].map(m=>m[1]),hasFailure:/^\s+\d+ failed/m.test(text),hasPass:/^\s+\d+ passed/m.test(text),text};
 };
 let failed;
 try{fs.writeFileSync(target,mutant);failed=run('broken');}finally{fs.writeFileSync(target,original);}
 if(hash(fs.readFileSync(target,'utf8'))!==beforeHash)throw new Error('Restoration hash mismatch '+id);
 if(failed.exitCode===0||!failed.hasFailure||!failed.failedTitles.length)throw new Error('Mutation did not produce a real test assertion failure: '+id+'; '+failed.log);
 const restored=run('restored');
 const record={id,family,implementation:file,mutationDescription:mutant===original?'unchanged':family,command:`npx playwright test ${spec} --grep ${JSON.stringify(grep)} --reporter=line --workers=1`,mutationLog:failed.log,mutationExitCode:failed.exitCode,failedTitles:failed.failedTitles,restoredLog:restored.log,restoredExitCode:restored.exitCode,restoredSummary:restored.summary,restoredSha256:beforeHash,mutationRejected:true,restoredPass:restored.exitCode===0&&restored.hasPass};
 ledger.mutationChecks=ledger.mutationChecks.filter(x=>x.id!==id);ledger.mutationChecks.push(record);fs.writeFileSync(output,JSON.stringify(ledger,null,2)+'\n');
 console.log(JSON.stringify({id,mutationRejected:true,restoredPass:record.restoredPass,restoredSummary:record.restoredSummary}));
 if(!record.restoredPass)throw new Error('Restored family failed: '+id+'; '+restored.log);
}
console.log('Mutation checks recorded: '+ledger.mutationChecks.length);
fs.writeFileSync(output,JSON.stringify(ledger,null,2)+'\n');

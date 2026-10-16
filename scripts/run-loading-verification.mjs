import fs from 'node:fs';
import { spawn } from 'node:child_process';
const folder = 'loading-screenshots/audit/';
async function run(name, command, args) {
  const log = fs.createWriteStream(folder + name + '.txt');
  const child = spawn(command, args, {stdio:['ignore','pipe','pipe'],env:process.env});
  child.stdout.on('data',data=>log.write(data));
  child.stderr.on('data',data=>log.write(data));
  const code = await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  await new Promise(resolve=>log.end(resolve));
  fs.writeFileSync(folder+name+'-exit.txt',String(code)+'\n');
  console.log(name,code);
  if(code!==0) process.exit(code ?? 1);
}
if(process.argv[2]==='checks'){
  await run('part-d-build',process.env.ComSpec??'cmd.exe',['/d','/s','/c','npm run build']);
  await run('part-d-bootstrap-budget',process.execPath,['node_modules/@playwright/test/cli.js','test','tests/bootstrap-loading.spec.ts','tests/bundle-budget.spec.ts','--workers=1','--retries=0','--reporter=list']);
} else if(process.argv[2]==='full' || process.argv[2]==='full-retry') {
  const name=process.argv[2]==='full-retry'?'part-d-final-suite-retry':'part-d-final-suite';
  if(fs.existsSync(folder+name+'.txt')) throw new Error('This authorized invocation has already been started. Do not overwrite or rerun.');
  await run(name,process.execPath,['node_modules/@playwright/test/cli.js','test','--workers=1','--retries=0','--reporter=list,json']);
} else throw new Error('Expected checks or full');

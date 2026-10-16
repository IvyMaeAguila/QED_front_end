import fs from 'node:fs';
const dir='loading-screenshots/audit/';
const groups=JSON.parse(fs.readFileSync(dir+'LOADING-SCREENSHOT-MATRIX.json','utf8'));
const full=JSON.parse(fs.readFileSync(dir+'part-d-final-suite-retry.json','utf8'));
const started=new Date(full.stats.startTime).getTime();
const result={groups:groups.length,expected:groups.length*8,files:0,missing:[],wrongDimensions:[],notRefreshed:[]};
for(const group of groups){
 group.missing=[];
 for(const width of [375,1280]) for(const theme of ['light','dark']) for(const state of ['skeleton','loaded']){
  const file=`loading-screenshots/${group.prefix}-${width}-${theme}-${state}.png`;
  if(!fs.existsSync(file)){result.missing.push(file);group.missing.push(file);continue;}
  const data=fs.readFileSync(file);result.files++;
  if(data.toString('hex',0,8)!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==width||data.readUInt32BE(20)<1) result.wrongDimensions.push(file);
  if(fs.statSync(file).mtimeMs<started) result.notRefreshed.push(file);
 }
}
fs.writeFileSync(dir+'part-d-screenshot-validation.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(dir+'LOADING-SCREENSHOT-MATRIX.json',JSON.stringify(groups,null,2)+'\n');
const routes=JSON.parse(fs.readFileSync(dir+'part-c-route-status.json','utf8'));
for(const route of routes.routes){route.status=full.stats.unexpected===0&&full.stats.skipped===0?'PASS':'UNCERTIFIED';route.reason='Registered route covered by Part D final suite; see full-suite summary and remaining certification limits in LOADING-REPORT.md.';}
fs.writeFileSync(dir+'part-d-route-status.json',JSON.stringify(routes,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(result.missing.length||result.wrongDimensions.length||result.notRefreshed.length)process.exitCode=1;

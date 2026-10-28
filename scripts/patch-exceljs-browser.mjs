import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const manifest=JSON.parse(fs.readFileSync(new URL('./exceljs-browser-patch.json',import.meta.url),'utf8'));
const digest=value=>createHash('sha256').update(value).digest('hex');
export function patchExcelJS(projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')) {
  const pkg=JSON.parse(fs.readFileSync(path.join(projectRoot,'node_modules/exceljs/package.json'),'utf8'));
  if(pkg.version!==manifest.version)throw new Error('Unsupported ExcelJS version; review browser security backport before upgrading.');
  const files=manifest.artifacts.map(a=>({...a,target:path.join(projectRoot,a.file),source:fs.readFileSync(path.join(projectRoot,a.file),'utf8')}));
  if(files.every(a=>digest(a.source)===a.after))return {changed:false};
  if(!files.every(a=>digest(a.source)===a.before))throw new Error('ExcelJS checksum mismatch or mixed patch state; no files changed.');
  // Validate every result before any write; offsets apply only to pinned upstream bytes.
  const outputs=files.map(a=>{let result=a.source;for(const c of [...a.changes].sort((x,y)=>y.position-x.position))result=result.slice(0,c.position)+c.text+result.slice(c.position);
    // Upstream maps describe unpatched code. Do not advertise stale mappings.
    result=result.replace(/\/\/# sourceMappingURL=[^\r\n]+/g,'');
    if(digest(result)!==a.after)throw new Error('ExcelJS patch output mismatch; no files changed.');
    return {...a,result};});
  for(const a of outputs)fs.writeFileSync(a.target,a.result);
  return {changed:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(patchExcelJS().changed?'ExcelJS browser bounds backport applied.':'ExcelJS browser backport verified; no files changed.');

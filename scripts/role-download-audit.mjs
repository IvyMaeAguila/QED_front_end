import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
const stage = process.argv[2];
const chunks = JSON.parse(fs.readFileSync('dist/bundle-audit.json'));
const byName = new Map(chunks.map(chunk => [chunk.fileName, chunk]));
function closure(name, seen = new Set()) {
  if (seen.has(name)) return seen;
  seen.add(name);
  byName.get(name)?.imports.forEach(file => closure(file, seen));
  return seen;
}
const entry = chunks.find(chunk => chunk.isEntry);
const publicFiles = closure(entry.fileName);
const describe = file => {
  const chunk = byName.get(file), bytes = fs.readFileSync('dist/' + file);
  return { file, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length, imports: chunk.imports, compositions: chunk.modules.filter(module => module.endsWith('.loading-view.tsx')), vendors: chunk.modules.filter(module => module.includes('node_modules/')) };
};
const sum = files => files.reduce((total, file) => ({ rawBytes: total.rawBytes + file.rawBytes, gzipBytes: total.gzipBytes + file.gzipBytes }), { rawBytes: 0, gzipBytes: 0 });
const roles = {};
for (const role of ['Admin', 'Teacher', 'Principal', 'Parent']) {
  const root = chunks.find(chunk => chunk.modules.some(module => module.endsWith(`/routes/roles/${role}Routes.tsx`)));
  const files = [...closure(root.fileName)].map(describe).sort((a, b) => b.rawBytes - a.rawBytes);
  const incremental = files.filter(file => !publicFiles.has(file.file));
  roles[role] = { roleChunk: root.fileName, total: sum(files), beyondPublic: sum(incremental), files, eagerCompositions: files.flatMap(file => file.compositions) };
}
const result = { stage, entry: describe(entry.fileName), publicTotal: sum([...publicFiles].map(describe)), roles };
fs.writeFileSync(`loading-screenshots/audit/role-downloads-${stage}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(roles).map(([role, value]) => [role, { total: value.total, beyondPublic: value.beyondPublic, biggest: value.files.slice(0, 5).map(({file, rawBytes}) => ({file, rawBytes})) }])), null, 2));

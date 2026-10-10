import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';
export const budget = { entryGzipBytes: 112153, entryEagerClosureGzipBytes: 135349 };
export function checkRegistry(source = fs.readFileSync('src/shared/loading/routeSkeletons.ts', 'utf8')) {
  const ast = ts.createSourceFile('routeSkeletons.ts', source, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) if (ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly)
    throw new Error('Registry must contain metadata and lazy references only; eager imports are forbidden');
}
export function inspectBuild() {
  checkRegistry();
  const chunks = JSON.parse(fs.readFileSync('dist/bundle-audit.json', 'utf8'));
  const measured = new Map(chunks.map(chunk => {
    const bytes = fs.readFileSync('dist/' + chunk.fileName);
    return [chunk.fileName, { ...chunk, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length }];
  }));
  const entry = chunks.find(chunk => chunk.isEntry);
  if (!entry) throw new Error('Missing production entry');
  function closure(fileName, seen = new Set()) {
    if (seen.has(fileName)) return seen;
    seen.add(fileName);
    measured.get(fileName)?.imports.forEach(dependency => closure(dependency, seen));
    return seen;
  }
  const total = files => [...files].reduce((sum, file) => ({ rawBytes: sum.rawBytes + measured.get(file).rawBytes, gzipBytes: sum.gzipBytes + measured.get(file).gzipBytes }), { rawBytes: 0, gzipBytes: 0 });
  const publicFiles = closure(entry.fileName);
  const entrySize = measured.get(entry.fileName);
  const entryClosure = total(publicFiles);
  if (entrySize.gzipBytes > budget.entryGzipBytes) throw new Error(`Entry gzip ${entrySize.gzipBytes} exceeds ${budget.entryGzipBytes}`);
  if (entryClosure.gzipBytes > budget.entryEagerClosureGzipBytes) throw new Error(`Entry eager closure gzip ${entryClosure.gzipBytes} exceeds ${budget.entryEagerClosureGzipBytes}`);
  const protectedModules = [...publicFiles].flatMap(file => measured.get(file).modules).filter(module => /features\/profiles\/(admin|teacher|principal|parent)\/pages\/.*\.tsx$/.test(module) && !module.endsWith('/settings/context/SettingsContext.tsx'));
  if (protectedModules.length) throw new Error('Protected code in public entry closure: ' + protectedModules.join(', '));
  const roles = {};
  for (const role of ['Admin', 'Teacher', 'Principal', 'Parent']) {
    const chunk = chunks.find(chunk => chunk.modules.some(module => module.endsWith(`/pages/${role}Layout.tsx`)));
    if (!chunk || chunk.isEntry) throw new Error(`Missing isolated ${role} chunk`);
    const files = [...closure(chunk.fileName)].filter(file => !publicFiles.has(file));
    const eagerModules = files.flatMap(file => measured.get(file).modules);
    if (eagerModules.some(module => /node_modules\/(?:recharts|xlsx|exceljs)\//.test(module))) throw new Error(`${role} preview depends on a heavy library`);
    roles[role.toUpperCase()] = { fileName: chunk.fileName, chunk: { rawBytes: measured.get(chunk.fileName).rawBytes, gzipBytes: measured.get(chunk.fileName).gzipBytes }, eagerDownloadBeyondPublic: total(files) };
  }
  return { compression: 'node:zlib gzip, default level 6; bytes, not rounded Vite estimates', budget, entry: { fileName: entry.fileName, rawBytes: entrySize.rawBytes, gzipBytes: entrySize.gzipBytes }, entryEagerClosure: entryClosure, roles };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/check-bundle-budget.mjs')) console.log(JSON.stringify(inspectBuild(), null, 2));

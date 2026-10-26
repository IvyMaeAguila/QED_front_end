import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const productionApiOrigin = 'https://thesis-qed-1.onrender.com';

export function checkApiTarget(chunks, readChunk) {
  const configChunks = chunks.filter(chunk => chunk.modules.some(id => id.replaceAll('\\', '/').endsWith('src/config/api.config.ts')));
  if (configChunks.length !== 1) throw new Error('Expected one bundled API configuration module');
  let configuredOriginPresent = false;
  for (const chunk of chunks) {
    const source = ts.createSourceFile(chunk.fileName, readChunk(chunk.fileName), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = node => {
      if (ts.isStringLiteralLike(node)) {
        const value = node.text;
        if (chunk === configChunks[0] && value === productionApiOrigin) configuredOriginPresent = true;
        if (/https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]):7400(?:[/?#]|$)/i.test(value))
          throw new Error('Production JavaScript contains a loopback API endpoint: ' + chunk.fileName);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  if (!configuredOriginPresent) throw new Error('Bundled API configuration must target the Render production backend');
  return { apiOrigin: productionApiOrigin, configChunk: configChunks[0].fileName, loopbackApiEndpoints: 0 };
}

export function inspectApiTarget(dist = 'dist') {
  const chunks = JSON.parse(fs.readFileSync(path.join(dist, 'bundle-audit.json'), 'utf8'));
  return checkApiTarget(chunks, file => fs.readFileSync(path.join(dist, file), 'utf8'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(JSON.stringify(inspectApiTarget(), null, 2));

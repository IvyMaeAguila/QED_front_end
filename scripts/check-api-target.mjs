import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const productionProxyOrigin = 'https://thesis-qed.vercel.app';

export function checkApiProxy(config) {
  const rules = config.rewrites;
  const index = Array.isArray(rules) ? rules.findIndex(rule => rule.source === '/api/:path*') : -1;
  if (index !== 0 || rules[index].destination !== `${productionProxyOrigin}/api/:path*`)
    throw new Error('Production API proxy must precede the SPA fallback and target the verified backend');
  const headers = config.headers?.find(rule => rule.source === '/api/:path*')?.headers;
  if (!headers?.some(header => header.key.toLowerCase() === 'cache-control' && /\bno-store\b/.test(header.value)))
    throw new Error('Production API responses must disable caching');
  return { source: rules[index].source, destination: rules[index].destination };
}

export function checkApiTarget(chunks, readChunk) {
  const configChunks = chunks.filter(chunk => chunk.modules.some(id => id.replaceAll('\\', '/').endsWith('src/config/api.config.ts')));
  if (configChunks.length !== 1) throw new Error('Expected one bundled API configuration module');
  let sameOriginConfigured = false;
  for (const chunk of chunks) {
    const source = ts.createSourceFile(chunk.fileName, readChunk(chunk.fileName), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = node => {
      // Inspect the actual config property; a decoy string or comment cannot pass.
      if (chunk === configChunks[0] && ts.isPropertyAssignment(node) &&
          (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)) && node.name.text === 'baseURL') {
        if (!ts.isStringLiteralLike(node.initializer) || node.initializer.text !== '')
          throw new Error('Production API configuration must use the same-origin proxy');
        sameOriginConfigured = true;
      }
      if (ts.isStringLiteralLike(node) && /https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]):7400(?:[/?#]|$)/i.test(node.text))
        throw new Error('Production JavaScript contains a loopback API endpoint: ' + chunk.fileName);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  if (!sameOriginConfigured) throw new Error('Bundled API configuration must use the same-origin proxy');
  return { apiBaseURL: '', transport: 'same-origin', configChunk: configChunks[0].fileName, loopbackApiEndpoints: 0 };
}

export function inspectApiTarget(dist = 'dist') {
  const chunks = JSON.parse(fs.readFileSync(path.join(dist, 'bundle-audit.json'), 'utf8'));
  const proxy = checkApiProxy(JSON.parse(fs.readFileSync('vercel.json', 'utf8')));
  return { ...checkApiTarget(chunks, file => fs.readFileSync(path.join(dist, file), 'utf8')), proxy };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(JSON.stringify(inspectApiTarget(), null, 2));

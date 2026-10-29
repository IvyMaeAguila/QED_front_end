import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { checkApiTarget, productionApiOrigin } from '../check-api-target.mjs';

const source = fs.readFileSync(new URL('../../src/config/api.config.ts', import.meta.url), 'utf8');
function configured(env) {
  const compiled = ts.transpileModule(source.replaceAll('import.meta.env', '__env'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, __env: env }, { timeout: 1000 });
  return exports.API_CONFIG.baseURL;
}
function envFile(mode) {
  const source = fs.readFileSync(new URL('../../.env.' + mode, import.meta.url), 'utf8');
  return { VITE_API_BASE_URL: source.split(/\r?\n/).find(line => line.startsWith('VITE_API_BASE_URL='))?.slice('VITE_API_BASE_URL='.length) };
}
const chunks = [{ fileName: 'api.js', modules: ['src/config/api.config.ts'] }, { fileName: 'other.js', modules: ['src/other.ts'] }];
const inspect = (api, other = '') => checkApiTarget(chunks, file => file === 'api.js' ? api : other);

test('development configuration preserves the localhost API origin', () => {
  assert.equal(configured(envFile('development')), 'http://localhost:7400');
});
test('production configuration targets the verified public Vercel backend', () => {
  assert.equal(configured(envFile('production')), productionApiOrigin);
  assert.equal(productionApiOrigin, 'https://thesis-qed.vercel.app');
});
for (const value of [undefined, '']) test('missing API configuration fails explicitly: ' + String(value), () => {
  assert.throws(() => configured({ VITE_API_BASE_URL: value }), /VITE_API_BASE_URL/);
});
test('bundle guard accepts the production target in the real configuration chunk', () => {
  assert.equal(inspect('const api=' + JSON.stringify(productionApiOrigin)).apiOrigin, productionApiOrigin);
});

test('bundle guard accepts an explicitly configured backend and rejects a stale default bundle', () => {
  const target = 'https://qed-backend.example.vercel.app';
  assert.equal(checkApiTarget(chunks, () => 'const api=' + JSON.stringify(target), target).apiOrigin, target);
  assert.throws(() => checkApiTarget(chunks, () => 'const api=' + JSON.stringify(productionApiOrigin), target), /configured production backend/);
  assert.throws(() => checkApiTarget(chunks, () => '', 'http://localhost:7400'), /HTTPS origin/);
});
for (const host of ['localhost', '127.0.0.1', '[::1]']) test('bundle guard rejects a loopback API target: ' + host, () => {
  assert.throws(() => inspect('const api=' + JSON.stringify('http://' + host + ':7400')), /loopback/);
});
test('bundle guard rejects a loopback endpoint in another emitted chunk', () => {
  assert.throws(() => inspect('const api=' + JSON.stringify(productionApiOrigin), 'const api="http://localhost:7400/api"'), /loopback/);
});
test('a decoy production target in an unrelated chunk does not clear the guard', () => {
  assert.throws(() => inspect('const api="https://wrong.example.invalid"', 'const decoy=' + JSON.stringify(productionApiOrigin)), /configured production backend/);
});
test('a comment is not evidence of a bundled production target', () => {
  assert.throws(() => inspect('// ' + productionApiOrigin), /configured production backend/);
});
test('bundle guard requires the configuration module in the build inventory', () => {
  assert.throws(() => checkApiTarget([], () => ''), /configuration module/);
});

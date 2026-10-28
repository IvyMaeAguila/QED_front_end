import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function service(transport) {
  const source = fs.readFileSync(new URL('../../src/shared/notification/Notification.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source.replaceAll('import.meta.env', '__env'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let connections = 0, disconnected = 0;
  const socket = { on() {}, disconnect() { disconnected++; } };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, __env: { VITE_NOTIFICATION_TRANSPORT: transport },
    require(id) {
      if (id === 'socket.io-client') return { io() { connections++; return socket; } };
      if (id.includes('api.config')) return { API_CONFIG: { baseURL: 'https://backend.example.com' } };
      if (id.includes('boundedFetch')) return { boundedFetch() { throw Error('Unexpected fetch'); } };
      throw Error('Unexpected dependency');
    },
  });
  return { api: exports.notificationService, counts: () => ({ connections, disconnected }) };
}

test('Vercel polling mode does not create a socket; providers retain their existing refresh', () => {
  const f = service('polling');
  f.api.subscribe(1, () => {})();
  assert.equal(f.counts().connections, 0);
  for (const file of ['NotificationContext.tsx', 'AuthenticatedNotificationQueries.tsx']) {
    const source = fs.readFileSync(new URL('../../src/shared/notification/' + file, import.meta.url), 'utf8');
    assert.match(source, /30000|30_000/);
  }
});

test('existing Render/default transport still opens and disposes its socket', () => {
  const f = service(undefined);
  f.api.subscribe(1, () => {})();
  assert.deepEqual(f.counts(), { connections: 1, disconnected: 1 });
});

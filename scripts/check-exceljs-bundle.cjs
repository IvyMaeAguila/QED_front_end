const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { loadProduction } = require('./tests/helpers/exceljs-artifact-access.cjs');
const project = path.resolve(__dirname, '..'), audit = JSON.parse(fs.readFileSync(project + '/dist/bundle-audit.json')), chunks = audit.filter(c => c.modules.some(m => m.includes('/exceljs/')));
assert.equal(chunks.length, 1, 'Expected one ExcelJS production artifact');
assert.ok(chunks[0].modules.some(m => m.endsWith('/exceljs/dist/exceljs.min.js')));
const { uuid: u } = loadProduction(project + '/dist/' + chunks[0].fileName);
for (const api of ['v1', 'v3', 'v4', 'v5']) {
    const args = api === 'v3' || api === 'v5' ? ['QED bounds verification', require('uuid')[api].DNS] : [api === 'v4' ? { random: Array.from({ length: 16 }, (_, i) => i) } : {}];
    const buf = new Uint8Array(1).fill(170);
    assert.throws(() => u[api](...args, buf, 0), e => e.name === 'RangeError');
    assert.deepEqual(Array.from(buf), [170]);
}
assert.ok(fs.readFileSync(project + '/dist/vendor-notices/ExcelJS-UUID-MIT.txt', 'utf8').includes('Permission is hereby granted'));
console.log('ExcelJS production UUID bounds and distributed license notices verified.');

const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), { createRequire } = require('module'), { loadUmd, loadProduction } = require('./helpers/exceljs-artifact-access.cjs');
const root = path.resolve(__dirname, '../..'), variant = 'patched', isPatched = true, r = createRequire(root + '/package.json'), reference = r('uuid');
const cases = [['unminified', root + '/node_modules/exceljs/dist/exceljs.js', loadUmd], ['minified', root + '/node_modules/exceljs/dist/exceljs.min.js', loadUmd]];
if (fs.existsSync(root + '/dist/bundle-audit.json')) {
    const audit = JSON.parse(fs.readFileSync(root + '/dist/bundle-audit.json')), c = audit.find(c => c.modules.some(m => m.includes('/exceljs/')));
    cases.push(['production', root + '/dist/' + c.fileName, loadProduction]);
}
const records = [];
const args = (api) => api === 'v1' ? [{ node: [1, 2, 3, 4, 5, 6], clockseq: 0x1234, msecs: 1577836800000, nsecs: 1234 }] : api === 'v4' ? [{ random: Array.from({ length: 16 }, (_, i) => i) }] : ['Synthetic Peña 女', reference[api].DNS];
const asBytes = id => Array.from(Buffer.from(id.replaceAll('-', ''), 'hex'));
for (const [name, file, load] of cases) {
    const state = load(file), u = state.uuid;
    test(name + ' exposes the same ExcelJS and UUID APIs', () => { assert.equal(typeof state.ExcelJS.Workbook, 'function'); assert.equal(u.v6, undefined); assert.deepEqual(Object.keys(u).sort(), ['NIL', 'parse', 'stringify', 'v1', 'v3', 'v4', 'v5', 'validate', 'version'].sort()); });
    for (const api of ['v1', 'v3', 'v4', 'v5']) {
        test(name + ' ' + api + (isPatched ? ' rejects all out-of-range writes before changing buffers' : ' reproduces legacy unchecked buffer writes'), () => { const invalid = [[0, 0], [1, 0], [15, 0], [16, 1], [32, 17], [32, -1], [32, Infinity], [32, -Infinity]]; for (const type of ['typed', 'array'])
            for (const [length, offset] of invalid) {
                const buf = type === 'typed' ? new Uint8Array(length).fill(0xaa) : Array(length).fill(0xaa), before = JSON.stringify(buf), invoke = () => u[api](...args(api), buf, offset);
                if (isPatched) {
                    assert.throws(invoke, e => e?.name === 'RangeError');
                    assert.equal(JSON.stringify(buf), before);
                }
                else
                    assert.doesNotThrow(invoke);
                records.push({ artifact: name, api, type, length, offset: String(offset), outcome: isPatched ? 'RangeError; buffer unchanged' : 'legacy accepts' });
            } });
        test(name + ' ' + api + ' preserves valid values, buffer identity, offsets and sentinels', () => { const expected = reference[api](...args(api)); assert.equal(u[api](...args(api)), expected); for (const [length, offset] of [[16, 0], [32, 0], [32, 8], [32, 16], [16, undefined]])
            for (const type of ['typed', 'array']) {
                const buf = type === 'typed' ? new Uint8Array(length).fill(0xaa) : Array(length).fill(0xaa), at = offset || 0, ret = u[api](...args(api), buf, offset);
                assert.equal(ret, buf);
                assert.deepEqual(Array.from(buf).slice(at, at + 16), asBytes(expected));
                assert.ok(Array.from(buf).slice(0, at).every(x => x === 0xaa));
                assert.ok(Array.from(buf).slice(at + 16).every(x => x === 0xaa));
            } });
    }
    test(name + ' workbook UUID use remains v4 with no supplied buffer', async () => { state.calls.length = 0; const w = new state.ExcelJS.Workbook(), s = w.addWorksheet('Synthetic'); s.addRows([[1], [2], [3]]); await w.xlsx.writeBuffer(); assert.equal(state.calls.length, 0); s.addConditionalFormatting({ ref: 'A1:A3', rules: [{ type: 'dataBar', priority: 1, cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF800000' }, gradient: false, x14Id: 'attacker-controlled-placeholder', buf: new Uint8Array(1), offset: 9999 }] }); await w.xlsx.writeBuffer(); assert.ok(state.calls.length > 0); assert.ok(state.calls.every(c => c.api === 'v4' && c.args === 0)); records.push({ artifact: name, reachabilityCalls: state.calls.slice() }); });
}

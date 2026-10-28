import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchExcelJS } from '../patch-exceljs-browser.mjs';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const files = ['exceljs.js', 'exceljs.min.js'];
function fixture() { const dir = fs.mkdtempSync(path.join(process.env.QED_SECURITY_FIXTURE_DIR || os.tmpdir(), 'qed-exceljs-patch-')); fs.mkdirSync(path.join(dir, 'node_modules/exceljs/dist'), { recursive: true }); for (const f of files)
    fs.copyFileSync(path.join(project, 'node_modules/exceljs/dist', f), path.join(dir, 'node_modules/exceljs/dist', f)); fs.writeFileSync(path.join(dir, 'node_modules/exceljs/package.json'), JSON.stringify({ version: '4.4.0' })); return dir; }
test('known patched installation is a verified no-op', () => { const before = files.map(f => fs.readFileSync(path.join(project, 'node_modules/exceljs/dist', f))); assert.deepEqual(patchExcelJS(project), { changed: false }); files.forEach((f, i) => assert.deepEqual(fs.readFileSync(path.join(project, 'node_modules/exceljs/dist', f)), before[i])); });
test('unknown or mixed artifact bytes fail before either file is written', t => { const dir = fixture(); t.diagnostic('Retained fixture: ' + dir); fs.appendFileSync(path.join(dir, 'node_modules/exceljs/dist/exceljs.min.js'), '/* deliberate drift */'); const before = files.map(f => fs.readFileSync(path.join(dir, 'node_modules/exceljs/dist', f))); assert.throws(() => patchExcelJS(dir), /checksum mismatch/); files.forEach((f, i) => assert.deepEqual(fs.readFileSync(path.join(dir, 'node_modules/exceljs/dist', f)), before[i])); });
test('unsupported ExcelJS release is rejected', t => { const dir = fixture(); t.diagnostic('Retained fixture: ' + dir); fs.writeFileSync(path.join(dir, 'node_modules/exceljs/package.json'), JSON.stringify({ version: '4.5.0' })); assert.throws(() => patchExcelJS(dir), /Unsupported ExcelJS version/); });

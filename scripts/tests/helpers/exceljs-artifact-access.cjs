const fs = require('fs'), path = require('path'), vm = require('vm'), { createRequire } = require('module');
const r = createRequire(path.resolve(__dirname, '../../../package.json')), ts = r('typescript');
function makeContext() { const calls = [], context = { module: { exports: {} }, exports: {}, Buffer, Uint8Array, ArrayBuffer, TextEncoder, TextDecoder, setTimeout, clearTimeout, setImmediate, clearImmediate, console, crypto: { getRandomValues: a => { for (let i = 0; i < a.length; i++)
            a[i] = (i * 17 + 3) & 255; return a; } } }; context.__qedCaptureUuid = u => { const wrapped = new Proxy(u, { get(t, p) { const val = Reflect.get(t, p); if (['v1', 'v3', 'v4', 'v5'].includes(p))
        return (...args) => { calls.push({ api: p, args: args.length }); return val(...args); }; return val; } }); context.__uuid = wrapped; return wrapped; }; return { context: vm.createContext(context), calls }; }
const pattern = /([A-Za-z_$][\w$]*)\((?:"uuid"|'uuid'|\x60uuid\x60)\)/g;
function instrument(code) { const count = [...code.matchAll(pattern)].length; if (count !== 1)
    throw Error('Expected one internal UUID import, got ' + count); return code.replace(pattern, (_m, callee) => 'globalThis.__qedCaptureUuid(' + callee + '("uuid"))'); }
function loadUmd(file) { const state = makeContext(); vm.runInContext(instrument(fs.readFileSync(file, 'utf8')), state.context, { timeout: 15000 }); if (!state.context.__uuid)
    throw Error('UUID capture did not initialize'); return { ...state, uuid: state.context.__uuid, ExcelJS: state.context.module.exports }; }
function loadProduction(file) { const state = makeContext(), cache = new Map(); function load(filename) { if (cache.has(filename))
    return cache.get(filename); const code = fs.readFileSync(filename, 'utf8'), sf = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS), imports = [], edits = []; for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
        const dep = path.resolve(path.dirname(filename), st.moduleSpecifier.text);
        const value = load(dep), slot = imports.push(value) - 1, clause = st.importClause;
        let replacement = '';
        if (clause?.name)
            replacement += 'const ' + clause.name.text + '=__imports[' + slot + '].default;';
        if (clause?.namedBindings) {
            if (ts.isNamespaceImport(clause.namedBindings))
                replacement += 'const ' + clause.namedBindings.name.text + '=__imports[' + slot + '];';
            else
                for (const el of clause.namedBindings.elements)
                    replacement += 'const ' + el.name.text + '=__imports[' + slot + '][' + JSON.stringify(el.propertyName?.text ?? el.name.text) + '];';
        }
        edits.push({ start: st.getStart(sf), end: st.end, text: replacement });
    }
    else if (ts.isExportDeclaration(st)) {
        if (st.moduleSpecifier)
            throw Error('Unsupported reexport');
        let text = '';
        for (const el of st.exportClause?.elements ?? [])
            text += 'Object.defineProperty(__exports,' + JSON.stringify(el.name.text) + ',{enumerable:true,get:()=>' + (el.propertyName?.text ?? el.name.text) + '});';
        edits.push({ start: st.getStart(sf), end: st.end, text });
    }
    else if (ts.isExportAssignment(st))
        edits.push({ start: st.getStart(sf), end: st.end, text: '__exports.default=(' + st.expression.getText(sf) + ');' });
} let changed = code; for (const e of edits.sort((a, b) => b.start - a.start))
    changed = changed.slice(0, e.start) + e.text + changed.slice(e.end); if (filename === path.resolve(file))
    changed = instrument(changed); const fn = vm.runInContext('(function(__imports,__exports){' + changed + ';return __exports;})', state.context, { timeout: 15000 }); const exports = {}; cache.set(filename, exports); fn(imports, exports); return exports; } const out = load(path.resolve(file)); if (!state.context.__uuid)
    throw Error('Production UUID capture did not initialize'); return { ...state, uuid: state.context.__uuid, ExcelJS: out.default ?? out, exports: out }; }
module.exports = { loadUmd, loadProduction };

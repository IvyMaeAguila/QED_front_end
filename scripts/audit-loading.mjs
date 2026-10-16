import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(path.join(root, 'src')).filter(f => /\.(tsx?|css)$/.test(f));
const baseline = Object.fromEntries(files.map(f => [path.relative(root, f).replaceAll('\\', '/'), fs.readFileSync(f, 'utf8')]));
const artifact = process.env.QED_LOADING_AUDIT_DIR;
if (artifact) {
  fs.mkdirSync(artifact, { recursive: true });
  if (!fs.existsSync(path.join(artifact, 'qed-loading-before.json'))) fs.writeFileSync(path.join(artifact, 'qed-loading-before.json'), JSON.stringify(baseline));
}
const router = ts.createSourceFile('AppRouter.tsx', baseline['src/routes/AppRouter.tsx'], ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const lazySources = Object.fromEntries([...baseline['src/routes/AppRouter.tsx'].matchAll(/const (\w+) = lazy\(\(\) => import\("([^"]+)"\)/g)].map(m => [m[1], path.posix.normalize('src/routes/' + m[2]) + '.tsx']));
const routes = [];
function visit(node, prefix = '') {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    if (opening.tagName.getText(router) === 'Route') {
      const attrs = opening.attributes.properties;
      const routePath = attrs.find(a => a.name?.getText(router) === 'path')?.initializer;
      const index = attrs.some(a => a.name?.getText(router) === 'index');
      const childPath = routePath && ts.isStringLiteral(routePath) ? routePath.text : '';
      const full = childPath.startsWith('/') ? childPath : (prefix + '/' + childPath).replace(/\/$/, '');
      const element = attrs.find(a => a.name?.getText(router) === 'element')?.initializer?.getText(router) ?? '';
      const component = /<([A-Z]\w*)/.exec(element)?.[1];
      if (component && !(node.children?.some(c => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)))) {
        const source = lazySources[component] ?? Object.keys(baseline).find(f => f.endsWith('/' + component + '.tsx')) ?? 'src/routes/AppRouter.tsx';
        routes.push({ path: index ? prefix : full, component, source });
      }
      if (ts.isJsxElement(node)) for (const c of node.children) visit(c, full || prefix);
      return;
    }
  }
  ts.forEachChild(node, c => visit(c, prefix));
}
visit(router);
// LoginPage is an inline adapter around the lazy LoginPanel.
const login = routes.find(route => route.path === '/login');
if (login) { login.component = 'LoginPanel'; login.source = lazySources.LoginPanel; }
const loaders = Object.entries(baseline).filter(([f]) => f.endsWith('.tsx')).flatMap(([file, text]) => text.split('\n').flatMap((line, i) => /animate-spin|animate-pulse|Loading[. …]|Skeleton|QedLoader|QuizLoading/.test(line) && !line.trim().startsWith('//') ? [{ file, line: i + 1, text: line.trim() }] : []));
if (artifact) fs.writeFileSync(path.join(artifact, 'qed-loading-discovery.json'), JSON.stringify({ routes, loaders }, null, 2));
console.log(JSON.stringify({ routes, loaderFiles: [...new Set(loaders.map(l => l.file))], loaderCount: loaders.length }, null, 2));

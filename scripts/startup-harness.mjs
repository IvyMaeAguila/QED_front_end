import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
export async function serveBuild(port) {
  const server = http.createServer((req, res) => {
    const requested = path.resolve('dist', '.' + new URL(req.url, 'http://localhost').pathname);
    const file = requested.startsWith(path.resolve('dist') + path.sep) && fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.resolve('dist/index.html');
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' })[path.extname(file)] ?? 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise(resolve => server.close(resolve)) };
}
export function bundleAudit() { return JSON.parse(fs.readFileSync('dist/bundle-audit.json', 'utf8')); }
export function rolesInChunks(files) {
  const roles = new Set();
  for (const chunk of bundleAudit().filter(chunk => files.some(file => file.endsWith('/' + chunk.fileName))))
    for (const module of chunk.modules) {
      if (module.endsWith('/admin/pages/help/HelpSupportPage.loading-view.tsx')) continue; // One shared help view, audience supplied by the current role.
      if (module.endsWith('/principal/pages/teachers/TeacherSchedulePage.loading-view.tsx')) continue; // Existing Admin UserView also renders this shared teacher profile.
      const role = module.match(/features\/profiles\/(admin|teacher|principal|parent)\/pages\/(?:.*\.loading-view|(?:Admin|Teacher|Principal|Parent)Layout)\.tsx$/);
      if (role) roles.add(role[1]);
    }
  return [...roles].sort();
}
export async function prepareLogin(page, role = 'TEACHER', holdData = true) {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const requests = [];
  page.on('request', request => { if (request.resourceType() === 'script') requests.push(request.url()); });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('**/socket.io/**', route => route.abort());
  const user = { id: '1', user_name: 'teacher', userName: 'teacher', role, name: 'Marie Dela Cruz', token: 'fixture', mustChangePassword: false };
  await page.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    let body = [];
    if (pathname === '/api/auth/me') body = { user: null };
    else if (pathname === '/api/auth/login') body = { user };
    else if (pathname.startsWith('/api/user-profile')) body = user;
    else if (pathname.startsWith('/api/teacherDashboard')) {
      if (holdData) await gate; else await new Promise(resolve => setTimeout(resolve, 320));
      if (pathname.endsWith('/summary')) body = { success: true, name: user.name };
      else if (pathname.endsWith('/stats')) body = { success: true, advisoryClassCount: 21, totalStudents: 21, totalClasses: 21 };
      else if (pathname.endsWith('/attendance')) body = { success: true, hasAdvisory: true, present: 10, absent: 0, late: 0 };
      else body = { success: true, data: [] };
    } else if (pathname.includes('notifications')) body = { notifications: [], unreadCount: 0 };
    else if (pathname.startsWith('/api/classes')) body = { success: true, data: [] };
    else if (holdData) await gate;
    await route.fulfill({ json: body });
  });
  return { requests, release };
}
export async function login(page) {
  // A public lazy fallback contains the same fields; interact only with the mounted login controller.
  await page.waitForFunction(() => !document.querySelector('[data-route-skeleton]'));
  await page.getByPlaceholder('e.g. TC_maria.delacruz').fill('teacher');
  await page.getByPlaceholder('••••••••').fill('fixture-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

import { expect, type Page } from '@playwright/test';
import { mockAdminDashboard } from './adminDashboard';
import { requestLedger } from './requestLedger';
export const userRows = [
  { id: '1', role: 'TEACHER', firstName: 'Teacher', lastName: 'Fixture', middleName: '', email: 'teacher@example.invalid', contactNumber: '00000000000', status: 'Active', gender: 'Female', lastLogin: null },
  { id: '1', role: 'PARENT', firstName: 'Parent', lastName: 'Fixture', middleName: '', email: 'parent@example.invalid', contactNumber: '00000000000', status: 'Inactive', gender: 'Male', lastLogin: null },
  { id: '1', role: 'PRINCIPAL', firstName: 'Principal', lastName: 'Fixture', middleName: '', email: 'principal@example.invalid', contactNumber: '00000000000', status: 'Active', gender: 'Male', lastLogin: null },
  { id: '1', role: 'ADMIN', firstName: 'Admin', lastName: 'Fixture', middleName: '', email: 'admin@example.invalid', contactNumber: '00000000000', status: 'Active', gender: null, lastLogin: null },
];
// Deterministic browser APIs only. Security/persistence are separate backend gates.
export async function mockAdminUsers(page: Page, dark = false, holdAuth = false) {
  const dashboard = await mockAdminDashboard(page, dark, holdAuth);
  await page.route('**/api/academic-year/getAcademicYear',route=>route.fulfill({json:{status:'success',data:{id:26,label:'2026–2027',status:'Active',startDate:null,endDate:null}}}));
  const ledger = requestLedger(page, path => path === '/api/user/usersList');
  const profileLedger = requestLedger(page, path => /^\/api\/teachers\/\d+$/.test(path));
  const state = { rows: structuredClone(userRows), status: 200, calls: 0, queries: [] as string[], mutationStatus: 200, mutations: [] as { method: string; path: string; payload: Record<string, unknown> }[], gate: Promise.resolve(), release: () => {}, writeGate: Promise.resolve(), releaseWrite: () => {}, teacherLookups: 0, profileReads: 0 };
  await page.route('**/api/user/usersList', async route => {
    const status = state.status, rows = structuredClone(state.rows); state.calls++; state.queries.push(new URL(route.request().url()).search); ledger.intercept(route.request());
    await state.gate;
    await route.fulfill({ status, json: status === 200 ? { success: true, data: rows } : { message: `Synthetic users ${status}` } });
  });
  await page.route(/\/api\/user\/(?:addUser|editUser\/[^/]+|deleteUser\/[^/]+)$/, async route => {
    const path = new URL(route.request().url()).pathname, payload = route.request().postDataJSON() as Record<string, unknown>;
    const method = route.request().method(); state.mutations.push({ method, path, payload });
    const status = state.mutationStatus; await state.writeGate;
    if (status !== 200) return route.fulfill({ status, json: { message: 'Synthetic write failed' } });
    if (path.endsWith('/addUser')) state.rows.push({ ...userRows[0], ...payload, id: '2' } as typeof userRows[number]);
    else if (path.includes('/editUser/')) state.rows = state.rows.map(row => row.id === path.split('/').at(-1) && row.role === payload.role ? { ...row, ...payload } as typeof row : row);
    else if (path.includes('/deleteUser/')) state.rows = state.rows.filter(row => !(row.id === path.split('/').at(-1) && row.role.toLowerCase() === String(payload.role).toLowerCase()));
    await route.fulfill({ status: path.endsWith('/addUser') ? 201 : 200, json: { success: true, data: { id: '2' }, credentialDelivery: 'accepted' } });
  });
  await page.route('**/api/section/getTeachers', route => { state.teacherLookups++; return route.fulfill({ json: { status: 'success', data: state.rows.filter(row => row.role === 'TEACHER').map(row => ({ id: Number(row.id) + 6, user_id: Number(row.id), first_name: row.firstName, last_name: row.lastName, gender: row.gender })) } }); });
  await page.route('**/api/teachers/*', route => { state.profileReads++; profileLedger.intercept(route.request()); const teacherId = new URL(route.request().url()).pathname.split('/').at(-1)!; const teacher = state.rows.find(row => row.role === 'TEACHER' && Number(row.id) + 6 === Number(teacherId)); return route.fulfill({ json: { teacherId, fullName: `${teacher?.firstName ?? 'Missing'} Fixture`, gender: 'Female', room: '', gradeLevel: '', advisorySection: '', advisories: [], schedule: [] } }); });
  return { ...dashboard, dashboardState: dashboard.state, state, ledger, profileLedger,
    hold() { state.gate = new Promise<void>(resolve => { state.release = resolve; }); },
    release() { state.release(); state.gate = Promise.resolve(); },
    holdWrite() { state.writeGate = new Promise<void>(resolve => { state.releaseWrite = resolve; }); },
    releaseWrite() { state.releaseWrite(); state.writeGate = Promise.resolve(); },
    async settled() { await expect.poll(() => ledger.snapshot().every(request => request.terminal !== undefined)).toBe(true); },
  };
}

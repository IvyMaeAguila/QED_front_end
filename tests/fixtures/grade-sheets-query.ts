import { expect, type Page } from '@playwright/test';
import { gradebookSheet } from './gradebooks';
import { requestLedger } from './requestLedger';

// Synthetic, read-only intercepted APIs. Never contacts the real database.
export const sheetEndpoints = ['year', 'periods', 'sheet'] as const;
export type SheetEndpoint = typeof sheetEndpoints[number];
export async function mockGradeSheets(page: Page) {
  const paths = { year: '/api/academic-year/getAcademicYear', periods: '/api/gradesheets/grading-period', sheet: '/api/gradesheets/' };
  const state = { year: { calls: 0, status: 200 }, periods: { calls: 0, status: 200 }, sheet: { calls: 0, status: 200 } };
  const ledger = requestLedger(page, path => Object.values(paths).includes(path));
  const gates: Partial<Record<SheetEndpoint, Promise<void>>> = {}, releases: Partial<Record<SheetEndpoint, () => void>> = {};
  const requests: { endpoint: SheetEndpoint; grade: string | null; section: string | null; period: string | null; year: number }[] = [];
  let year = 1, empty = false, nullSheet = false, noPeriods = false, defaultPeriod: number | null = 1, marker = '';
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const endpoint = sheetEndpoints.find(e => paths[e] === url.pathname);
    if (!endpoint) return route.fallback();
    ledger.intercept(route.request());
    const s = state[endpoint]; s.calls++;
    const status = s.status, id = year, name = marker;
    const grade = url.searchParams.get('gradeLevelId'), section = url.searchParams.get('sectionId'), period = url.searchParams.get('gradingPeriodId');
    requests.push({ endpoint, grade, section, period, year: id });
    const data = structuredClone(gradebookSheet);
    data.sectionName = `${name || 'Maroon'} G${grade} S${section ?? 'all'} T${period} Y${id}`;
    if (name) data.students[0].firstName = name;
    if (empty) data.students = [];
    const body = status !== 200 ? { message: `Synthetic ${endpoint} ${status}` }
      : endpoint === 'year' ? { status: 'success', data: { id, label: `Year ${id}`, status: 'Active' } }
      : endpoint === 'periods' ? { success: true, defaultGradingPeriodId: defaultPeriod, data: noPeriods ? [] : [1, 2, 3].map(n => ({ id: n, term_number: n, term_label: `Term ${n}`, is_active: n === 1, is_submitted: n !== 3 })) }
      : { success: true, data: nullSheet ? { ...data, gradeLevel: null } : data };
    await gates[endpoint];
    await route.fulfill({ status, json: body });
  });
  return {
    state, ledger, requests,
    hold: (e: SheetEndpoint) => { gates[e] = new Promise(resolve => { releases[e] = resolve; }); },
    release: (e: SheetEndpoint) => { releases[e]?.(); delete gates[e]; },
    setYear: (id: number) => { year = id; }, setMarker: (s: string) => { marker = s; },
    setEmpty: () => { empty = true; }, setNull: () => { nullSheet = true; },
    setDefault: (id: number | null) => { defaultPeriod = id; },
    setNoPeriods: () => { noPeriods = true; defaultPeriod = null; },
    async settled(expected: Record<SheetEndpoint, number>) {
      await expect.poll(() => Object.fromEntries(sheetEndpoints.map(e => [e, ledger.snapshot().filter(r => r.path === paths[e] && r.terminal === 'finished').length]))).toEqual(expected);
      expect(Object.fromEntries(sheetEndpoints.map(e => [e, state[e].calls]))).toEqual(expected);
    },
  };
}

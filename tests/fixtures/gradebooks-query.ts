import type { Page } from '@playwright/test';
export const gradebookEndpoints = ['year', 'summaries'] as const;
export type GradebookEndpoint = typeof gradebookEndpoints[number];
export async function mockGradebooks(page: Page) {
    const state = { year: { calls: 0, status: 200 }, summaries: { calls: 0, status: 200 } };
    let yearId = 1, empty = false, marker = 'Maroon';
    const gates: Partial<Record<GradebookEndpoint, Promise<void>>> = {}, releases: Partial<Record<GradebookEndpoint, () => void>> = {};
    await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        const endpoint: GradebookEndpoint | undefined = path === '/api/academic-year/getAcademicYear' ? 'year' : path === '/api/gradesheets/section-grade' ? 'summaries' : undefined;
        if (!endpoint)
            return route.fallback();
        const s = state[endpoint];
        s.calls++;
        const status = s.status;
        const id = yearId, name = marker;
        await gates[endpoint];
        await route.fulfill({ status, json: status !== 200 ? { message: `Synthetic ${endpoint} ${status}` } : endpoint === 'year' ? { status: 'success', data: { id, label: `Year ${id}`, status: 'Active' } } : empty ? [] : [{ gradeLevelId: 1, gradeLevel: 'Grade 1', sections: [{ sectionId: 11, section: name, studentCount: 1, isSubmitted: true, gradingPeriodId: 1 }, { sectionId: 12, section: 'Pending', studentCount: 0, isSubmitted: false, gradingPeriodId: null }] }] });
    });
    return { state, hold: (e: GradebookEndpoint) => { gates[e] = new Promise(r => { releases[e] = r; }); }, release: (e: GradebookEndpoint) => { releases[e]?.(); delete gates[e]; }, setYear: (id: number) => { yearId = id; }, setEmpty: () => { empty = true; }, setMarker: (s: string) => { marker = s; } };
}

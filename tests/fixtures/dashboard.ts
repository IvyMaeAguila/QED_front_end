import { expect, type Page } from "@playwright/test";
import { requestLedger } from "./requestLedger";
import type { ActiveTermRow } from "../../src/features/profiles/principal/pages/dashboard/services/principalDashboard.service";

// MOCKED ONLY. All names, counts and grades are synthetic, read-only fixtures.
export const dashboardPaths = {
  term: "/principal-dashboard/active-term", year: "/academic-year/getAcademicYear",
  total: "/student/total-student", overview: "/principal-dashboard/overview-summary",
  today: "/principal-dashboard/getTodaysAttendance", attendance: "/principal-dashboard/getAttendanceByGrade",
  top: "/principal-dashboard/topSubjectPerGrade", ranking: "/principal-dashboard/subjectRankingByTerm",
  holistic: "/principal-dashboard/holisticDomain", grades: "/principal-dashboard/performanceByGrade",
  trend: "/principal-dashboard/performanceTrend",
};
export type DashboardEndpoint = keyof typeof dashboardPaths;
export const dashboardEndpoints = Object.keys(dashboardPaths) as DashboardEndpoint[];
export const snapshotEndpoints = dashboardEndpoints.filter(e => e !== "term" && e !== "year");
export const dashboardPayload = {
  total: { total: "1234" }, overview: { totalTeachers: 17, attendance: 93.25, academicPerf: 86.75 },
  today: { present: 110, absent: 9, concerning: 3 },
  attendance: [{ gradeLevelId: 1, grade: "Grade 1", type: "grade", present: 110, absent: 9, total: 119, attendance: 92.44,
    sections: [{ sectionId: 1, section: "Maroon", present: 110, absent: 9, total: 119, attendance: 92.44, hasRecorded: true }] }],
  top: [{ grade: "Grade 1", subject: "Fixture Mathematics", score: 91.25, trend: "up" }],
  ranking: Object.fromEntries(["Term 1", "Term 2", "Term 3"].map((term, index) => [term,
    Array.from({ length: 7 }, (_, n) => ({ rank: n + 1, subject: `${term} Subject ${n + 1}`, grade: "Grade 1", score: 96.5 - index - n, trend: "flat" }))])),
  holistic: { success: true, data: ["Cognitive", "Emotional", "Behavioral", "Social"].map((domain, index) => ({ domain, score: 3.25 + index * .25 })) },
  grades: { success: true, data: [{ grade: "Grade 1", score: 86.75, sections: [{ sectionId: 1, section: "Maroon", score: 86.75 }] }, { grade: "Grade 2", score: null, sections: [] }] },
  trend: { success: true, data: ["Term 1", "Term 2", "Term 3"].map((term, index) => ({ term, performance: 80 + index, attendance: 90 + index,
    cognitive: 3, emotional: 4, behavioral: 4, social: 3, holisticAverage: 3.5, overall: 83.125 + index })) },
};
export async function mockDashboard(page: Page) {
  const ledger = requestLedger(page, path => dashboardEndpoints.some(e => path === `/api${dashboardPaths[e]}`));
  const state = Object.fromEntries(dashboardEndpoints.map(e => [e, { calls: 0, status: 200 }])) as Record<DashboardEndpoint, { calls: number; status: number }>;
  let term: ActiveTermRow = { id: 12, schoolYearId: 1, schoolYear: "2026–2027", termNumber: 2, name: "Term 2", startDate: "2026-09-01", endDate: "2026-12-01", status: "Active" };
  let empty = false, marker = "", yearId = 1;
  const gates: Partial<Record<DashboardEndpoint, Promise<void>>> = {}, releases: Partial<Record<DashboardEndpoint, () => void>> = {};
  for (const e of dashboardEndpoints) await page.route(`**/api${dashboardPaths[e]}`, async route => {
    ledger.intercept(route.request());
    const status = state[e].status; state[e].calls++;
    const body = structuredClone(e === "term" ? { data: term } : e === "year" ? { data: { id: yearId, label: `Year ${yearId}`, status: "Active" } }
      : dashboardPayload[e]);
    if (e === "overview" && marker) (body as typeof dashboardPayload.overview).totalTeachers = Number(marker);
    if (empty && e !== "term" && e !== "year") {
      if (e === "total") (body as typeof dashboardPayload.total).total = "0";
      else if (e === "overview") Object.assign(body, { totalTeachers: 0, attendance: 0, academicPerf: 0 });
      else if (e === "today") Object.assign(body, { present: 0, absent: 0, concerning: 0 });
      else if (e === "ranking") Object.assign(body, { "Term 1": [], "Term 2": [], "Term 3": [] });
      else if ("data" in body) body.data = [] as never;
      else if (Array.isArray(body)) body.length = 0;
    }
    await gates[e];
    await route.fulfill({ status, json: status === 200 ? body : { message: `Fixture ${e} failure (${status})` } });
  });
  return { state, ledger,
    async settled(count: number, endpoints: DashboardEndpoint[] = dashboardEndpoints) {
      // Count dispatches AND browser terminal events for every independent GET.
      // One completed overview is not a barrier for the other ten endpoints.
      await expect.poll(() => Object.fromEntries(endpoints.map(e => [e, {
        calls: state[e].calls,
        finished: ledger.snapshot().filter(r => r.path === `/api${dashboardPaths[e]}` && r.terminal === "finished").length,
      }]))).toEqual(Object.fromEntries(endpoints.map(e => [e, { calls: count, finished: count }])));
    }, setEmpty: () => { empty = true; }, setMarker: (value: number) => { marker = String(value); },
    setContext: (year: number, id: number, termNumber: number) => { yearId = year; term = { ...term, schoolYearId: year, id, termNumber, name: `Term ${termNumber}` }; },
    hold: (e: DashboardEndpoint) => { gates[e] = new Promise<void>(r => { releases[e] = r; }); },
    release: (e: DashboardEndpoint) => { releases[e]?.(); delete gates[e]; },
  };
}

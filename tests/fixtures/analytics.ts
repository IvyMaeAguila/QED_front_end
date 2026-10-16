import type { RankedSubject, HeatmapRow } from "../../src/features/profiles/principal/pages/reports/data/types";
import type { Page } from "@playwright/test";

// Synthetic golden inputs captured against the pre-migration implementation.
export const academicGolden: RankedSubject[] = [
  { subject: "Mathematics", grade: "Grade 1", score: 84.5, trend: "down" },
  { subject: "Science", grade: "Grade 1", score: 85, trend: "flat" },
  { subject: "Mathematics", grade: "Grade 2", score: 85.5, trend: "up" },
  { subject: "Science", grade: "Grade 2", score: 85, trend: "flat" },
  { subject: "Reading", grade: "Grade 1", score: 69.5, trend: "down" },
  { subject: "Reading", grade: "Grade 2", score: 70.5, trend: "flat" },
  { subject: "Arts", grade: "Grade 2", score: 0, trend: "flat" },
];
export const expectedWhole = [
  { subject: "Mathematics", score: 85, trend: "up", gradeCount: 2, rank: 1 },
  { subject: "Science", score: 85, trend: "flat", gradeCount: 2, rank: 2 },
  { subject: "Reading", score: 70, trend: "down", gradeCount: 2, rank: 3 },
  { subject: "Arts", score: 0, trend: "flat", gradeCount: 1, rank: 4 },
];
export const holisticGolden: HeatmapRow[] = [
  { label: "Grade 1", scores: { cognitive: 4.5, emotional: 3.5, behavioral: 2.5, social: 1.5 } },
  { label: "Grade 2", scores: { cognitive: 5, emotional: null, behavioral: 1, social: 4.49 } },
  { label: "Grade 3", scores: { cognitive: null, emotional: null, behavioral: null, social: null } },
];
export const analyticsMetrics = {
  academic: ["4", "60%", "Mathematics", "Arts"],
  holistic: ["3", "3.2 / 5", "Cognitive", "7"],
};

export const analyticsPaths = {
  year: "/academic-year/getAcademicYear", terms: "/reports/term-options",
  grades: "/reports/grade-options", views: "/reports/view-options",
  subjects: "/reports/subject-ranking", holistic: "/reports/holistic",
};
export type AnalyticsEndpoint = keyof typeof analyticsPaths;
export const analyticsEndpoints = Object.keys(analyticsPaths) as AnalyticsEndpoint[];
// Each request snapshots its status/body before waiting, so late-session tests
// really deliver the old response rather than the newer account's fixture.
export async function mockAnalytics(page: Page) {
  const state = Object.fromEntries(analyticsEndpoints.map(e => [e, { calls: 0, status: 200 }])) as Record<AnalyticsEndpoint, { calls: number; status: number }>;
  const requests: { endpoint: AnalyticsEndpoint; term: string | null; view: string | null; year: number }[] = [];
  const gates: Partial<Record<AnalyticsEndpoint, Promise<void>>> = {}, releases: Partial<Record<AnalyticsEndpoint, () => void>> = {};
  let year = 1, empty = false, marker = "";
  for (const e of analyticsEndpoints) await page.route(`**/api${analyticsPaths[e]}${e === "subjects" || e === "holistic" ? "?**" : ""}`, async route => {
    const url = new URL(route.request().url());
    const status = state[e].status; state[e].calls++;
    requests.push({ endpoint: e, term: url.searchParams.get("term"), view: url.searchParams.get("view"), year });
    const data = e === "year" ? { id: year, label: `Year ${year}`, status: "Active" }
      : e === "terms" ? ["Term 1", "Term 2", "Term 3"] : e === "grades" ? ["All Grades", "Grade 1", "Grade 2"]
      : e === "views" ? ["By Grade Level", "By Subject"] : empty ? []
      : e === "subjects" ? [{ subject: marker || `${url.searchParams.get("term")} Mathematics`, grade: "Grade 1", score: 87.5, trend: "up" }]
      : [{ label: marker || `${url.searchParams.get("term")} ${url.searchParams.get("view")}`, scores: { cognitive: 4.5, emotional: 3.5, behavioral: 2.5, social: null } }];
    const body = structuredClone({ success: true, data });
    await gates[e];
    await route.fulfill({ status, json: status === 200 ? body : { message: `Fixture ${e} failure (${status})` } });
  });
  return { state, requests, setYear: (value: number) => { year = value; }, setEmpty: () => { empty = true; }, setMarker: (value: string) => { marker = value; },
    hold: (e: AnalyticsEndpoint) => { gates[e] = new Promise<void>(r => { releases[e] = r; }); },
    release: (e: AnalyticsEndpoint) => { releases[e]?.(); delete gates[e]; },
  };
}

import { API_CONFIG } from '../../../../../../../config/api.config';
import type { BackendTerm } from "../utils/transformProgressReport";
import type { ProgressReportMeta } from "../types/types";

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformanceProgress`;

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

function buildCacheKey(studentId: string): string {
  return studentId;
}

/** Combined shape returned by the term-performance endpoint: per-term
 * grade data plus the learner/section/adviser/school-year header info. */
export interface StudentTermPerformanceResult {
  terms: BackendTerm[];
  meta: ProgressReportMeta;
}

const EMPTY_META: ProgressReportMeta = {
  learner: "",
  gradeSection: "",
  classAdviser: "",
  schoolYear: "",
};

const cache = new Map<string, StudentTermPerformanceResult>();
const inFlightRequests = new Map<string, Promise<StudentTermPerformanceResult>>();

/**
 * Fetches per-term, per-subject grade history for a single student
 * (parent progress-report view), along with the learner's meta info
 * (name, grade & section, class adviser, school year) for the report
 * header. Backed by GET /api/termPerformanceProgress/:studentId/term-performance
 *
 * Uses cookie-based auth (credentials: "include"), matching the same
 * pattern as studentTermPerformance.service.ts used on the Overview tab.
 *
 * Results are cached per studentId — navigating away from the page and
 * back won't re-trigger a loading state. Pass { force: true } to bypass
 * the cache and re-fetch (e.g. manual refresh after a grade is released).
 */
export async function fetchStudentTermPerformance(
  studentId: string,
  options?: { force?: boolean }
): Promise<StudentTermPerformanceResult> {
  const cacheKey = buildCacheKey(studentId);

  if (!options?.force) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight && !options?.force) {
    return inFlight;
  }

const request = (async () => {
  const res = await authedFetch(`${BASE_URL}/${studentId}/term-performance`);
  const json = await handleJsonResponse(res);

  const result: StudentTermPerformanceResult = {
    terms: json.data as BackendTerm[],
    meta: (json.meta as ProgressReportMeta) ?? EMPTY_META,
  };
  cache.set(cacheKey, result);
  return result;
})();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

export function clearStudentTermPerformanceProgressCache(studentId?: string) {
  if (studentId !== undefined) {
    cache.delete(buildCacheKey(studentId));
  } else {
    cache.clear();
  }
}
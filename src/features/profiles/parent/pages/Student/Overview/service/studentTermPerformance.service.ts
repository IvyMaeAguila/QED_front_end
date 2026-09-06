import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformance`;

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
}

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

export interface SubjectGrade {
  subject: string;
  grade: number;
}

export interface Term {
  key: string;
  label: string;
  released: boolean;
  releaseDate?: string;
  average?: number;
  subjects: SubjectGrade[];
}

function buildCacheKey(studentId: string): string {
  return studentId;
}

const cache = new Map<string, Term[]>();
const inFlightRequests = new Map<string, Promise<Term[]>>();

/**
 * Fetches per-term, per-subject grade history for a single student
 * (parent view). Backed by GET /api/termPerformance/students/:studentId/term-performance
 *
 * Results are cached per studentId. Pass { force: true } to bypass the
 * cache and re-fetch (e.g. on manual refetch/pull-to-refresh).
 */
export async function fetchStudentTermPerformance(
  studentId: string,
  options?: { force?: boolean }
): Promise<Term[]> {
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
    const res = await authedFetch(`${BASE_URL}/students/${studentId}/term-performance`);
    const json = await handleJsonResponse(res);
    const data: Term[] = json.data;
    cache.set(cacheKey, data);
    return data;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

export function clearStudentTermPerformanceCache(studentId?: string) {
  if (studentId !== undefined) {
    cache.delete(buildCacheKey(studentId));
  } else {
    cache.clear();
  }
}
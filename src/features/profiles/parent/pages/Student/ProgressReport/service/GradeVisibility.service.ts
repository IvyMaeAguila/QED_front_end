import { API_CONFIG } from '../../../../../../../config/api.config';

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

/** Per-term visibility status as returned by the visibility endpoint. */
export interface TermVisibilityEntry {
  gradingPeriodId: number;
  termNumber: number;
  termLabel: string;
  isVisible: boolean;
  termEnded: boolean;
  /** true kapag pwede nang tignan ng parent (is_visible AND tapos na term) */
  available: boolean;
}

const cache = new Map<string, TermVisibilityEntry[]>();
const inFlightRequests = new Map<string, Promise<TermVisibilityEntry[]>>();

export async function fetchStudentGradeVisibility(
  studentId: string,
  options?: { force?: boolean }
): Promise<TermVisibilityEntry[]> {
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
    const res = await authedFetch(`${BASE_URL}/${studentId}/visibility`);
    const json = await handleJsonResponse(res);

    const result = json.data as TermVisibilityEntry[];
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

export function clearStudentGradeVisibilityCache(studentId?: string) {
  if (studentId !== undefined) {
    cache.delete(buildCacheKey(studentId));
  } else {
    cache.clear();
  }
}
import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/holisticPerformance`;

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

export type HolisticRiskLevel = "NONE" | "MEDIUM" | "HIGH";

export interface HolisticDomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

export interface HolisticTermAverage {
  termNumber: number;
  termLabel: string;
  isActive: boolean;
  /**
   * True for the active term's live evaluation and for terms whose end date
   * has passed. Future terms remain unavailable.
   */
  released: boolean;
  domainAverages: HolisticDomainAverages;
  evaluationCount: number;
  riskLevel: HolisticRiskLevel;
}

interface FetchHolisticTermAveragesOptions {
  force?: boolean;
  /** Only fetch this one term instead of every term in the active school year. */
  termNumber?: number;
}

function buildCacheKey(studentId: string, options?: FetchHolisticTermAveragesOptions): string {
  const termPart = options?.termNumber !== undefined ? `:term=${options.termNumber}` : "";
  return `${studentId}${termPart}`;
}

const cache = new Map<string, HolisticTermAverage[]>();
const inFlightRequests = new Map<string, Promise<HolisticTermAverage[]>>();

/**
 * Fetches per-term holistic domain averages (cognitive/emotional/social/
 * behavioral) for a single student (parent view), pooled across every
 * subject. Backed by GET /api/holisticTermAverages/students/:studentId
 *
 * Every term in the active school year is returned, including future terms;
 * check `released` before reading a term's numbers. The active term returns
 * live evaluation averages.
 * Pass `{ termNumber }` to narrow to a single term instead.
 *
 * Results are cached per student and term.
 * Pass { force: true } to bypass the cache and re-fetch (e.g. on manual
 * refetch/pull-to-refresh).
 */
export async function fetchStudentHolisticTermAverages(
  studentId: string,
  options?: FetchHolisticTermAveragesOptions
): Promise<HolisticTermAverage[]> {
  const cacheKey = buildCacheKey(studentId, options);

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
    const params = new URLSearchParams();
    if (options?.termNumber !== undefined) params.set("termNumber", String(options.termNumber));
    const query = params.toString();

    const res = await authedFetch(`${BASE_URL}/${studentId}${query ? `?${query}` : ""}`);
    const json = await handleJsonResponse(res);
    const data: HolisticTermAverage[] = json.data.map((term: HolisticTermAverage) => ({
      ...term,
      isActive: Boolean(term.isActive),
    }));
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

/**
 * Clears cached entries for a student. With no `termNumber`, clears every
 * cached variant for that student since exact key combinations are not tracked.
 */
export function clearStudentHolisticTermAveragesCache(studentId?: string) {
  if (studentId === undefined) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key === studentId || key.startsWith(`${studentId}:`)) {
      cache.delete(key);
    }
  }
}

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
  /**
   * False until that term's grading_periods.end_date has actually passed —
   * gated per term, independent of which term is currently "active". While
   * false, domainAverages/evaluationCount/riskLevel are zeroed out
   * server-side even if ratings already exist in the DB — never trust
   * these fields as real until `released` is true. (Server-side `preview`
   * bypasses this — see `fetchStudentHolisticTermAverages`'s options.)
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
  /**
   * QA/sanity-check only: bypasses the release gate server-side so a term's
   * real numbers show up before its end_date has passed. Do not wire this
   * up to anything parent-facing — see the warning on the controller.
   */
  preview?: boolean;
}

function buildCacheKey(studentId: string, options?: FetchHolisticTermAveragesOptions): string {
  const termPart = options?.termNumber !== undefined ? `:term=${options.termNumber}` : "";
  const previewPart = options?.preview ? ":preview" : "";
  return `${studentId}${termPart}${previewPart}`;
}

const cache = new Map<string, HolisticTermAverage[]>();
const inFlightRequests = new Map<string, Promise<HolisticTermAverage[]>>();

/**
 * Fetches per-term holistic domain averages (cognitive/emotional/social/
 * behavioral) for a single student (parent view), pooled across every
 * subject. Backed by GET /api/holisticTermAverages/students/:studentId
 *
 * Every term in the active school year is returned, including terms not
 * yet released — check `released` per entry before reading its numbers.
 * Pass `{ termNumber }` to narrow to a single term instead.
 *
 * Results are cached per (studentId, termNumber, preview) combination.
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
    if (options?.preview) params.set("preview", "true");
    const query = params.toString();

    const res = await authedFetch(`${BASE_URL}/${studentId}${query ? `?${query}` : ""}`);
    const json = await handleJsonResponse(res);
    const data: HolisticTermAverage[] = json.data;
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
 * cached variant for that student (all terms, preview or not) since we
 * don't track exact key combinations here.
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
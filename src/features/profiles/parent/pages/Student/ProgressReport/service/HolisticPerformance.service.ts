/**
 * Fetches a student's holistic domain averages, one entry per grading term,
 * from GET /holisticTermAverages/students/:studentId.
 *
 * Mirrors the conventions used by TermPerformance.service's
 * fetchStudentTermPerformance: cookie-based auth (credentials: "include"),
 * a tiny in-memory cache keyed by studentId, and a `force` option to bypass
 * that cache on explicit refetch().
 *
 * Adjust API_BASE below to match whatever base path fetchStudentTermPerformance
 * already uses in this project (this file guesses "/api" as a placeholder).
 */
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE = `${API_CONFIG.baseURL}/api/termHolisticProgress`;

export interface BackendHolisticDomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

export interface BackendHolisticTermAverage {
  termNumber: number;
  termLabel: string;
  domainAverages: BackendHolisticDomainAverages;
  evaluationCount: number;
  riskLevel: "HIGH" | "MEDIUM" | "NONE";
}

interface CacheEntry {
  data: BackendHolisticTermAverage[];
  fetchedAt: number;
}

// Keyed by studentId. Cleared per-student on force refetch; not time-based —
// mirrors the "cache until explicitly told otherwise" behavior implied by
// fetchStudentTermPerformance's `force` option.
const cache = new Map<string, CacheEntry>();

export interface FetchHolisticTermAveragesOptions {
  /** Bypass the cache and hit the network, e.g. on ProgressReportContext.refetch(). */
  force?: boolean;
  /** Fetch a single term instead of every term for the student's active school year. */
  termNumber?: number;
}

export async function fetchStudentHolisticTermAverages(
  studentId: string,
  options: FetchHolisticTermAveragesOptions = {},
): Promise<BackendHolisticTermAverage[]> {
  const { force = false, termNumber } = options;

  // Only cache the "all terms" call — a single-term call is cheap and rare
  // enough (used for one-off lookups) that caching it adds complexity for
  // little benefit.
  const cacheKey = studentId;
  if (!force && termNumber === undefined) {
    const cached = cache.get(cacheKey);
    if (cached) return cached.data;
  }

  const url = new URL(`${API_BASE}/${studentId}`, window.location.origin);
  if (termNumber !== undefined) {
    url.searchParams.set("termNumber", String(termNumber));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Failed to fetch holistic term averages (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  const body = await response.json();
  if (!body?.success) {
    throw new Error(body?.message ?? "Failed to fetch holistic term averages.");
  }

  const data: BackendHolisticTermAverage[] = body.data ?? [];

  if (termNumber === undefined) {
    cache.set(cacheKey, { data, fetchedAt: Date.now() });
  }

  return data;
}

/** Clears the cached result for one student — call this alongside any other
 * "refetch everything for this student" action if you don't already funnel
 * through `force`. */
export function clearHolisticTermAveragesCache(studentId: string) {
  cache.delete(studentId);
}
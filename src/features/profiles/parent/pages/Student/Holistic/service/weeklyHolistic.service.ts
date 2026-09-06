import { API_CONFIG } from '../../../../../../../config/api.config';
import type { WholeChildSnapshotData, HistoryEntry } from "../types/types";

export interface StudentWeeklyEvaluationResponse {
  current: WholeChildSnapshotData;
  history: HistoryEntry[];
}

const API_BASE = `${API_CONFIG.baseURL}/api/weeklyHolisticEvaluation`;

// Module-level cache — survives component unmount/remount (e.g. switching tabs
// or navigating away and back), only cleared on full page reload.
const cache = new Map<string, StudentWeeklyEvaluationResponse>();
// Prevents duplicate in-flight requests if the component mounts twice quickly
// (e.g. React StrictMode) before the first fetch resolves.
const inFlight = new Map<string, Promise<StudentWeeklyEvaluationResponse>>();

function cacheKey(studentId: string | number, termNumber: string | number) {
  return `${studentId}:${termNumber}`;
}

export async function fetchStudentWeeklyEvaluation(
  studentId: string | number,
  termNumber: string | number,
  token?: string,
  options?: { forceRefresh?: boolean }
): Promise<StudentWeeklyEvaluationResponse> {
  const key = cacheKey(studentId, termNumber);

  if (!options?.forceRefresh) {
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const request = (async () => {
    const res = await fetch(
      `${API_BASE}/students/${studentId}?termNumber=${termNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      }
    );

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message ?? "Failed to fetch weekly evaluation.");
    }

    const data = json.data as StudentWeeklyEvaluationResponse;
    cache.set(key, data);
    return data;
  })();

  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}

/** Call after adding/editing a rating so the next fetch pulls fresh data. */
export function invalidateStudentWeeklyEvaluationCache(
  studentId: string | number,
  termNumber: string | number
) {
  cache.delete(cacheKey(studentId, termNumber));
}

/** Clears the whole cache — e.g. on logout. */
export function clearStudentWeeklyEvaluationCache() {
  cache.clear();
  inFlight.clear();
}
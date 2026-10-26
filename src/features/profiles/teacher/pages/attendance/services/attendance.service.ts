import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';
import type { AttendanceMap, GradingPeriod, AttendanceStatus } from "../../subjects/detail/types/Grading";
import { type RosterStudent } from "../../subjects/detail/data";
import type { TeacherRequestOptions } from "../../../query/teacherQueryScope";
import { QueryHttpError } from "@shared/http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherAttendance`;

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
}

export interface AdvisorySection {
  classId: string;          // always present — real attendance key
  sectionId: string | null; // present only if this grade level uses named sections
  sectionName: string;      // falls back to gradeLevel when no section name exists
  gradeLevel: string;
  roster: RosterStudent[];
  terms: GradingPeriod[];
}

// NEW: returns every advisory class this teacher is assigned to.
export async function fetchAdvisorySections(options: TeacherRequestOptions = {}): Promise<AdvisorySection[]> {
  const res = await authedFetch(`${BASE_URL}/advisory-sections`, {signal: options.signal});
  if (res.status === 401) options.onUnauthorized?.();
  if (res.status === 404) return [];
  if (!res.ok) throw new QueryHttpError(`Failed to fetch advisory sections (${res.status})`, res.status, undefined, {requestId: res.requestId});
  return res.json();
}

export async function fetchAdvisoryAttendance(
  classId: string,
  options: { termId?: string; allPeriods?: boolean } = {},
  request: TeacherRequestOptions = {},
): Promise<{ data: AttendanceMap }> {
  const params = new URLSearchParams();
  if (options.termId) params.set("term", options.termId);
  if (options.allPeriods) params.set("allPeriods", "true");
  const query = params.size ? `?${params.toString()}` : "";
  const res = await authedFetch(`${BASE_URL}/${classId}${query}`, {signal:request.signal});
  if(res.status===401)request.onUnauthorized?.();
  if (!res.ok) throw new QueryHttpError(`Failed to fetch attendance (${res.status})`,res.status, undefined, {requestId: res.requestId});
  return res.json();
}

export async function saveAdvisoryAttendance(
  classId: string,
  studentId: string,
  dateISO: string,
  status: AttendanceStatus,
  termId?: string,
  request: TeacherRequestOptions = {},
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${classId}`, {
    method: "POST",
    signal:request.signal,
    body: JSON.stringify({ studentId, date: dateISO, status, ...(termId ? { term: termId } : {}) }),
  });
  if(res.status===401)request.onUnauthorized?.();
  if (!res.ok) throw new QueryHttpError(`Failed to save attendance (${res.status})`,res.status, undefined, {requestId: res.requestId});
}

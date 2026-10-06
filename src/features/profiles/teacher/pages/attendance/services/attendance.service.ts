import { API_CONFIG } from '../../../../../../config/api.config';
import type { AttendanceMap, GradingPeriod, AttendanceStatus } from "../../subjects/detail/types/Grading";
import { type RosterStudent } from "../../subjects/detail/data";

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
export async function fetchAdvisorySections(): Promise<AdvisorySection[]> {
  const res = await authedFetch(`${BASE_URL}/advisory-sections`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch advisory sections (${res.status})`);
  return res.json();
}

export async function fetchAdvisoryAttendance(
  classId: string,
  options: { termId?: string; allPeriods?: boolean } = {},
): Promise<{ data: AttendanceMap }> {
  const params = new URLSearchParams();
  if (options.termId) params.set("term", options.termId);
  if (options.allPeriods) params.set("allPeriods", "true");
  const query = params.size ? `?${params.toString()}` : "";
  const res = await authedFetch(`${BASE_URL}/${classId}${query}`);
  if (!res.ok) throw new Error(`Failed to fetch attendance (${res.status})`);
  return res.json();
}

export async function saveAdvisoryAttendance(
  classId: string,
  studentId: string,
  dateISO: string,
  status: AttendanceStatus,
  termId?: string,
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${classId}`, {
    method: "POST",
    body: JSON.stringify({ studentId, date: dateISO, status, ...(termId ? { term: termId } : {}) }),
  });
  if (!res.ok) throw new Error(`Failed to save attendance (${res.status})`);
}

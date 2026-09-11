import { API_CONFIG } from '../../../../../../config/api.config';
import type { AttendanceMap, GradingPeriod, AttendanceStatus } from "../../subjects/detail/types/Grading";
import { type RosterStudent } from "../../subjects/detail/data";

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherAttendance`;

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
}

export interface AdvisorySection {
  sectionId: string;
  sectionName: string;
  gradeLevel: string;
  roster: RosterStudent[];
  terms: GradingPeriod[];
}

export async function fetchAdvisorySection(): Promise<AdvisorySection | null> {
  const res = await authedFetch(`${BASE_URL}/advisory-section`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch advisory section (${res.status})`);
  return res.json();
}

export async function fetchAdvisoryAttendance(sectionId: string): Promise<{ data: AttendanceMap }> {
  const res = await authedFetch(`${BASE_URL}/${sectionId}`);
  if (!res.ok) throw new Error(`Failed to fetch attendance (${res.status})`);
  return res.json();
}

export async function saveAdvisoryAttendance(
  sectionId: string,
  studentId: string,
  dateISO: string,
  status: AttendanceStatus,
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${sectionId}`, {
    method: "POST",
    body: JSON.stringify({ studentId, date: dateISO, status }),
  });
  if (!res.ok) throw new Error(`Failed to save attendance (${res.status})`);
}
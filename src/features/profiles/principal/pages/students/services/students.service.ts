import type { GradeLevelSummary, ClassList } from "../data/types";
import { API_CONFIG } from '../../../../../../config/api.config';
import { QueryHttpError } from "@shared/http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api/student`;

// Overview responses are cached exclusively by TanStack Query.
export async function getGradeLevels(signal?: AbortSignal): Promise<GradeLevelSummary[]> {
  const res = await fetch(`${BASE_URL}/grade-levels`, {
    credentials: "include", signal,
  });

  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch grade levels (${res.status})`, res.status);
  }

  return res.json();
}

export async function getOverviewSchoolYear(signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${API_CONFIG.baseURL}/api/academic-year/getAcademicYear`, {
    credentials: "include", signal,
  });
  if (!response.ok) throw new QueryHttpError("Failed to fetch academic year.", response.status);
  const json = await response.json();
  if (!json.data) throw new Error(json.message || "Failed to fetch academic year.");
  return json.data.label;
}

// Roster keys need the active year ID as well as its display label.
export async function getRosterAcademicYear(signal?: AbortSignal): Promise<{ id: number; label: string }> {
  const response = await fetch(`${API_CONFIG.baseURL}/api/academic-year/getAcademicYear`, {
    credentials: "include", signal,
  });
  if (!response.ok) throw new QueryHttpError("Failed to fetch academic year.", response.status);
  const json = await response.json();
  if (!json.data || json.data.id == null) throw new Error(json.message || "Failed to fetch academic year.");
  return { id: json.data.id, label: json.data.label };
}

// Stateless transport also used by the existing teacher-profile roster reader.
// A 404 is a successful null result, never an ordinary request error.
export async function getClassList(classId: number, signal?: AbortSignal): Promise<ClassList | null> {
  const res = await fetch(`${BASE_URL}/class-list/${classId}`, { credentials: "include", signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new QueryHttpError(`Failed to fetch class list (${res.status})`, res.status);
  return res.json();
}

export async function getUnassignedClassList(gradeId: number, signal?: AbortSignal): Promise<ClassList | null> {
  const res = await fetch(`${BASE_URL}/grade/${gradeId}/unassigned`, { credentials: "include", signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new QueryHttpError(`Failed to fetch class list (${res.status})`, res.status);
  return res.json();
}

// Retain the transport interface without a competing school-year service cache.
export async function getSchoolYear(signal?: AbortSignal): Promise<string> {
  return getOverviewSchoolYear(signal);
}

import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { API_CONFIG } from "../../../../../../config/api.config"; 
import { fetchActiveAcademicYear } from "../../../../admin/pages/subjects/services/academicyear.service";
import type { TeacherProfile, TeacherSummary } from "../data/types";

const BASE_URL = `${API_CONFIG.baseURL}/api/teachers`;

const teacherProfileCache = new Map<string, TeacherProfile>();

export function getCachedTeacherProfile(
  teacherId: string
): TeacherProfile | undefined {
  return teacherProfileCache.get(teacherId);
}

export function clearTeacherProfileCache(teacherId?: string): void {
  if (teacherId) {
    teacherProfileCache.delete(teacherId);
  } else {
    teacherProfileCache.clear();
  }
}

export async function getTeacherProfile(
  teacherId: string
): Promise<TeacherProfile> {
  const cached = getCachedTeacherProfile(teacherId);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/${teacherId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teacher profile (${response.status})`);
  }

  const data: TeacherProfile = await response.json();
  teacherProfileCache.set(teacherId, data);
  return data;
}

// Directory responses are cached exclusively by TanStack Query.
export async function getTeachers(signal?: AbortSignal): Promise<TeacherSummary[]> {
  const response = await fetch(BASE_URL, { credentials: "include", signal });
  if (!response.ok) throw new QueryHttpError(`Failed to fetch teachers (${response.status})`, response.status, undefined, {requestId: response.requestId});
  return response.json();
}

// Keep the schedule's existing getSchoolYear cache separate.
export async function getDirectorySchoolYear(signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${API_CONFIG.baseURL}/api/academic-year/getAcademicYear`, {
    credentials: "include", signal,
  });
  if (!response.ok) throw new QueryHttpError("Failed to fetch academic year.", response.status, undefined, {requestId: response.requestId});
  const json = await response.json();
  if (!json.data) throw new Error(json.message || "Failed to fetch academic year.");
  return json.data.label;
}
let schoolYearCache: string | null = null;

export async function getSchoolYear(): Promise<string> {
  if (schoolYearCache) return schoolYearCache;
  const academicYear = await fetchActiveAcademicYear();
  schoolYearCache = academicYear.label;
  return schoolYearCache;
}

export function clearAllTeacherCaches(): void {
  clearTeacherProfileCache();

  schoolYearCache = null;
}

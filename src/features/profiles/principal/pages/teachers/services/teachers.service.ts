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

let teachersListCache: TeacherSummary[] | null = null;
let teachersListCacheTimestamp: number | null = null;
const TEACHERS_LIST_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedTeachersList(): TeacherSummary[] | null {
  return teachersListCache;
}

export function clearTeachersListCache(): void {
  teachersListCache = null;
  teachersListCacheTimestamp = null;
}

export async function getTeachers(
  options: { forceRefresh?: boolean } = {}
): Promise<TeacherSummary[]> {
  const { forceRefresh = false } = options;

  const isCacheValid =
    teachersListCache !== null &&
    teachersListCacheTimestamp !== null &&
    Date.now() - teachersListCacheTimestamp < TEACHERS_LIST_TTL;

  if (!forceRefresh && isCacheValid) {
    return teachersListCache!;
  }

  const response = await fetch(BASE_URL, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teachers (${response.status})`);
  }

  const data: TeacherSummary[] = await response.json();
  teachersListCache = data;
  teachersListCacheTimestamp = Date.now();
  return data;
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
  clearTeachersListCache();
  schoolYearCache = null;
}
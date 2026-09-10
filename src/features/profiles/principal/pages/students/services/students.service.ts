import type { GradeLevelSummary, ClassList } from "../data/types";
import { fetchActiveAcademicYear } from "../../../../admin/pages/subjects/services/academicyear.service";
import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/student`;

// ---------- Grade Levels Cache ----------
let gradeLevelsCache: GradeLevelSummary[] | null = null;

export function getCachedGradeLevels(): GradeLevelSummary[] | null {
  return gradeLevelsCache;
}

export function clearGradeLevelsCache(): void {
  gradeLevelsCache = null;
}

export async function getGradeLevels(
  options: { forceRefresh?: boolean } = {}
): Promise<GradeLevelSummary[]> {
  const { forceRefresh = false } = options;

  if (!forceRefresh && gradeLevelsCache !== null) {
    return gradeLevelsCache;
  }

  const res = await fetch(`${BASE_URL}/grade-levels`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch grade levels (${res.status})`);
  }

  const data: GradeLevelSummary[] = await res.json();
  gradeLevelsCache = data;
  return data;
}

// ---------- Class List Cache (keyed by classId) ----------
// Cached value can be `null` (a real "not found" result), so we use a
// separate Set to track which classIds have been fetched at least once —
// this lets us distinguish "not cached yet" from "cached as not found."
const classListCache = new Map<number, ClassList | null>();
const fetchedClassIds = new Set<number>();

export function getCachedClassList(classId: number): ClassList | null | undefined {
  if (!fetchedClassIds.has(classId)) return undefined;
  return classListCache.get(classId) ?? null;
}

export function clearClassListCache(classId?: number): void {
  if (classId !== undefined) {
    classListCache.delete(classId);
    fetchedClassIds.delete(classId);
  } else {
    classListCache.clear();
    fetchedClassIds.clear();
  }
}

// Returns null (never throws) when there's no class record for the
// classId — the page treats that as a "not found" state, not an error
// state, since a bad/stale id in the URL isn't a failed request.
// Roster defaults to [] naturally since the backend maps an empty
// row set to an empty array.
export async function getClassList(
  classId: number,
  options: { forceRefresh?: boolean } = {}
): Promise<ClassList | null> {
  const { forceRefresh = false } = options;

  if (!forceRefresh && fetchedClassIds.has(classId)) {
    return classListCache.get(classId) ?? null;
  }

  const res = await fetch(
    `${BASE_URL}/class-list/${classId}`,
    { credentials: "include" }
  );

  if (res.status === 404) {
    classListCache.set(classId, null);
    fetchedClassIds.add(classId);
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch class list (${res.status})`);
  }

  const data: ClassList = await res.json();
  classListCache.set(classId, data);
  fetchedClassIds.add(classId);
  return data;
}

// ---------- Unassigned Class List Cache (keyed by gradeId) ----------
const unassignedClassListCache = new Map<number, ClassList | null>();
const fetchedGradeIds = new Set<number>();

export function getCachedUnassignedClassList(gradeId: number): ClassList | null | undefined {
  if (!fetchedGradeIds.has(gradeId)) return undefined;
  return unassignedClassListCache.get(gradeId) ?? null;
}

export function clearUnassignedClassListCache(gradeId?: number): void {
  if (gradeId !== undefined) {
    unassignedClassListCache.delete(gradeId);
    fetchedGradeIds.delete(gradeId);
  } else {
    unassignedClassListCache.clear();
    fetchedGradeIds.clear();
  }
}

export async function getUnassignedClassList(
  gradeId: number,
  options: { forceRefresh?: boolean } = {}
): Promise<ClassList | null> {
  const { forceRefresh = false } = options;

  if (!forceRefresh && fetchedGradeIds.has(gradeId)) {
    return unassignedClassListCache.get(gradeId) ?? null;
  }

  const res = await fetch(`${BASE_URL}/grade/${gradeId}/unassigned`, {
    credentials: "include",
  });

  if (res.status === 404) {
    unassignedClassListCache.set(gradeId, null);
    fetchedGradeIds.add(gradeId);
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch class list (${res.status})`);
  }

  const data: ClassList = await res.json();
  unassignedClassListCache.set(gradeId, data);
  fetchedGradeIds.add(gradeId);
  return data;
}

// ---------- School Year Cache ----------
let schoolYearCache: string | null = null;

export async function getSchoolYear(): Promise<string> {
  if (schoolYearCache) return schoolYearCache;
  const academicYear = await fetchActiveAcademicYear();
  schoolYearCache = academicYear.label;
  return schoolYearCache;
}

// ---------- Utility: clear all caches ----------
export function clearAllStudentCaches(): void {
  clearGradeLevelsCache();
  clearClassListCache();
  clearUnassignedClassListCache();
  schoolYearCache = null;
}
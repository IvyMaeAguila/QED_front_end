import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/subject`;

// Tugma sa response shape ng subject.controller.js: { success, message, data }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ElemSubjectRow {
  id: number;
  subject_name: string;
  grade_level_id: number;
}

export interface SubjectSectionRow {
  id: number;
  subject_id: number;
  section_id: number;
  teacher_id: string | number | null;
  school_year_id: number;
  status: "Active" | "Inactive";
}

export interface SubjectSectionByGradeRow {
  id: number;
  subject_name: string;
  grade_level_id: number;
  section_name: string;
  teacher_id: number | string | null;
  school_year: string;
  status: "Active" | "Inactive";
}

export async function fetchSubjectSectionsByGrade(
  gradeLevel: string
): Promise<SubjectSectionByGradeRow[]> {
  const res = await fetch(`${BASE_URL}/getSubjectSectionsByGrade/${gradeLevel}`);
  const json: ApiResponse<SubjectSectionByGradeRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch subjects.");
  return json.data ?? [];
}

export async function fetchSubjectsByGrade(gradeLevel: string): Promise<ElemSubjectRow[]> {
  const res = await fetch(`${BASE_URL}/getSubjectsByGrade/${gradeLevel}`);
  const json: ApiResponse<ElemSubjectRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch subjects.");
  return json.data ?? [];
}

export async function saveSubjectAssignment(payload: {
  gradeLevelId: number;
  subjectName: string;
  sectionName: string;
  teacherId: string | null;
  schoolYear: string;
  status?: "Active" | "Inactive";
}): Promise<SubjectSectionRow> {
  const res = await fetch(`${BASE_URL}/addSubjectSection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<SubjectSectionRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to save subject.");
  return json.data as SubjectSectionRow;
}

export async function updateSubjectAssignment(
  id: string,
  payload: {
    gradeLevelId: number;
    subjectName: string;
    sectionName: string;
    teacherId: string | null;
    schoolYear: string;
    status: "Active" | "Inactive";
  }
): Promise<SubjectSectionRow> {
  const res = await fetch(`${BASE_URL}/updateSubjectSection/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<SubjectSectionRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update subject.");
  return json.data as SubjectSectionRow;
}

export async function assignTeacherToSubject(
  id: string,
  payload: { gradeLevelId: number; sectionName: string; teacherId: string | null }
): Promise<{ id: number; section_id: number; teacher_id: string | number | null }> {
  const res = await fetch(`${BASE_URL}/assignTeacher/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<{ id: number; section_id: number; teacher_id: string | number | null }> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to assign teacher.");
  return json.data as { id: number; section_id: number; teacher_id: string | number | null };
}
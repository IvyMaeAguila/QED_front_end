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
  is_graded: boolean;
}

export interface SubjectSectionRow {
  id: number;
  subject_id: number;
  section_id: number;
  teacher_id: string | number | null;
  school_year_id: number;
  status: "Active" | "Inactive";
}

export interface SubjectWeightDistributionItem {
  id: number;
  assessment_type_id: number;
  // subject-management returns this alias as `assessmentName`.
  assessmentName: string | null;
  weight_percent: number;
  order_index: number;
}

export interface SubjectSectionByGradeRow {
  id: number;
  subject_id: number;
  subject_name: string;
  grade_level_id: number;
  is_graded: boolean;
  section_name: string;
  teacher_id: number | string | null;
  school_year: string;
  status: "Active" | "Inactive";
  weightDistribution: SubjectWeightDistributionItem[];
}

export interface WeightDistributionPayloadItem {
  assessment_type_id: number;
  weight_percent: number;
  order_index: number;
}

export interface NewAssessmentType {
  id: number;
  assessmentName: string;
}

export async function fetchSubjectSectionsByGrade(
  gradeLevel: string
): Promise<SubjectSectionByGradeRow[]> {
  const res = await fetch(`${BASE_URL}/getSubjectSectionsByGrade/${gradeLevel}`, {credentials: "include"});
  const json: ApiResponse<SubjectSectionByGradeRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch subjects.");
  return json.data ?? [];
}

export async function fetchSubjectsByGrade(gradeLevel: string): Promise<ElemSubjectRow[]> {
  const res = await fetch(`${BASE_URL}/getSubjectsByGrade/${gradeLevel}`, {credentials: "include"});
  const json: ApiResponse<ElemSubjectRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch subjects.");
  return json.data ?? [];
}

export async function addSubject(payload: {
  gradeLevelId: number;
  isGraded: boolean;
  subjectName: string;
  schoolYear: string;
  weightDistribution?: WeightDistributionPayloadItem[];
}): Promise<ElemSubjectRow> {
  const res = await fetch(`${BASE_URL}/addSubject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<ElemSubjectRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to add subject.");
  return json.data as ElemSubjectRow;
}

export interface UpdateSubjectAssignmentResult {
  id: number;
  subject_id: number;
  is_graded: boolean;
  weight_distribution: {
    assessment_type_id: number;
    assessment_type_name: string | null;
    weight_percent: number;
    order_index: number;
  }[];
}

export async function updateSubjectAssignment(
  id: string,
  payload: {
    isGraded: boolean;
    weightDistribution?: WeightDistributionPayloadItem[];
    subjectName?: string;
    gradeLevelId?: number;
    sectionName?: string | null;
    teacherId?: string | null;
    schoolYear?: string;
  }
): Promise<UpdateSubjectAssignmentResult> {
  const res = await fetch(`${BASE_URL}/updateSubjectSection/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<UpdateSubjectAssignmentResult> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update subject.");
  return json.data as UpdateSubjectAssignmentResult;
}

export async function assignTeacherToSubject(
  id: string,
  payload: { gradeLevelId: number; sectionName: string; teacherId: string | null }
): Promise<{ id: number; section_id: number; teacher_id: string | number | null }> {
  const res = await fetch(`${BASE_URL}/assignTeacher/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<{ id: number; section_id: number; teacher_id: string | number | null }> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to assign teacher.");
  return json.data as { id: number; section_id: number; teacher_id: string | number | null };
}

export async function toggleSubjectStatus(
  id: string
): Promise<{ id: number; status: "Active" | "Inactive" }> {
  const res = await fetch(`${BASE_URL}/toggleStatus/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json: ApiResponse<{ id: number; status: "Active" | "Inactive" }> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to toggle status.");
  return json.data as { id: number; status: "Active" | "Inactive" };
}

export async function createAssessmentType(payload: {
  assessmentName: string;
}): Promise<NewAssessmentType> {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<NewAssessmentType> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to add assessment type.");
  return json.data as NewAssessmentType;
}

export async function getAssessmentTypes(): Promise<ApiResponse<NewAssessmentType[]>> {
  const response = await fetch(`${BASE_URL}/`, {
    method: 'GET',
    credentials: "include",
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch assessment types: ${response.status}`);
  }
  const json: ApiResponse<Array<{
    id: number;
    assessmentName?: string | null;
    assessment_name?: string | null;
  }>> = await response.json();
  const data = Array.isArray(json.data) ? json.data : [];
  return {
    ...json,
    data: data
      .map((row) => ({
        id: row.id,
        // The API's SELECT alias is camelCase, while older responses may
        // still expose the database column name.
        assessmentName: row.assessmentName ?? row.assessment_name ?? "",
      }))
      .filter((row) => row.assessmentName.trim() !== ""),
  };
}

export async function updateAssessmentType(
  id: number,
  payload: { assessmentName: string }
): Promise<NewAssessmentType> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  let json: ApiResponse<NewAssessmentType> | undefined;
  try {
    json = JSON.parse(body) as ApiResponse<NewAssessmentType>;
  } catch {
    // Keep a useful API error visible if an intermediary returns plain text.
  }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || body || "Failed to update assessment type.");
  }
  return json.data as NewAssessmentType;
}

export async function deleteAssessmentType(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete assessment type.");
}

export function toWeightPayload(
  rows: { assessmentType: string; weight: number }[],
  assessmentTypes: NewAssessmentType[]
): WeightDistributionPayloadItem[] {
  return rows
    .map((row, index) => {
      const match = assessmentTypes.find(
        (t) =>
          t.assessmentName.trim().toLowerCase() ===
          row.assessmentType.trim().toLowerCase()
      );
      if (!match) return null;
      return {
        assessment_type_id: match.id,
        weight_percent: Number(row.weight),
        order_index: index,
      };
    })
    .filter((x): x is WeightDistributionPayloadItem => x !== null);
}

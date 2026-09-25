import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/advisoryGrading`;

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
}

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

// NEW: lets the UI show a section picker only when a teacher has more than one advisory class.
export interface AdvisorySectionOption {
  classId: string;
  sectionName: string | null;
  gradeLevel: string;
}

export async function fetchAdvisorySections(): Promise<AdvisorySectionOption[]> {
  const res = await authedFetch(`${BASE_URL}/sections`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export interface GradebookSubject {
  subjectSectionId: string;
  subjectId: number;
  subjectName: string;
  submitted: boolean;
  submittedByName: string | null;
  submittedAt: string | null;
  isOwnAdvisory: boolean;
}

export interface ExamScore {
  score: number;
  max: number;
}

// SUBMISSION-BASED SYNC: `status` is now the source of truth for how to
// render a cell, not just `isComplete`/`average`. "not_submitted" means no
// scores entered/complete yet; "pending" means scores are complete but the
// subject teacher hasn't hit submit; "submitted" means the average is
// real and visible, and submittedByName identifies who submitted it.
//
// `average` is only ever non-null when status === "submitted" — the
// backend enforces this (see advisoryGrading.controller.js), so a
// "pending" cell will never leak a number here even though the grade is
// technically computed.
export type GradeSubmissionState = "not_submitted" | "pending" | "submitted";

export interface SubjectGradeCell {
  status: GradeSubmissionState;
  average: number | null;
  submittedByName: string | null;
  submittedAt: string | null;
  isOwnAdvisory: boolean;
}

export interface GradebookStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: "M" | "F";
  grades: Record<string, SubjectGradeCell>;
  overallAverage: number | null;
}

export interface AdvisoryGradebook {
  sectionName: string;
  gradeLevel: string;
  subjects: GradebookSubject[];
  students: GradebookStudent[];
}

// classId is optional everywhere: omit it and the backend defaults to the
// teacher's first (or only) advisory section, so single-section teachers
// need no frontend changes at all.
export async function fetchAdvisoryGradebook(
  gradingPeriodId: string,
  classId?: string
): Promise<AdvisoryGradebook> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/gradebook?${params.toString()}`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export interface ClassSubmissionStatus {
  submitted: boolean;
  submittedAt: string | null;
}

export async function fetchClassSubmissionStatus(
  gradingPeriodId: string,
  classId?: string
): Promise<ClassSubmissionStatus> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/submission?${params.toString()}`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function submitClassGrades(gradingPeriodId: string, classId?: string): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/submission`, {
    method: "POST",
    body: JSON.stringify({ gradingPeriodId, classId }),
  });
  await handleJsonResponse(res);
}

export interface VisibilityStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: "M" | "F";
  parentName: string | null;
  parentContactNumber: string | null;
  parentEmail: string | null;
  isVisible: boolean;
  updatedAt: string | null;
}

export async function fetchGradeVisibility(
  gradingPeriodId: string,
  classId?: string
): Promise<VisibilityStudent[]> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/visibility?${params.toString()}`);
  const json = await handleJsonResponse(res);
  return json.data.students;
}

export interface SetGradeVisibilityParams {
  gradingPeriodId: string;
  visible: boolean;
  studentIds?: string[];
  applyToAll?: boolean;
  classId?: string;
}

export async function setGradeVisibility(params: SetGradeVisibilityParams): Promise<number> {
  const res = await authedFetch(`${BASE_URL}/visibility`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  const json = await handleJsonResponse(res);
  return json.data.updatedCount as number;
}
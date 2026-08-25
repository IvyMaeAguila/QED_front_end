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

export interface GradebookSubject {
  subjectSectionId: string;
  subjectId: number;
  subjectName: string;
}

export interface ExamScore {
  score: number;
  max: number;
}

export interface SubjectGradeCell {
  st1: ExamScore | null;
  st2: ExamScore | null;
  te: ExamScore | null;
  isComplete: boolean;
  average: number | null;
}

export interface GradebookStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: "M" | "F";
  grades: Record<string, SubjectGradeCell>;
}

export interface AdvisoryGradebook {
  sectionName: string;
  gradeLevel: string;
  subjects: GradebookSubject[];
  students: GradebookStudent[];
}

export async function fetchAdvisoryGradebook(gradingPeriodId: string): Promise<AdvisoryGradebook> {
  const res = await authedFetch(`${BASE_URL}/gradebook?gradingPeriodId=${gradingPeriodId}`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export interface ClassSubmissionStatus {
  submitted: boolean;
  submittedAt: string | null;
}

export async function fetchClassSubmissionStatus(gradingPeriodId: string): Promise<ClassSubmissionStatus> {
  const res = await authedFetch(`${BASE_URL}/submission?gradingPeriodId=${gradingPeriodId}`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function submitClassGrades(gradingPeriodId: string): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/submission`, {
    method: "POST",
    body: JSON.stringify({ gradingPeriodId }),
  });
  await handleJsonResponse(res);
}
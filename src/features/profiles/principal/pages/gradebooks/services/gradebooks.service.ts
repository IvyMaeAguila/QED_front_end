import type { GradeLevelSummary, Student } from "../data/types";
import { fetchActiveAcademicYear } from "../../../../admin/pages/subjects/services/academicyear.service"
import { API_CONFIG } from "../../../../../../config/api.config";

const BASE_URL = `${API_CONFIG.baseURL}/api/gradesheets`;
// TODO: ayusin ayon sa actual route ng getPrincipalSectionGradebook

// ---------------------------------------------------------------------------
// Grade level / section summaries
// ---------------------------------------------------------------------------
interface RawSection {
  sectionId: number;
  section: string;
  studentCount: number;
  adviserName?: string | null;
  isSubmitted?: boolean;
  gradingPeriodId?: number | null;
}

interface RawGradeLevel {
  gradeLevelId: number;
  gradeLevel: string;
  section?: string | null;
  studentCount?: number | null;
  adviserName?: string | null;
  isSubmitted?: boolean;
  gradingPeriodId?: number | null;
  sections?: RawSection[] | null;
}

export interface GradingPeriod {
  id: number;
  termNumber: number;
  termLabel: string;
  isActive: boolean;
  isSubmitted: boolean;
}

export interface GradingPeriodsResult {
  periods: GradingPeriod[];
  defaultGradingPeriodId: number | null;
}


function flattenGradeLevel(raw: RawGradeLevel): GradeLevelSummary[] {
  if (raw.sections && raw.sections.length > 0) {
    return raw.sections.map((s) => ({
      gradeLevelId: raw.gradeLevelId,
      sectionId: s.sectionId,
      grade: raw.gradeLevel,
      section: s.section,
      totalStudents: s.studentCount,
      adviserName: s.adviserName ?? null,
      isSubmitted: s.isSubmitted ?? false,
      gradingPeriodId: s.gradingPeriodId ?? null,
    }));
  }

   return [{
    gradeLevelId: raw.gradeLevelId,
    grade: raw.gradeLevel,
    section: "",
    totalStudents: raw.studentCount ?? 0,
    adviserName: raw.adviserName ?? null,
    isSubmitted: raw.isSubmitted ?? false,
    gradingPeriodId: raw.gradingPeriodId ?? null,
  }];
}

let cachedGradeLevelSummaries: GradeLevelSummary[] | null = null;

export function getCachedGradeLevelSummaries(): GradeLevelSummary[] | null {
  return cachedGradeLevelSummaries;
}

export function clearGradeLevelSummariesCache(): void {
  cachedGradeLevelSummaries = null;
}

export async function fetchGradeLevelSummaries(): Promise<GradeLevelSummary[]> {
  const response = await fetch(`${BASE_URL}/section-grade`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch grade level summaries.");
  }

  const data: RawGradeLevel[] = await response.json();
  const summaries = data.flatMap(flattenGradeLevel);

  cachedGradeLevelSummaries = summaries;

  return summaries;
}

// ---------------------------------------------------------------------------
// Principal gradebook (students + subjects + grades sa isang call)
// ---------------------------------------------------------------------------
type GradeCellStatus = "submitted" | "pending" | "not_submitted";

interface ApiGradeCell {
  status: GradeCellStatus;
  termGrade?: number | null;
  /** Legacy API alias retained for compatibility. */
  average: number | null;
  submittedByName: string | null;
  submittedAt: string | null;
}

interface ApiSubject {
  subjectSectionId: string;
  subjectId: number;
  subjectName: string;
  teacherName: string;
  submitted: boolean;
  submittedByName: string | null;
  submittedAt: string | null;
}

interface ApiStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: "M" | "F";
  grades: Record<string, ApiGradeCell>; // keyed by subjectSectionId
  overallAverage: number | null;
}

interface ApiGradebookData {
  sectionName: string | null;
  gradeLevel: string | null;
  subjects: ApiSubject[];
  students: ApiStudent[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PrincipalGradebookParams {
  gradeLevelId: string | number;
  gradingPeriodId: string | number;
  /** Null/undefined = mga estudyanteng wala pang section sa grade level na ito. */
  sectionId?: string | number | null;
}

export interface PrincipalGradebook {
  gradeLevel: string | null;
  sectionName: string | null;
  /** Unique subject names, in order — ito ang columns ng table. */
  subjects: string[];
  /** Teacher at submission info kada subject, kung kailangan sa UI. */
  subjectDetails: ApiSubject[];
  students: Student[];
}

interface RawGradingPeriod {
  id: number;
  term_number: number;
  term_label: string;
  is_active: number | boolean;
  is_submitted: number | boolean;
}

export async function fetchGradingPeriods(
  params: { gradeLevelId?: string | number; sectionId?: string | number | null },
  signal?: AbortSignal,
): Promise<GradingPeriodsResult> {
  const query = new URLSearchParams();
  if (params.gradeLevelId !== undefined) {
    query.set("gradeLevelId", String(params.gradeLevelId));
  }
  if (params.sectionId !== undefined && params.sectionId !== null && params.sectionId !== "") {
    query.set("sectionId", String(params.sectionId));
  }

  const response = await fetch(`${BASE_URL}/grading-period?${query.toString()}`, {
    credentials: "include",
    signal,
  });

  let body:
    | (ApiEnvelope<RawGradingPeriod[]> & { defaultGradingPeriodId?: number | null })
    | null = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Failed to fetch grading periods.");
  }

  return {
    periods: body.data.map((p) => ({
      id: p.id,
      termNumber: p.term_number,
      termLabel: p.term_label,
      isActive: Boolean(p.is_active),
      isSubmitted: Boolean(p.is_submitted)
    })),
    defaultGradingPeriodId: body.defaultGradingPeriodId ?? null,
  };
}

function toMiddleInitial(middleName: string | null): string {
  const trimmed = middleName?.trim();
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}.` : "";
}

function toStudent(
  apiStudent: ApiStudent,
  subjectNameBySectionId: Map<string, string>,
): Student {
  // subjectSectionId -> cell  ==>  subjectName -> number
  // Submitted lang na may average ang isinasama; ang iba ay "—" sa table.
  const grades: Record<string, number> = {};
  for (const [subjectSectionId, cell] of Object.entries(apiStudent.grades)) {
    const subjectName = subjectNameBySectionId.get(subjectSectionId);
    if (!subjectName) continue;
    const termGrade = cell.termGrade ?? cell.average;
    if (cell.status === "submitted" && termGrade !== null) {
      grades[subjectName] = termGrade;
    }
  }

  return {
    studentId: apiStudent.studentId,
    lastName: apiStudent.lastName,
    firstName: apiStudent.firstName,
    middleInitial: toMiddleInitial(apiStudent.middleName),
    gender: apiStudent.gender === "F" ? "Female" : "Male",
    grades,
  };
}


export async function fetchPrincipalGradebook(
  params: PrincipalGradebookParams,
  signal?: AbortSignal,
): Promise<PrincipalGradebook | null> {
  const query = new URLSearchParams({
    gradeLevelId: String(params.gradeLevelId),
    gradingPeriodId: String(params.gradingPeriodId),
  });
  if (params.sectionId !== undefined && params.sectionId !== null && params.sectionId !== "") {
    query.set("sectionId", String(params.sectionId));
  }

  const response = await fetch(`${BASE_URL}/?${query.toString()}`, {
    credentials: "include",
    signal,
  });

  let body: ApiEnvelope<ApiGradebookData> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<ApiGradebookData>;
  } catch {
    // non-JSON response; bahala na ang fallback message sa baba
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Failed to fetch principal gradebook.");
  }

  const data = body.data;
  if (data.gradeLevel === null) return null;

  const subjectNameBySectionId = new Map<string, string>();
  const subjectNames: string[] = [];
  for (const s of data.subjects) {
    subjectNameBySectionId.set(s.subjectSectionId, s.subjectName);
    if (!subjectNames.includes(s.subjectName)) subjectNames.push(s.subjectName);
  }

  return {
    gradeLevel: data.gradeLevel,
    sectionName: data.sectionName,
    subjects: subjectNames,
    subjectDetails: data.subjects,
    students: data.students.map((st) => toStudent(st, subjectNameBySectionId)),
  };
}

const MOCK_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function fetchSchoolYear(signal?: AbortSignal): Promise<string> {
  void signal;
  const academicYear = await fetchActiveAcademicYear();
  return academicYear.label;
}

export function fetchActiveGradingPeriodId(_signal?: AbortSignal): Promise<number> {
  return delay(1); 
}

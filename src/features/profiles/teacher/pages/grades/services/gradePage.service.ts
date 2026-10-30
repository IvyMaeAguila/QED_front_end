import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
import type {TeacherRequestOptions} from '../../../query/teacherQueryScope';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/advisoryGrading`;

async function authedFetch(url: string, init?: RequestInit, request:TeacherRequestOptions={}) {
  const response=await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init, signal:request.signal });
  if(response.status===401)request.onUnauthorized?.();
  return response;
}

async function handleJsonResponse(res: BufferedHttpReply) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new QueryHttpError(`Unexpected server response (${res.status}): ${res.url}`,res.status, undefined, {requestId: res.requestId});
  const data = await res.json();
  if (!res.ok) throw new QueryHttpError(data.message || "Request failed.",res.status,['uncertain','conflict','not_saved'].includes(data.outcome)?data.outcome:undefined, {requestId: res.requestId});
  if (!data.success) throw new Error(data.message || "Request failed.");
  return data;
}

// NEW: lets the UI show a section picker only when a teacher has more than one advisory class.
export interface AdvisorySectionOption {
  classId: string;
  sectionName: string | null;
  gradeLevel: string;
}

export async function fetchAdvisorySections(request: TeacherRequestOptions = {}): Promise<AdvisorySectionOption[]> {
  const res = await authedFetch(`${BASE_URL}/sections`, undefined, request);
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
  /** Official transmuted Term Grade. */
  termGrade?: number | null;
  /** Legacy API alias retained for compatibility. */
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
  averageSubjectCount?: number;
  overallAverageComplete?: boolean;
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
  classId?: string, request: TeacherRequestOptions = {}
): Promise<AdvisoryGradebook> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/gradebook?${params.toString()}`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export interface ClassSubmissionStatus {
  submissionVersion?: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

export async function fetchClassSubmissionStatus(
  gradingPeriodId: string,
  classId?: string, request: TeacherRequestOptions = {}
): Promise<ClassSubmissionStatus> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/submission?${params.toString()}`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export interface GradeSubmissionLog {
  id: number;
  type: "subject" | "advisory";
  label: string;
  submittedByName: string | null;
  submittedAt: string;
}

export async function fetchClassSubmissionLogs(
  gradingPeriodId: string,
  classId?: string, request: TeacherRequestOptions = {},
): Promise<GradeSubmissionLog[]> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/submission/logs?${params.toString()}`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function submitClassGrades(gradingPeriodId: string, classId?: string, request: TeacherRequestOptions = {}, expectedSubmissionVersion?: string | null): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/submission`, {
    method: "POST",
    body: JSON.stringify({ gradingPeriodId, classId, ...(expectedSubmissionVersion === undefined ? {} : {expectedSubmissionVersion}) }),
  }, request);
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
  classId?: string, request: TeacherRequestOptions = {}
): Promise<VisibilityStudent[]> {
  const params = new URLSearchParams({ gradingPeriodId });
  if (classId) params.set("classId", classId);
  const res = await authedFetch(`${BASE_URL}/visibility?${params.toString()}`, undefined, request);
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

export async function setGradeVisibility(params: SetGradeVisibilityParams, request: TeacherRequestOptions = {}): Promise<number> {
  const res = await authedFetch(`${BASE_URL}/visibility`, {
    method: "POST",
    body: JSON.stringify(params),
  }, request);
  const json = await handleJsonResponse(res);
  return json.data.updatedCount as number;
}

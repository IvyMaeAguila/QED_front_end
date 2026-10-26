import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
import type {TeacherRequestOptions} from '../../../query/teacherQueryScope';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';

import type {
  GradeItem,
  GradingPeriod,
  HolisticAxisKey,
  HolisticMap,
  ScoreMap,
} from "../detail/types/Grading";

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherGrading`;
const GRADING_PERIODS_BASE_URL = `${API_CONFIG.baseURL}/api/gradingPeriods`;

export interface Topic {
  id: string;
  topicName: string;
}

async function handleJsonResponse(res: BufferedHttpReply) {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    throw new QueryHttpError(
      res.status === 404
        ? `Route not found (${res.status}): ${res.url}. Check that this route is registered on the backend.`
        : `Unexpected server response (${res.status}): ${res.url}`,res.status, undefined, {requestId: res.requestId}
    );
  }

  const data = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status, undefined, {requestId: res.requestId});throw error;});
  if (!res.ok || !data.success) {
    if(!res.ok)throw new QueryHttpError(data.message || "Request failed.",res.status,['uncertain','conflict','not_saved'].includes(data.outcome)?data.outcome:undefined, {requestId: res.requestId});
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

async function authedFetch(url: string, init?: RequestInit, request:TeacherRequestOptions={}) {
  const response=await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init, signal:request.signal,
  });
  if(response.status===401)request.onUnauthorized?.();
  return response;
}

// ---------- Grading periods (terms) ----------
export async function fetchGradingPeriods(request: TeacherRequestOptions = {}): Promise<GradingPeriod[]> {
  const res = await authedFetch(GRADING_PERIODS_BASE_URL, undefined, request);
  const data = await handleJsonResponse(res);
  return data.data.map((r: any) => ({
    id: r.id,
    termNumber: r.termNumber,
    label: r.termLabel,
    startDate: r.startDate,
    endDate: r.endDate,
    isActive: r.isActive,
  }));
}

// ---------- Subject-section info ----------
export async function fetchSubjectSectionInfo(subjectSectionId: string, request: TeacherRequestOptions = {}) {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data as {
    subjectName: string;
    gradeLevel: string;
    sectionName: string;
    roster: { id: string; name: string; gender: "M" | "F" }[];
    isOwnAdvisory: boolean;
    adviserName: string | null;
  };
}



// ---------- Items (Written Works / Performance Task / Exams) ----------
export async function fetchItems(
  subjectSectionId: string,
  opts: { tab?: string; term?: string; allPeriods?: boolean } = {}, request: TeacherRequestOptions = {}
): Promise<GradeItem[]> {
  const params = new URLSearchParams();
  if (opts.tab) params.set("tab", opts.tab);
  if (opts.term) params.set("term", opts.term);
  if (opts.allPeriods) params.set("allPeriods", "true");

  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items?${params.toString()}`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function deleteItem(subjectSectionId: string, itemId: string, request: TeacherRequestOptions = {}): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items/${itemId}`, {
    method: "DELETE",
  }, request);
  await handleJsonResponse(res);
}

export async function addItem(
  subjectSectionId: string,
  item: {
    tab: string;
    date: string;
    activityName: string;
    topic: string;
    topicId?: string;
    templateDomainId?: string;
    format: string;
    examType?: string;
    maxItems: number;
    term?: string;
  }, request: TeacherRequestOptions = {}
): Promise<{ id: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  }, request);
  const json = await handleJsonResponse(res);
  return { id: json.id };
}

// ---------- Scores ----------
export async function fetchScores(subjectSectionId: string, request: TeacherRequestOptions = {}): Promise<ScoreMap> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/scores`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function saveScore(
  subjectSectionId: string,
  studentId: string,
  itemId: string,
  value: number | null, request: TeacherRequestOptions = {}, expectedValue?: number | null
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/scores`, {
    method: "PUT",
    body: JSON.stringify({ studentId, itemId, value, ...(expectedValue !== undefined ? {expectedValue} : {}) }),
  }, request);
  await handleJsonResponse(res);
}

// ---------- Holistic ----------
export async function fetchHolistic(
  subjectSectionId: string, request: TeacherRequestOptions = {}
): Promise<{ data: HolisticMap; weekStartDate: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/holistic`, undefined, request);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}

export async function saveHolistic(
  subjectSectionId: string,
  studentId: string,
  axis: HolisticAxisKey,
  value: number,
  termNumber: number, request: TeacherRequestOptions = {}
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/holistic`, {
    method: "PUT",
    body: JSON.stringify({ studentId, axis, value, termNumber }),
  }, request);
  await handleJsonResponse(res);
}

// ---------- Topics ----------
export async function fetchTopics(subjectSectionId: string, request: TeacherRequestOptions = {}): Promise<Topic[]> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/topics`, undefined, request);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function createTopic(subjectSectionId: string, topicName: string, request: TeacherRequestOptions = {}): Promise<{ id: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/topics`, {
    method: "POST",
    body: JSON.stringify({ topicName }),
  }, request);
  const json = await handleJsonResponse(res);
  return { id: json.id };
}

// ---------- Grade submission ----------
export interface GradeSubmissionStatus {
  submissionVersion?: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

export async function fetchGradeSubmissionStatus(
  subjectSectionId: string,
  gradingPeriodId: string, request: TeacherRequestOptions = {}
): Promise<GradeSubmissionStatus> {
  const res = await authedFetch(
    `${BASE_URL}/${subjectSectionId}/submission?gradingPeriodId=${gradingPeriodId}`, undefined, request
  );
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function submitGrades(subjectSectionId: string, gradingPeriodId: string, request: TeacherRequestOptions = {}, expectedSubmissionVersion?: string | null): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/submission`, {
    method: "POST",
    body: JSON.stringify({ gradingPeriodId, ...(expectedSubmissionVersion === undefined ? {} : {expectedSubmissionVersion}) }),
  }, request);
  await handleJsonResponse(res);
}

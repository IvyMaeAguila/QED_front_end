import { API_CONFIG } from '../../../../../../config/api.config';

import type {
  AttendanceMap,
  AttendanceStatus,
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

async function handleJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    throw new Error(
      res.status === 404
        ? `Route not found (${res.status}): ${res.url}. Check that this route is registered on the backend.`
        : `Unexpected server response (${res.status}): ${res.url}`
    );
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

// ---------- Grading periods (terms) ----------
export async function fetchGradingPeriods(): Promise<GradingPeriod[]> {
  const res = await authedFetch(GRADING_PERIODS_BASE_URL);
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
export async function fetchSubjectSectionInfo(subjectSectionId: string) {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}`);
  const json = await handleJsonResponse(res);
  return json.data as {
    subjectName: string;
    gradeLevel: string;
    sectionName: string;
    roster: { id: string; name: string; gender: "M" | "F" }[];
  };
}

// ---------- Attendance ----------
export async function fetchAttendance(
  subjectSectionId: string
): Promise<{ data: AttendanceMap; presentTotals: Record<string, number> }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/attendance`);
  const json = await handleJsonResponse(res);
  return { data: json.data, presentTotals: json.presentTotals ?? {} };
}

export async function saveAttendance(
  subjectSectionId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/attendance`, {
    method: "PUT",
    body: JSON.stringify({ studentId, date, status }),
  });
  await handleJsonResponse(res);
}

// ---------- Items (Written Works / Performance Task / Exams) ----------
export async function fetchItems(
  subjectSectionId: string,
  opts: { tab?: string; term?: string; allPeriods?: boolean } = {}
): Promise<GradeItem[]> {
  const params = new URLSearchParams();
  if (opts.tab) params.set("tab", opts.tab);
  if (opts.term) params.set("term", opts.term);
  if (opts.allPeriods) params.set("allPeriods", "true");

  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items?${params.toString()}`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function deleteItem(subjectSectionId: string, itemId: string): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items/${itemId}`, {
    method: "DELETE",
  });
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
    format: string;
    examType?: string;
    maxItems: number;
    term?: string;
  }
): Promise<{ id: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  const json = await handleJsonResponse(res);
  return { id: json.id };
}

// ---------- Scores ----------
export async function fetchScores(subjectSectionId: string): Promise<ScoreMap> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/scores`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function saveScore(
  subjectSectionId: string,
  studentId: string,
  itemId: string,
  value: number | null
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/scores`, {
    method: "PUT",
    body: JSON.stringify({ studentId, itemId, value }),
  });
  await handleJsonResponse(res);
}

// ---------- Holistic ----------
export async function fetchHolistic(
  subjectSectionId: string
): Promise<{ data: HolisticMap; weekStartDate: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/holistic`);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}

export async function saveHolistic(
  subjectSectionId: string,
  studentId: string,
  axis: HolisticAxisKey,
  value: number,
  termNumber: number
): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/holistic`, {
    method: "PUT",
    body: JSON.stringify({ studentId, axis, value, termNumber }),
  });
  await handleJsonResponse(res);
}

// ---------- Topics ----------
export async function fetchTopics(subjectSectionId: string): Promise<Topic[]> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/topics`);
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function createTopic(subjectSectionId: string, topicName: string): Promise<{ id: string }> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/topics`, {
    method: "POST",
    body: JSON.stringify({ topicName }),
  });
  const json = await handleJsonResponse(res);
  return { id: json.id };
}

// ---------- Grade submission ----------
export interface GradeSubmissionStatus {
  submitted: boolean;
  submittedAt: string | null;
}

export async function fetchGradeSubmissionStatus(
  subjectSectionId: string,
  gradingPeriodId: string
): Promise<GradeSubmissionStatus> {
  const res = await authedFetch(
    `${BASE_URL}/${subjectSectionId}/submission?gradingPeriodId=${gradingPeriodId}`
  );
  const json = await handleJsonResponse(res);
  return json.data;
}

export async function submitGrades(subjectSectionId: string, gradingPeriodId: string): Promise<void> {
  const res = await authedFetch(`${BASE_URL}/${subjectSectionId}/submission`, {
    method: "POST",
    body: JSON.stringify({ gradingPeriodId }),
  });
  await handleJsonResponse(res);
}
import type { DayOfWeek, SchedulePeriod } from "../types/Class";


const BASE_URL = "http://localhost:7400/api/classes";// palitan ng actual base url mo

// Backend expects full day names, frontend uses short codes
const DAY_NAME_MAP: Record<DayOfWeek, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

export interface GradeLevelOption {
  id: number;
  grade_level: string;
}

export interface SectionOption {
  id: number;
  section_name: string;
}

export interface SubjectOption {
  id: number;
  subject_name: string;
  grade_level_id: number;
}

export interface TeacherOption {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email_address: string;
  contact_number: string;
}

export interface ClassRecord {
  id: number;
  gradeLevelId: number;
  gradeLevel: string;
  sectionId: number;
  section: string;
  adviserId: number;
  adviserName: string;
  adviserEmail: string | null;
  adviserContact: string | null
  studentCount: number;
  schedule: {
    id: number;
    subject: string;
    teacherId: number;
    teacherName: string;
    startTime: string;
    endTime: string;
    days: string[];
  }[];
}

interface CreateClassPayload {
  gradeLevelId: number;
  sectionId: number;
  subjectName: string;
  adviserId: string;
  schedule: SchedulePeriod[];
}

// Same shape as create — the backend's updateClass expects gradeLevel, section,
// adviserId, and the full replacement schedule, exactly like createClass.
export type UpdateClassPayload = CreateClassPayload;

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

export async function fetchGradeLevels(): Promise<GradeLevelOption[]> {
  const res = await fetch(`${BASE_URL}/gradeLevels`);
  const data = await handleJsonResponse(res);
  return data.data;
}

export async function fetchSectionsByGrade(
  gradeLevelId: number,
  excludeClassId?: string | number,
): Promise<SectionOption[]> {
  const params = new URLSearchParams({ gradeLevelId: String(gradeLevelId) });
  if (excludeClassId) params.set("excludeClassId", String(excludeClassId));
  const res = await fetch(`${BASE_URL}/sections?${params.toString()}`);
  const data = await handleJsonResponse(res);
  return data.data;
}

export async function fetchTeachers(excludeClassId?: string | number): Promise<TeacherOption[]> {
  const params = new URLSearchParams();
  if (excludeClassId) params.set("excludeClassId", String(excludeClassId));
  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/teacher${qs ? `?${qs}` : ""}`);
  const data = await handleJsonResponse(res);
  return data.data;
}

export async function fetchSubjectsByGrade(gradeLevelId: number): Promise<SubjectOption[]> {
  const res = await fetch(`${BASE_URL}/getSubByGrade/${gradeLevelId}`);
  const data = await handleJsonResponse(res);
  return data.data;
}

function buildScheduleBody(schedule: SchedulePeriod[]) {
  return schedule.map((p) => ({
    subject: p.subject,
    teacherId: Number(p.teacherId),
    startTime: p.startTime,
    endTime: p.endTime,
    days: p.days.map((d) => DAY_NAME_MAP[d]),
  }));
}

export async function createClass(payload: CreateClassPayload) {
  const body = {
    gradeLevel: payload.gradeLevelId, // int, matches grade_level_id
    section: payload.sectionId, // int, matches section_id
    subjects: payload.subjectName,
    adviserId: Number(payload.adviserId), // int
    schedule: buildScheduleBody(payload.schedule),
  };

  const res = await fetch(`${BASE_URL}/addClass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res); // { success, message, classId }
}

// PUT /updateClass/:id — replaces the class's grade/section/adviser and its
// entire schedule (backend deletes the old schedule rows and re-inserts these).
export async function updateClassApi(id: string | number, payload: UpdateClassPayload) {
  const body = {
    gradeLevel: payload.gradeLevelId,
    section: payload.sectionId,
    adviserId: Number(payload.adviserId),
    schedule: buildScheduleBody(payload.schedule),
  };

  const res = await fetch(`${BASE_URL}/updateClass/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res); // { success, message, classId }
}

export async function fetchClasses(): Promise<ClassRecord[]> {
  const res = await fetch(`${BASE_URL}/`);
  const data = await handleJsonResponse(res);
  return data.data;
}

export async function deleteClassApi(id: string | number) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  return handleJsonResponse(res);
}
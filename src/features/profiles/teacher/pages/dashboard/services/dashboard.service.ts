import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import type { TeacherRequestOptions } from '../../../query/teacherQueryScope';
import { API_CONFIG } from '../../../../../../config/api.config';
import type { EventItem } from '../components/UpcomingEvents';

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherDashboard`;

// Separate base URL here because school-calendar routes are mounted
// separately on the backend (/api/school-calendar), not under /api/teacherDashboard.

export interface DashboardSummary {
  name: string;
}

export interface TeacherStats {
  advisoryClassCount: number;
  totalStudents: number;
  totalClasses: number;
}

export interface AttendanceSummary {
  recordedCount?: number;
  hasAdvisory?: boolean;
  present: number;
  absent: number;
  late: number;
}

export interface AgendaItem {
  id: number;
  subjectName: string;
  className: string; 
  room: string | null;
  startTime: string; 
  endTime: string;
  timeLabel: string; 
}

export interface WeeklyScheduleItem extends AgendaItem {
  dayOfWeek: string;
}

export async function fetchWeeklySchedule(options?: TeacherRequestOptions): Promise<WeeklyScheduleItem[]> {
  const res = await fetch(`${BASE_URL}/schedule`, { credentials: "include", signal: options?.signal });
  const data = await handleJsonResponse(res, options);
  return data.data;
}

// Shape returned by the backend before we split the date into day/month
interface RawUpcomingEvent {
  id: string | number;
  title: string;
  type: "activity" | "holiday";
  date: string; // e.g. "2026-09-24"
  holidayType?: string;
}

async function handleJsonResponse(res: BufferedHttpReply, options?: TeacherRequestOptions) {
  if (res.status === 401 && !options?.signal?.aborted) options?.onUnauthorized?.();
  const data = await res.json().catch(error => {
    if (!res.ok) throw new QueryHttpError("Request failed.", res.status, undefined, {requestId: res.requestId});
    throw error;
  });
  if (!res.ok || !data.success) {
    throw new QueryHttpError(data.message || "Request failed.", res.status, undefined, {requestId: res.requestId});
  }
  return data;
}

function toDayMonth(dateStr: string) {
  const day = Number(dateStr.slice(8, 10));
  const month = new Date(dateStr)
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  return { day, month };
}

export async function fetchDashboardSummary(options?: TeacherRequestOptions): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/summary`, {
    credentials: "include", signal: options?.signal,
  });

  const data = await handleJsonResponse(res, options);
  return data;
}

export async function fetchTeacherStats(options?: TeacherRequestOptions): Promise<TeacherStats> {
  const res = await fetch(`${BASE_URL}/stats`, {
    credentials: "include", signal: options?.signal,
  });

  const data = await handleJsonResponse(res, options);
  return data;
}

export async function fetchAttendanceSummary(options?: TeacherRequestOptions): Promise<AttendanceSummary> {
  const res = await fetch(`${BASE_URL}/attendance`, {
    credentials: "include", signal: options?.signal,
  });

  const data = await handleJsonResponse(res, options);
  return data;
}

export async function fetchUpcomingEvents(limit = 5, options?: TeacherRequestOptions): Promise<EventItem[]> {
  const res = await fetch(`${BASE_URL}/upcoming?limit=${limit}`, {
    credentials: "include", signal: options?.signal,
  });

  const data = await handleJsonResponse(res, options);
  const rawEvents: RawUpcomingEvent[] = data.data;

  return rawEvents.map((event) => {
    const { day, month } = toDayMonth(event.date);
    return {
      id: String(event.id),
      title: event.title,
      type: event.type,
      day,
      month,
      holidayType: event.holidayType,
    };
  });
}

export async function fetchTodaysAgenda(options?: TeacherRequestOptions): Promise<AgendaItem[]> {
  const res = await fetch(`${BASE_URL}/agenda`, {
    credentials: "include", signal: options?.signal,
  });

  const data = await handleJsonResponse(res, options);
  return data.data;
}

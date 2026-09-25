import { API_CONFIG } from '../../../../../../config/api.config';
import type { EventItem } from '../components/UpcomingEvents';

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherDashboard`;

// Separate base URL here because school-calendar routes are mounted
// separately on the backend (/api/school-calendar), not under /api/teacherDashboard.

export interface DashboardSummary {
  name: string;
  classesToday: number;
  pendingGrades: number;
}

export interface TeacherStats {
  advisoryClassCount: number;
  totalStudents: number;
  totalClasses: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
}

// Shape returned by the backend before we split the date into day/month
interface RawUpcomingEvent {
  id: string | number;
  title: string;
  type: "activity" | "holiday";
  date: string; // e.g. "2026-09-24"
  holidayType?: string;
}

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
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

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/summary`, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);
  return data;
}

export async function fetchTeacherStats(): Promise<TeacherStats> {
  const res = await fetch(`${BASE_URL}/stats`, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);
  return data;
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const res = await fetch(`${BASE_URL}/attendance`, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);
  return data;
}

export async function fetchUpcomingEvents(limit = 5): Promise<EventItem[]> {
  const res = await fetch(`${BASE_URL}/upcoming?limit=${limit}`, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);
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


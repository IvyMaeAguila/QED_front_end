import { API_CONFIG } from '../../../../../../config/api.config';
import type { EventItem } from '../components/UpcomingEvents';

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherDashboard`;

// Hiwalay na base URL ‘to dahil hiwalay ring naka-mount ang school-calendar
// routes sa backend (/api/school-calendar), hindi siya nasa ilalim ng /api/teacherDashboard.

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

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
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
  return data.data;
}
// calendar.service.ts

const BASE_URL = "http://localhost:7400/api/calendar"; // palitan ng actual base url mo

export type CalendarRole = "principal" | "teacher" | "parent";

export interface CalendarEventRecord {
  id: number;
  title: string;
  description: string | null;
  calendarDate: string; // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm:ss"
  endTime: string | null;
  gradeLevelId: number | null;
  gradeLevel: string; // "All Grade Levels" kung null
  sectionId: number | null;
  section: string; // "All Sections" kung null
  createdBy: number | null;
  createdByRole: CalendarRole | "admin" | null; 
  createdByName: string | null; 
  createdAt: string;
  roles: CalendarRole[];
}

export interface CreateCalendarEventPayload {
  title: string;
  description?: string | null;
  calendarDate: string;
  startTime?: string | null;
  endTime?: string | null;
  gradeLevelId?: number | null;
  sectionId?: number | null;
  roles: CalendarRole[];
  createdBy?: number | null;
}

export interface UpdateCalendarEventPayload {
  title: string;
  description?: string | null;
  calendarDate: string;
  startTime?: string | null;
  endTime?: string | null;
  gradeLevelId?: number | null;
  sectionId?: number | null;
  roles?: CalendarRole[];
}

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

// --------------------------------------------------------
// Fetch all calendar events
// --------------------------------------------------------
export async function fetchCalendarEvents(): Promise<CalendarEventRecord[]> {
  const res = await fetch(`${BASE_URL}/`);
  const data = await handleJsonResponse(res);
  return data.data;
}

// --------------------------------------------------------
// Fetch single calendar event by id
// --------------------------------------------------------
export async function fetchCalendarEventById(id: string | number): Promise<CalendarEventRecord> {
  const res = await fetch(`${BASE_URL}/${id}`);
  const data = await handleJsonResponse(res);
  return data.data;
}

// --------------------------------------------------------
// Create calendar event
// --------------------------------------------------------
export async function createCalendarEvent(payload: CreateCalendarEventPayload) {
  const body = {
    title: payload.title,
    description: payload.description ?? null,
    calendarDate: payload.calendarDate,
    startTime: payload.startTime ?? null,
    endTime: payload.endTime ?? null,
    gradeLevelId: payload.gradeLevelId ?? null,
    sectionId: payload.sectionId ?? null,
    roles: payload.roles,
    createdBy: payload.createdBy ?? null,
  };

  const res = await fetch(`${BASE_URL}/addEvent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res); // { success, message, calendarId }
}

// --------------------------------------------------------
// Update calendar event
// --------------------------------------------------------
export async function updateCalendarEvent(
  id: string | number,
  payload: UpdateCalendarEventPayload
) {
  const body = {
    title: payload.title,
    description: payload.description ?? null,
    calendarDate: payload.calendarDate,
    startTime: payload.startTime ?? null,
    endTime: payload.endTime ?? null,
    gradeLevelId: payload.gradeLevelId ?? null,
    sectionId: payload.sectionId ?? null,
    roles: payload.roles,
  };

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res); // { success, message }
}

// --------------------------------------------------------
// Delete calendar event (soft delete)
// --------------------------------------------------------
export async function deleteCalendarEventApi(id: string | number) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  return handleJsonResponse(res); // { success, message }
}
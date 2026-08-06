// calendar.service.ts
import type { AnnouncementAudience, CalendarEvent, Role } from "../types/Calendar";

const BASE_URL = "http://localhost:7400/api/calendar"; // palitan ng actual base url mo

type BackendRole = "admin" | "principal" | "teacher" | "parent";

interface CalendarEventRecordDTO {
  id: number;
  title: string;
  description: string | null;
  calendarDate: string;
  startTime: string | null;
  endTime: string | null;
  gradeLevelId: number | null;
  gradeLevel: string; // "All Grade Levels" kung null
  sectionId: number | null;
  section: string; // "All Sections" kung null
  createdBy: number | null;
  createdByRole: BackendRole | null;
  createdByName: string | null;
  createdAt: string;
  roles: BackendRole[];
}

function toBackendRole(role: Role): BackendRole {
  return role.toLowerCase() as BackendRole;
}

function toFrontendRole(role: string): Role {
  return role.toUpperCase() as Role;
}

function recordToEvent(record: CalendarEventRecordDTO): CalendarEvent {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    date: record.calendarDate,
    startTime: record.startTime ?? undefined,
    endTime: record.endTime ?? undefined,
    audience: {
      roles: record.roles.map(toFrontendRole),
      gradeLevel: record.gradeLevelId ? (record.gradeLevel as unknown as AnnouncementAudience["gradeLevel"]) : undefined,
      section: record.sectionId ? record.section : undefined,
    },
    createdByRole: record.createdByRole ? toFrontendRole(record.createdByRole) : "ADMIN",
    createdByName: record.createdByName ?? "Unknown",
  };
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
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await fetch(`${BASE_URL}/`);
  const data = await handleJsonResponse(res);
  return (data.data as CalendarEventRecordDTO[]).map(recordToEvent);
}

// --------------------------------------------------------
// Fetch single calendar event by id
// --------------------------------------------------------
export async function fetchCalendarEventById(id: number): Promise<CalendarEvent> {
  const res = await fetch(`${BASE_URL}/${id}`);
  const data = await handleJsonResponse(res);
  return recordToEvent(data.data as CalendarEventRecordDTO);
}

// --------------------------------------------------------
// Create calendar event
// --------------------------------------------------------
export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  audience: AnnouncementAudience;
  gradeLevelId?: number | null;
  sectionId?: number | null;
  createdBy?: number | null;
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<number> {
  const body = {
    title: input.title,
    description: input.description ?? null,
    calendarDate: input.date,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    gradeLevelId: input.gradeLevelId ?? null,
    sectionId: input.sectionId ?? null,
    roles: input.audience.roles.map(toBackendRole),
    createdBy: input.createdBy ?? null,
  };

  const res = await fetch(`${BASE_URL}/addEvent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res); // { success, message, calendarId }
  return data.calendarId as number;
}

// --------------------------------------------------------
// Update calendar event
// --------------------------------------------------------
export type UpdateCalendarEventInput = CreateCalendarEventInput;

export async function updateCalendarEvent(id: number, input: UpdateCalendarEventInput): Promise<void> {
  const body = {
    title: input.title,
    description: input.description ?? null,
    calendarDate: input.date,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    gradeLevelId: input.gradeLevelId ?? null,
    sectionId: input.sectionId ?? null,
    roles: input.audience.roles.map(toBackendRole),
  };

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleJsonResponse(res); // { success, message }
}

// --------------------------------------------------------
// Delete calendar event (soft delete)
// --------------------------------------------------------
export async function deleteCalendarEventApi(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  await handleJsonResponse(res); // { success, message }
}
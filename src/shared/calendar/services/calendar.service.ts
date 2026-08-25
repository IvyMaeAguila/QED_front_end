// calendar.service.ts
import type { CalendarActivity, CalendarHoliday, HolidayType } from "../types/Calendar";

const BASE_URL = "http://localhost:7400/api/calendar"; // palitan ng actual base url mo

// --------------------------------------------------------
// DTO shapes — palitan kung iba ang field names ng backend mo
// --------------------------------------------------------
interface CalendarActivityRecordDTO {
  id: number;
  title: string;
  date: string;
  createdBy: number | null;
  createdAt: string;
}

interface CalendarHolidayRecordDTO {
  id: number;
  title: string;
  date: string;
  type: HolidayType | null;
  createdBy: number | null;
  createdAt: string;
}

function activityRecordToActivity(record: CalendarActivityRecordDTO): CalendarActivity {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
  };
}

function holidayRecordToHoliday(record: CalendarHolidayRecordDTO): CalendarHoliday {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    type: record.type ?? undefined,
  };
}

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

// ==========================================================
// ACTIVITIES
// ==========================================================

// --------------------------------------------------------
// Fetch all activities
// --------------------------------------------------------
export async function fetchCalendarActivities(): Promise<CalendarActivity[]> {
  const res = await fetch(`${BASE_URL}/activities`);
  const data = await handleJsonResponse(res);
  return (data.data as CalendarActivityRecordDTO[]).map(activityRecordToActivity);
}

// --------------------------------------------------------
// Create activities (bulk — supports the "+ Add Another" rows
// from AddCalendarEntriesModal, saved all at once)
// --------------------------------------------------------
export interface CreateCalendarActivityInput {
  title: string;
  date: string;
  createdBy?: number | null;
}

export async function createCalendarActivities(
  entries: CreateCalendarActivityInput[],
  createdBy?: number | null
): Promise<CalendarActivity[]> {
  const body = {
    entries: entries.map((e) => ({
      title: e.title,
      date: e.date,
      createdBy: e.createdBy ?? createdBy ?? null,
    })),
  };


  const res = await fetch(`${BASE_URL}/activities/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res);
  return (data.data as CalendarActivityRecordDTO[]).map(activityRecordToActivity);
}

// --------------------------------------------------------
// Update single activity
// --------------------------------------------------------
export async function updateCalendarActivity(id: number, input: CreateCalendarActivityInput): Promise<void> {
  const body = { title: input.title, date: input.date };

const res = await fetch(`${BASE_URL}/activities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleJsonResponse(res);
}

// --------------------------------------------------------
// Delete activity (soft delete)
// --------------------------------------------------------
export async function deleteCalendarActivityApi(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/activities/${id}`, { method: "DELETE" });
  await handleJsonResponse(res); // { success, message }
}

// ==========================================================
// HOLIDAYS
// ==========================================================

// --------------------------------------------------------
// Fetch all holidays
// --------------------------------------------------------
export async function fetchCalendarHolidays(): Promise<CalendarHoliday[]> {
  const res = await fetch(`${BASE_URL}/holidays`);
  const data = await handleJsonResponse(res);
  return (data.data as CalendarHolidayRecordDTO[]).map(holidayRecordToHoliday);
}

// --------------------------------------------------------
// Create holidays (bulk)
// --------------------------------------------------------
export interface CreateCalendarHolidayInput {
  title: string;
  date: string;
  type?: HolidayType;
  createdBy?: number | null;
}

export async function createCalendarHolidays(
  entries: CreateCalendarHolidayInput[],
  createdBy?: number | null
): Promise<CalendarHoliday[]> {
  const body = {
    entries: entries.map((e) => ({
      title: e.title,
      date: e.date,
      holidayType: e.type ?? "regular",
      createdBy: e.createdBy ?? createdBy ?? null,
    })),
  };

  const res = await fetch(`${BASE_URL}/holidays/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res); // { success, message, data: CalendarHolidayRecordDTO[] }
  return (data.data as CalendarHolidayRecordDTO[]).map(holidayRecordToHoliday);
}

// --------------------------------------------------------
// Update single holiday
// --------------------------------------------------------
export async function updateCalendarHoliday(id: number, input: CreateCalendarHolidayInput): Promise<void> {
  const body = {
    title: input.title,
    date: input.date,
    holidayType: input.type ?? "regular",
  };

  const res = await fetch(`${BASE_URL}/holidays/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleJsonResponse(res); // { success, message }
}
// --------------------------------------------------------
// Delete holiday (soft delete)
// --------------------------------------------------------
export async function deleteCalendarHolidayApi(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/holidays/${id}`, { method: "DELETE" });
  await handleJsonResponse(res); // { success, message }
}
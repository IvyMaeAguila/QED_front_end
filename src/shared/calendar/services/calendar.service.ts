import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
// calendar.service.ts
import type { CalendarActivity, CalendarHoliday, HolidayType } from "../types/Calendar";
import { API_CONFIG } from '../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/calendar`; 

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

export interface CalendarRequestOptions { signal?: AbortSignal; onUnauthorized?: () => void }

async function handleJsonResponse(res: BufferedHttpReply, options: CalendarRequestOptions = {}) {
  if (res.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
  const data = await res.json().catch(() => ({ success: false, message: "Request failed." }));
  if (!res.ok || !data.success) {
    const error = new Error(data.message || "Request failed.");
    Object.assign(error, { status: res.status });
    throw error;
  }
  return data;
}

export async function fetchCalendarActivities(options: CalendarRequestOptions = {}): Promise<CalendarActivity[]> {
  const res = await fetch(`${BASE_URL}/activities`, { signal: options.signal });
  const data = await handleJsonResponse(res, options);
  return (data.data as CalendarActivityRecordDTO[]).map(activityRecordToActivity);
}

export async function fetchAllCalendarActivities(options: CalendarRequestOptions = {}): Promise<CalendarActivity[]> {
  const res = await fetch(`${BASE_URL}/all-activities`, { signal: options.signal });
  const data = await handleJsonResponse(res, options);
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
  createdBy?: number | null,
  options: CalendarRequestOptions = {}
): Promise<CalendarActivity[]> {
  const body = {
    entries: entries.map((e) => ({
      title: e.title,
      date: e.date,
      createdBy: e.createdBy ?? createdBy ?? null,
    })),
  };


  const res = await fetch(`${BASE_URL}/activities`, {
    method: "POST",
    credentials: "include", signal: options.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res, options);
  return (data.data as CalendarActivityRecordDTO[]).map(activityRecordToActivity);
}

// --------------------------------------------------------
// Update single activity
// --------------------------------------------------------
export async function updateCalendarActivity(id: number, input: CreateCalendarActivityInput, options: CalendarRequestOptions = {}): Promise<void> {
  const body = { title: input.title, date: input.date };

const res = await fetch(`${BASE_URL}/activities/${id}`, {
    method: "PUT",
    credentials: "include", signal: options.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleJsonResponse(res, options);
}

// --------------------------------------------------------
// Delete activity (soft delete)
// --------------------------------------------------------
export async function deleteCalendarActivityApi(id: number, options: CalendarRequestOptions = {}): Promise<void> {
  const res = await fetch(`${BASE_URL}/activities/${id}`, { method: "DELETE", credentials: "include", signal: options.signal });
  await handleJsonResponse(res, options); // { success, message }
}

// ==========================================================
// HOLIDAYS
// ==========================================================

// --------------------------------------------------------
// Fetch all holidays
// --------------------------------------------------------
export async function fetchCalendarHolidays(options: CalendarRequestOptions = {}): Promise<CalendarHoliday[]> {
  const res = await fetch(`${BASE_URL}/holidays`, { signal: options.signal });
  const data = await handleJsonResponse(res, options);
  return (data.data as CalendarHolidayRecordDTO[]).map(holidayRecordToHoliday);
}

export async function fetchAllCalendarHolidays(options: CalendarRequestOptions = {}): Promise<CalendarHoliday[]> {
  const res = await fetch(`${BASE_URL}/all-holidays`, { signal: options.signal });
  const data = await handleJsonResponse(res, options);
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
  createdBy?: number | null,
  options: CalendarRequestOptions = {}
): Promise<CalendarHoliday[]> {
  const body = {
    entries: entries.map((e) => ({
      title: e.title,
      date: e.date,
      holidayType: e.type ?? "regular",
      createdBy: e.createdBy ?? createdBy ?? null,
    })),
  };

  const res = await fetch(`${BASE_URL}/holidays`, {
    method: "POST",
    credentials: "include", signal: options.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res, options); // { success, message, data: CalendarHolidayRecordDTO[] }
  return (data.data as CalendarHolidayRecordDTO[]).map(holidayRecordToHoliday);
}

// --------------------------------------------------------
// Update single holiday
// --------------------------------------------------------
export async function updateCalendarHoliday(id: number, input: CreateCalendarHolidayInput, options: CalendarRequestOptions = {}): Promise<void> {
  const body = {
    title: input.title,
    date: input.date,
    holidayType: input.type ?? "regular",
  };

  const res = await fetch(`${BASE_URL}/holidays/${id}`, {
    method: "PUT",
    credentials: "include", signal: options.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await handleJsonResponse(res, options); // { success, message }
}
// --------------------------------------------------------
// Delete holiday (soft delete)
// --------------------------------------------------------
export async function deleteCalendarHolidayApi(id: number, options: CalendarRequestOptions = {}): Promise<void> {
  const res = await fetch(`${BASE_URL}/holidays/${id}`, { method: "DELETE", credentials: "include", signal: options.signal });
  await handleJsonResponse(res, options); // { success, message }
}

import { API_CONFIG } from '../../../../../../../config/api.config';

import type { ScheduleItem, ScheduleDay } from "../types/types";

interface RawScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  days: ScheduleDay[];
}

const BASE_URL = `${API_CONFIG.baseURL}/api/classSchedule`;

// In-memory cache keyed by studentId — survives navigating away and back
// (resets on full page reload since it's module-level state)
const cache = new Map<string, ScheduleItem[]>();

export function getCachedClassSchedule(studentId: string): ScheduleItem[] | undefined {
  return cache.get(studentId);
}

export function clearClassScheduleCache(studentId?: string) {
  if (studentId) {
    cache.delete(studentId);
  } else {
    cache.clear();
  }
}

export async function fetchClassSchedule(
  studentId: string,
  options?: { forceRefresh?: boolean }
): Promise<ScheduleItem[]> {
  if (!options?.forceRefresh && cache.has(studentId)) {
    return cache.get(studentId)!;
  }

  const response = await fetch(`${BASE_URL}/${studentId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch class schedule (status ${response.status})`);
  }

  const data: RawScheduleItem[] = await response.json();

  const mapped: ScheduleItem[] = data.map((row) => ({
    id: row.id,
    subject: row.subject,
    teacher: row.teacher,
    startTime: row.startTime,
    endTime: row.endTime,
    days: row.days,
  }));

  cache.set(studentId, mapped);

  return mapped;
}
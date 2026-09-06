// services/studentProfile.service.ts
// Location: Student/StudentProfile/services/studentProfile.service.ts

import { API_CONFIG } from '../../../../../../../config/api.config';

import type { StudentProfileData } from "../types/types";

const API_BASE = `${API_CONFIG.baseURL}/api/studentProfile`;

export interface UpdateStudentProfilePayload {
  dateOfBirth: string;
  residentialAddress: string;
}

async function parseJsonSafely(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/students/:studentId
 * Maps 1:1 to modules/.../studentProfiles.controller.js -> getStudentProfile
 */
export async function fetchStudentProfile(studentId: string): Promise<StudentProfileData> {
  const response = await fetch(`${API_BASE}/${studentId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const body = await parseJsonSafely(response);
    throw new Error(body?.message || `Failed to fetch student profile (status ${response.status})`);
  }

  return (await response.json()) as StudentProfileData;
}

/**
 * PATCH /api/students/:studentId
 * Only Date of Birth and Residential Address are editable from the admin
 * Personal Information card — everything else (name, LRN, gender, class)
 * stays locked, so the payload only ever carries these two fields.
 */
export async function updateStudentProfile(
  studentId: string,
  updates: UpdateStudentProfilePayload
): Promise<StudentProfileData> {
  const response = await fetch(`${API_BASE}/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const body = await parseJsonSafely(response);
    throw new Error(body?.message || `Failed to update student profile (status ${response.status})`);
  }

  return (await response.json()) as StudentProfileData;
}
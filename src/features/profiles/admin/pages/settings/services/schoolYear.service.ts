import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/sy`; 
 
// Tugma sa response shape ng sy.controller.js: { success, message, data }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
 
export interface SchoolYearRow {
  id: number;
  school_year: string;
  is_active: number; // 0 | 1
}
 
export async function fetchAllSchoolYears(): Promise<SchoolYearRow[]> {
  const res = await fetch(`${BASE_URL}/getAllSy`);
  const json: ApiResponse<SchoolYearRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch school years.");
  return json.data ?? [];
}
 
export async function fetchActiveSchoolYear(): Promise<SchoolYearRow | null> {
  const res = await fetch(`${BASE_URL}/getActiveSy`);
  if (res.status === 404) return null;
  const json: ApiResponse<SchoolYearRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch active school year.");
  return json.data ?? null;
}
 
export async function fetchSchoolYearById(id: string): Promise<SchoolYearRow> {
  const res = await fetch(`${BASE_URL}/getSyById/${id}`);
  const json: ApiResponse<SchoolYearRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch school year.");
  return json.data as SchoolYearRow;
}
 
export async function createSchoolYear(payload: {
  school_year: string;
  is_active?: boolean;
}): Promise<SchoolYearRow> {
  const res = await fetch(`${BASE_URL}/createSy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<SchoolYearRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create school year.");
  return json.data as SchoolYearRow;
}
 
export async function updateSchoolYear(
  id: string,
  payload: { school_year?: string; is_active?: boolean }
): Promise<SchoolYearRow> {
  const res = await fetch(`${BASE_URL}/updateSy/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<SchoolYearRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update school year.");
  return json.data as SchoolYearRow;
}
 
// Sets the given school year as active. Backend deactivates all others in the same query.
export async function activateSchoolYear(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/activateSy/${id}`, {
    method: "PATCH",
  });
  const json: ApiResponse<void> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to activate school year.");
}
 
export async function deleteSchoolYear(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/deleteSy/${id}`, {
    method: "DELETE",
  });
  const json: ApiResponse<void> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to deactivate school year.");
}
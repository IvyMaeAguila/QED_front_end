import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/academic-year`;

export type SchoolYearStatus = "Active" | "Inactive";
export type TermStatus = "Active" | "Upcoming" | "Completed";

export interface AcademicYearRow {
  id: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
  status: SchoolYearStatus;
}

export interface TermRow {
  id: number;
  termNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
}

export interface TermInput {
  termNumber: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
}

export async function fetchActiveAcademicYear(): Promise<AcademicYearRow> {
  const res = await fetch(`${BASE_URL}/getAcademicYear`);
  const json: ApiResponse<AcademicYearRow> = await res.json();
  if (!res.ok || !json.data) throw new Error(json.message || "Failed to fetch academic year.");
  return json.data;
}

export async function updateAcademicYear(
  id: number,
  updates: { label: string; status: SchoolYearStatus },
): Promise<AcademicYearRow> {
  const res = await fetch(`${BASE_URL}/updateAcademicYear/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const json: ApiResponse<AcademicYearRow> = await res.json();
  if (!res.ok || !json.data) throw new Error(json.message || "Failed to update academic year.");
  return json.data;
}

export async function fetchTerms(schoolYearId: number): Promise<TermRow[]> {
  const res = await fetch(`${BASE_URL}/getTerms/${schoolYearId}`);
  const json: ApiResponse<TermRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch terms.");
  return json.data ?? [];
}

export async function saveTerms(
  schoolYearId: number,
  terms: TermInput[],
): Promise<TermRow[]> {
  const res = await fetch(`${BASE_URL}/saveTerms/${schoolYearId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ terms }),
  });
  const json: ApiResponse<TermRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to save terms.");
  return json.data ?? [];
}
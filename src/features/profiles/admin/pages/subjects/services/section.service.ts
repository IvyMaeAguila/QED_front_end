import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/section`;

export interface GradeLevelRow {
  id: number;
  grade_level: string;
}

export interface SectionRow {
  id: number;
  grade_level_id: string;
  section_name: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
}

export async function fetchSectionsByGrade(gradeLevel: string): Promise<SectionRow[]> {
  const res = await fetch(`${BASE_URL}/getSections/${gradeLevel}`);
  const json: ApiResponse<SectionRow[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch sections.");
  return json.data ?? [];
}

export async function createSection(gradeLevel: string, sectionName: string): Promise<SectionRow> {
  const res = await fetch(`${BASE_URL}/addSection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gradeLevel, sectionName }),
  });
  const json: ApiResponse<{ id: number; grade_level_id: string; section_name: string }> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to add section.");
  return json.data as SectionRow;
}

export async function updateSection(id: string, sectionName: string): Promise<SectionRow> {
  const res = await fetch(`${BASE_URL}/updateSection/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionName }),
  });
  const json: ApiResponse<SectionRow> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update section.");
  return json.data as SectionRow;
}

export async function deleteSection(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/deleteSection/${id}`, { method: "DELETE" });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete section.");
}

export async function fetchSectionIdsUsedByClasses(): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/sectionIdsUsedByClasses`);
  const json: ApiResponse<number[]> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch used sections.");
  return json.data ?? [];
}
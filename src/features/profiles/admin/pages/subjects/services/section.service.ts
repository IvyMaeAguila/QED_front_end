const BASE_URL = 'http://localhost:7400/api/section';

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

export async function deleteSection(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/deleteSections/${id}`, { method: "PUT" });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to remove section.");
}

const BASE_URL = "http://localhost:7400/api/section";

export interface TeacherRow {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email_address: string;
  contact_number: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
}

export async function fetchTeachers(): Promise<TeacherRow[]> {
  const res = await fetch(`${BASE_URL}/getTeachers`);

  const json: ApiResponse<TeacherRow[]> = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch teachers.");
  }

  return json.data ?? [];
}
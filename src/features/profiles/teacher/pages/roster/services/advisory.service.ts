import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherAdvisory`;

export interface AdvisoryStudent {
  id: number;
  student_number: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  gender: "Male" | "Female";
}

export interface AdvisoryRoster {
  gradeLevel: string | null;
  sectionName: string | null;
  students: AdvisoryStudent[];
}

interface AdvisoryRosterResponse {
  success: boolean;
  message?: string;
  gradeLevel: string | null;
  sectionName: string | null;
  students: AdvisoryStudent[];
}

async function handleJsonResponse(res: Response): Promise<AdvisoryRosterResponse> {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}
export async function fetchAdvisoryRoster(): Promise<AdvisoryRoster> {
  const res = await fetch(`${BASE_URL}/roster`, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);

  return {
    gradeLevel: data.gradeLevel,
    sectionName: data.sectionName,
    students: data.students,
  };
}
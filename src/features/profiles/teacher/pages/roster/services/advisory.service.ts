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

/**
 * Fetches the roster for an advisory class.
 *
 * `classId` is optional so this keeps working for teachers with a single
 * advisory class (the backend can just return that one class when no id is
 * given). Pass the id of the currently-selected tab once a teacher advises
 * two or more sections, e.g. `fetchAdvisoryRoster(section.classId)`.
 */
export async function fetchAdvisoryRoster(classId?: string | number): Promise<AdvisoryRoster> {
  const url = classId != null ? `${BASE_URL}/roster?classId=${classId}` : `${BASE_URL}/roster`;

  const res = await fetch(url, {
    credentials: "include",
  });

  const data = await handleJsonResponse(res);

  return {
    gradeLevel: data.gradeLevel,
    sectionName: data.sectionName,
    students: data.students,
  };
}
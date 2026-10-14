import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformance`;

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

export interface SubjectGrade {
  subject: string;
  grade: number | null;
}

export interface Term {
  key: string;
  label: string;
  released: boolean;
  releaseDate?: string;
  average?: number;
  subjects: SubjectGrade[];
}

export async function fetchStudentTermPerformance(studentId: string, options?: ApiRequestOptions): Promise<Term[]> {
 const json = await handleJsonResponse(await parentFetch(`${BASE_URL}/students/${studentId}/term-performance`, options));
 return json.data;
}

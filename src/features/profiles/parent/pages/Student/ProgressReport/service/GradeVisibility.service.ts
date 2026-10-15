import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformanceProgress`;

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

/** Per-term visibility status as returned by the visibility endpoint. */
export interface TermVisibilityEntry {
  gradingPeriodId: number;
  termNumber: number;
  termLabel: string;
  submitted: boolean;
  isVisible: boolean;
  termEnded: boolean;
  /** Authoritative backend gate: advisory submission AND term end AND release. */
  available: boolean;
}

export async function fetchStudentGradeVisibility(studentId:string, options?:ApiRequestOptions):Promise<TermVisibilityEntry[]> {
 return (await handleJsonResponse(await parentFetch(`${BASE_URL}/${studentId}/visibility`,options))).data;
}

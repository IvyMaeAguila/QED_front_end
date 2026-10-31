import type { BufferedHttpReply } from '@shared/http/boundedFetch';
import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformanceProgress`;

async function handleJsonResponse(res: BufferedHttpReply) {
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
  /** Authoritative backend gate: term end AND adviser visibility release; submission is separate. */
  available: boolean;
}

export async function fetchStudentGradeVisibility(studentId:string, options?:ApiRequestOptions):Promise<TermVisibilityEntry[]> {
 const data=(await handleJsonResponse(await parentFetch(`${BASE_URL}/${studentId}/visibility`,options))).data;
 if(!Array.isArray(data)||data.some(entry=>typeof entry.available!=='boolean'))throw new Error('Could not verify report visibility.');
 return data;
}

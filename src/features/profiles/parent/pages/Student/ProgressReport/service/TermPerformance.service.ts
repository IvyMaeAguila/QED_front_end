import type { BufferedHttpReply } from '@shared/http/boundedFetch';
import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';
import type { BackendTerm } from "../utils/transformProgressReport";
import type { ProgressReportMeta } from "../types/types";

const BASE_URL = `${API_CONFIG.baseURL}/api/termPerformanceProgress`;

async function handleJsonResponse(res: BufferedHttpReply) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

/** Combined shape returned by the term-performance endpoint: per-term
 * grade data plus the learner/section/adviser/school-year header info. */
export interface StudentTermPerformanceResult {
  terms: BackendTerm[];
  meta: ProgressReportMeta;
}

const EMPTY_META: ProgressReportMeta = {
  learner: "",
  gradeSection: "",
  classAdviser: "",
  schoolYear: "",
};

export async function fetchStudentTermPerformance(studentId: string, options?: ApiRequestOptions): Promise<StudentTermPerformanceResult> {
 const json=await handleJsonResponse(await parentFetch(`${BASE_URL}/${studentId}/term-performance`,options));
 return {terms:json.data as BackendTerm[],meta:(json.meta as ProgressReportMeta)??EMPTY_META};
}

import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';
import type { WholeChildSnapshotData, HistoryEntry, SubjectHolisticSnapshot } from "../types/types";

export interface StudentWeeklyEvaluationResponse {
  current: WholeChildSnapshotData;
  history: HistoryEntry[];
  subjects: SubjectHolisticSnapshot[];
}

const API_BASE = `${API_CONFIG.baseURL}/api/weeklyHolisticEvaluation`;

export async function fetchStudentWeeklyEvaluation(studentId:string|number,termNumber:string|number,options?:ApiRequestOptions):Promise<StudentWeeklyEvaluationResponse> {
 const response=await parentFetch(`${API_BASE}/students/${studentId}?termNumber=${termNumber}`,options);const json=await response.json();
 if(!json.success)throw new Error(json.message??'Failed to fetch weekly evaluation.');return json.data;
}

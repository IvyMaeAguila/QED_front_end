import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/holisticPerformance`;

async function handleJsonResponse(res: Response) {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) throw new Error(`Unexpected server response (${res.status}): ${res.url}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed.");
  return data;
}

export type HolisticRiskLevel = "NONE" | "MEDIUM" | "HIGH";

export interface HolisticDomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

export interface HolisticTermAverage {
  termNumber: number;
  termLabel: string;
  isActive: boolean;
  /**
   * True for the active term's live evaluation and for terms whose end date
   * has passed. Future terms remain unavailable.
   */
  released: boolean;
  domainAverages: HolisticDomainAverages;
  evaluationCount: number;
  riskLevel: HolisticRiskLevel;
}

interface FetchHolisticTermAveragesOptions extends ApiRequestOptions {
  force?: boolean;
  /** Only fetch this one term instead of every term in the active school year. */
  termNumber?: number;
}

export async function fetchStudentHolisticTermAverages(studentId: string, options?: FetchHolisticTermAveragesOptions): Promise<HolisticTermAverage[]> {
 const params = new URLSearchParams(); if(options?.termNumber !== undefined) params.set('termNumber',String(options.termNumber));
 const json=await handleJsonResponse(await parentFetch(`${BASE_URL}/${studentId}${params.size?'?'+params:''}`,options));
 return json.data.map((term:HolisticTermAverage)=>({...term,isActive:Boolean(term.isActive)}));
}

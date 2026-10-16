import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
/**
 * Fetches a student's holistic domain averages, one entry per grading term,
 * from GET /holisticTermAverages/students/:studentId.
 *
 * Mirrors the conventions used by TermPerformance.service's
 * fetchStudentTermPerformance: cookie-based auth (credentials: "include"),
 * a tiny in-memory cache keyed by studentId, and a `force` option to bypass
 * that cache on explicit refetch().
 *
 * Adjust API_BASE below to match whatever base path fetchStudentTermPerformance
 * already uses in this project (this file guesses "/api" as a placeholder).
 */
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE = `${API_CONFIG.baseURL}/api/termHolisticProgress`;

export interface BackendHolisticDomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

export interface BackendHolisticTermAverage {
  termNumber: number;
  termLabel: string;
  domainAverages: BackendHolisticDomainAverages;
  evaluationCount: number;
  riskLevel: "HIGH" | "MEDIUM" | "NONE";
}

export async function fetchStudentHolisticTermAverages(studentId:string, options:ApiRequestOptions & {termNumber?:number}={}):Promise<BackendHolisticTermAverage[]> {
 const url=new URL(`${API_BASE}/${studentId}`,window.location.origin);if(options.termNumber!==undefined)url.searchParams.set('termNumber',String(options.termNumber));
 const response=await parentFetch(url.toString(),options);const body=await response.json();
 if(!body?.success)throw new Error(body?.message??'Failed to fetch holistic term averages.');return body.data??[];
}

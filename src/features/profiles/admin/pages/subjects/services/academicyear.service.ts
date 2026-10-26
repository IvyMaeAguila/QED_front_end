import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {QueryHttpError} from '@shared/http/QueryHttpError';
async function responseJson<T>(res:BufferedHttpReply,options:ApiRequestOptions):Promise<ApiResponse<T>>{if(res.status===401)options.onUnauthorized?.();return res.json().catch(error=>{if(!res.ok)throw new QueryHttpError('Academic year request failed.',res.status, undefined, {requestId: res.requestId});throw error;});}

const BASE_URL = `${API_CONFIG.baseURL}/api/academic-year`;

export type SchoolYearStatus = "Active" | "Inactive";
export type TermStatus = "Active" | "Upcoming" | "Completed";

export interface SchoolYearRow {
  id: number;
  school_year: string;
  is_active: number;
}

export interface AcademicYearRow {
  id: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
  status: SchoolYearStatus;
}

export interface TermRow {
  id: number;
  termNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
}

export interface TermInput {
  termNumber: number;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
  transition?: { promoted: number; retained: number; graduated: number; pending: number } | null;
}

export async function fetchAllSchoolYears(options:ApiRequestOptions={}): Promise<SchoolYearRow[]> {
  const res = await fetch(`${BASE_URL}/getAllSy`, { credentials: "include",signal:options.signal });
  const json=await responseJson<SchoolYearRow[]>(res,options);
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to fetch school years.",res.status, undefined, {requestId: res.requestId});
  return json.data ?? [];
}

export async function fetchActiveAcademicYear(options:ApiRequestOptions={}): Promise<AcademicYearRow> {
  const res = await fetch(`${BASE_URL}/getAcademicYear`, { credentials: "include",signal:options.signal });
  const json=await responseJson<AcademicYearRow>(res,options);
  if (!res.ok || !json.data) throw new QueryHttpError(json.message || "Failed to fetch academic year.",res.status, undefined, {requestId: res.requestId});
  return json.data;
}

export async function addAcademicYear(
  newYear: { label: string; status: SchoolYearStatus },
  options:ApiRequestOptions={},
): Promise<AcademicYearRow & { transition?: ApiResponse<AcademicYearRow>["transition"] }> {
  const res = await fetch(`${BASE_URL}/addAcademicYear`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newYear),
    signal:options.signal,
  });
  const json=await responseJson<AcademicYearRow>(res,options);
  if (!res.ok || !json.data) throw new QueryHttpError(json.message || "Failed to create academic year.",res.status, undefined, {requestId: res.requestId});
  return { ...json.data, transition: json.transition };
}

export async function fetchTerms(schoolYearId: number,options:ApiRequestOptions={}): Promise<TermRow[]> {
  const res = await fetch(`${BASE_URL}/getTerms/${schoolYearId}`, { credentials: "include",signal:options.signal });
  const json=await responseJson<TermRow[]>(res,options);
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to fetch terms.",res.status, undefined, {requestId: res.requestId});
  return json.data ?? [];
}

export async function saveTerms(
  schoolYearId: number,
  terms: TermInput[],
  options:ApiRequestOptions={},
): Promise<TermRow[]> {
  const res = await fetch(`${BASE_URL}/saveTerms/${schoolYearId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ terms }),
    signal:options.signal,
  });
  const json=await responseJson<TermRow[]>(res,options);
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to save terms.",res.status, undefined, {requestId: res.requestId});
  return json.data ?? [];
}

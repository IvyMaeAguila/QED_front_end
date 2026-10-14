import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/section`;

export interface GradeLevelRow {
  id: number;
  grade_level: string;
}

export interface SectionRow {
  id: number;
  grade_level_id: string;
  section_name: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
}

export async function fetchSectionsByGrade(gradeLevel: string, options:ApiRequestOptions={}): Promise<SectionRow[]> {
  const res = await fetch(`${BASE_URL}/getSections/${gradeLevel}`, {credentials: "include", signal:options.signal});
  if(res.status===401)options.onUnauthorized?.();
  const json: ApiResponse<SectionRow[]> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status);throw error;});
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to fetch sections.",res.status);
  return json.data ?? [];
}

export async function createSection(gradeLevel: string, sectionName: string, options:ApiRequestOptions={}): Promise<SectionRow> {
  const res = await fetch(`${BASE_URL}/addSection`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gradeLevel, sectionName }), signal:options.signal,
  });
  if(res.status===401)options.onUnauthorized?.();
  const json: ApiResponse<{ id: number; grade_level_id: string; section_name: string }> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status);throw error;});
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to add section.",res.status);
  return json.data as SectionRow;
}

export async function updateSection(id: string, sectionName: string, options:ApiRequestOptions={}): Promise<SectionRow> {
  const res = await fetch(`${BASE_URL}/updateSection/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionName }), signal:options.signal,
  });
  if(res.status===401)options.onUnauthorized?.();
  const json: ApiResponse<SectionRow> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status);throw error;});
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to update section.",res.status);
  return json.data as SectionRow;
}

export async function deleteSection(id: string, options:ApiRequestOptions={}): Promise<void> {
  const res = await fetch(`${BASE_URL}/deleteSection/${id}`, { method: "DELETE", credentials: "include", signal:options.signal });
  if(res.status===401)options.onUnauthorized?.();
  const json: ApiResponse<null> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status);throw error;});
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to delete section.",res.status);
}

export async function fetchSectionIdsUsedByClasses(options:ApiRequestOptions={}): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/sectionIdsUsedByClasses`, {credentials: "include", signal:options.signal});
  if(res.status===401)options.onUnauthorized?.();
  const json: ApiResponse<number[]> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status);throw error;});
  if (!res.ok) throw new QueryHttpError(json.message || "Failed to fetch used sections.",res.status);
  return json.data ?? [];
}
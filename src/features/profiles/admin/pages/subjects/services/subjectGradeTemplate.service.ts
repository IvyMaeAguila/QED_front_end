import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';
import type { GradeTemplateStructure } from "../../../../shared/grading/gradeTemplate.types";
const BASE_URL = `${API_CONFIG.baseURL}/api/subject`;

export interface ActiveGradeTemplate {
  id: number;
  subject_id: number;
  file_name: string;
  wwWeightPercent: number;
  ptWeightPercent: number;
  examWeightPercent: number;
  examSt1SubweightPercent: number;
  examSt2SubweightPercent: number;
  examTeSubweightPercent: number;
  uploadedAt: string;
  structure?: GradeTemplateStructure | null;
}

export async function uploadGradeTemplate(
  subjectId: number,
  file: File, options:ApiRequestOptions={}
): Promise<ActiveGradeTemplate> {
  const formData = new FormData();
  formData.append("template", file);

  const res = await fetch(`${BASE_URL}/uploadGradeTemplate/${subjectId}`, {
    method: "POST",
    credentials: "include", // required so the httpOnly auth cookie is sent
    body: formData, signal:options.signal,
  });
  if(res.status===401)options.onUnauthorized?.();

  const json = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status, undefined, {requestId: res.requestId});throw error;});
  if (!res.ok || !json.success) {
    throw new QueryHttpError(json.message ?? "Failed to upload grade template.",res.status, undefined, {requestId: res.requestId});
  }
  return { ...json.data, file_name: json.data.file_name ?? json.data.fileName };
}

export async function getActiveGradeTemplate(
  subjectId: number, options:ApiRequestOptions={}
): Promise<ActiveGradeTemplate | null> {
  const res = await fetch(`${BASE_URL}/getActiveGradeTemplate/${subjectId}`, {
    credentials: "include", signal:options.signal,
  });
  if(res.status===401)options.onUnauthorized?.();
  const json = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Request failed.",res.status, undefined, {requestId: res.requestId});throw error;});
  if (!res.ok || !json.success) {
    throw new QueryHttpError(json.message ?? "Failed to load grade template.",res.status, undefined, {requestId: res.requestId});
  }
  return json.data;
}

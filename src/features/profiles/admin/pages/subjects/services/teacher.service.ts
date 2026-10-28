import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import type {TeacherRequestOptions} from '../../../../teacher/query/teacherQueryScope';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/section`;

export interface TeacherRow {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email_address: string;
  contact_number: string;
  gender?: string | null;
  avatar_key?: string | null;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message: string;
  data?: T;
}

export async function fetchTeachers(options:TeacherRequestOptions={}): Promise<TeacherRow[]> {
  const res = await fetch(`${BASE_URL}/getTeachers`, { credentials: "include",signal:options.signal });
  if(res.status===401)options.onUnauthorized?.();

  const json: ApiResponse<TeacherRow[]> = await res.json().catch(error=>{if(!res.ok)throw new QueryHttpError("Failed to fetch teachers.",res.status, undefined, {requestId: res.requestId});throw error;});

  if (!res.ok) {
    throw new QueryHttpError(json.message || "Failed to fetch teachers.",res.status, undefined, {requestId: res.requestId});
  }

  return json.data ?? [];
}

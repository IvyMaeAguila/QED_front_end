import { API_CONFIG } from '../../../../../../config/api.config';
import type { Term, RankedSubject, HeatmapRow, ViewMode } from "../data/types";
import { QueryHttpError } from "@shared/http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api`;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AnalyticsRequestOptions {
  signal?: AbortSignal;
  onUnauthorized?: () => void;
}

async function request(path: string, options: AnalyticsRequestOptions) {
  await Promise.resolve();
  options.signal?.throwIfAborted();
  const response = await fetch(`${BASE_URL}${path}`, { method: "GET", credentials: "include", signal: options.signal });
  // Check every endpoint independently; a sibling failure cannot mask a 401.
  if (response.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
  return response;
}
export async function getTermOptions(options: AnalyticsRequestOptions = {}): Promise<Term[]> {
  const res = await request(`/reports/term-options`, options);

  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch term options (${res.status})`, res.status);
  }
  const json: ApiResponse<Term[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch term options");
  }
  return json.data;
}

export async function getGradeOptions(options: AnalyticsRequestOptions = {}): Promise<string[]> {
  const res = await request(`/reports/grade-options`, options);
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch grade options (${res.status})`, res.status);
  }
  const json: ApiResponse<string[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch grade options");
  }
  return json.data;
}

export async function getViewOptions(options: AnalyticsRequestOptions = {}): Promise<ViewMode[]> {
  const res = await request(`/reports/view-options`, options);

  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch view options (${res.status})`, res.status);
  }

  const json: ApiResponse<ViewMode[]> = await res.json();

  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch view options");
  }

  return json.data;
}

export async function getSubjectRanking(term: Term, options: AnalyticsRequestOptions = {}): Promise<RankedSubject[]> {
  const res = await request(`/reports/subject-ranking?term=${encodeURIComponent(term)}`, options);
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch subject ranking (${res.status})`, res.status);
  }
  const json: ApiResponse<RankedSubject[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch subject ranking");
  }
  return json.data;
}

export async function getHolisticRows(term: Term, view: ViewMode, options: AnalyticsRequestOptions = {}): Promise<HeatmapRow[]> {
  const res = await request(`/reports/holistic?term=${encodeURIComponent(term)}&view=${encodeURIComponent(view)}`, options);
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch holistic rows (${res.status})`, res.status);
  }
  const json: ApiResponse<HeatmapRow[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch holistic rows");
  }
  return json.data;
}

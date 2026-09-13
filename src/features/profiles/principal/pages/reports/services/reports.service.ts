import { API_CONFIG } from '../../../../../../config/api.config';
import type { Term, RankedSubject, HeatmapRow, ViewMode } from "../data/types";
import {  VIEW_OPTIONS, GRADE_ROWS, SUBJECT_ROWS } from "../data/mockData";

const BASE_URL = `${API_CONFIG.baseURL}/api`;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getTermOptions(): Promise<Term[]> {
  const res = await fetch(`${BASE_URL}/reports/term-options`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch term options (${res.status})`);
  }
  const json: ApiResponse<Term[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch term options");
  }
  return json.data;
}

export async function getGradeOptions(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/reports/grade-options`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch grade options (${res.status})`);
  }
  const json: ApiResponse<string[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch grade options");
  }
  return json.data;
}

export async function getViewOptions(): Promise<ViewMode[]> {
  const res = await fetch(`${BASE_URL}/reports/view-options`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch view options (${res.status})`);
  }

  const json: ApiResponse<ViewMode[]> = await res.json();

  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch view options");
  }

  return json.data;
}

export async function getSubjectRanking(term: Term): Promise<RankedSubject[]> {
  const res = await fetch(
    `${BASE_URL}/reports/subject-ranking?term=${encodeURIComponent(term)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch subject ranking (${res.status})`);
  }
  const json: ApiResponse<RankedSubject[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch subject ranking");
  }
  return json.data;
}

export async function getHolisticRows(term: Term, view: ViewMode): Promise<HeatmapRow[]> {
  const res = await fetch(
    `${BASE_URL}/reports/holistic?term=${encodeURIComponent(term)}&view=${encodeURIComponent(view)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch holistic rows (${res.status})`);
  }
  const json: ApiResponse<HeatmapRow[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch holistic rows");
  }
  return json.data;
}
// features/profiles/teacher/.../services/subjectGradeTemplate.service.ts

import { API_CONFIG } from '../../../../../../config/api.config';
import type { GradeTemplateStructure, TemplateExaminations } from "../../../../shared/grading/gradeTemplate.types";

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
}

function authedFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export async function getActiveGradeTemplateSafe(
  subjectId: number
): Promise<ActiveGradeTemplate | undefined> {
  try {
    const res = await authedFetch(`${BASE_URL}/getActiveGradeTemplateBySection/${subjectId}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return undefined;

    const json = await res.json();
    if (!res.ok || !json.success) return undefined;
    return json.data ?? undefined;
  } catch (err) {
    console.error("Failed to load active grade template:", err);
    return undefined;
  }
}

// --- the snippet you just pasted goes here, in the same file ---

export interface EffectiveWeights {
  source: "template" | "manual";
  ww: number;
  pt: number;
  exam: number;
  examSubWeights?: { st1: number; st2: number; te: number };
  examinations?: TemplateExaminations;
  templateStructure?: GradeTemplateStructure;
  templateId?: number;
  templateChecksum?: string | null;
}

export async function getEffectiveWeightsSafe(
  subjectSectionId: number,
  gradingPeriodId?: string,
): Promise<EffectiveWeights | undefined> {
  try {
    const periodQuery = gradingPeriodId ? `?gradingPeriodId=${encodeURIComponent(gradingPeriodId)}` : "";
    const res = await authedFetch(`${BASE_URL}/getEffectiveWeights/${subjectSectionId}${periodQuery}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return undefined;

    const json = await res.json();
    if (!res.ok || !json.success) return undefined;
    return json.data ?? undefined;
  } catch (err) {
    console.error("Failed to load effective weights:", err);
    return undefined;
  }
}

export async function downloadActiveGradeTemplate(subjectSectionId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/downloadActiveGradeTemplateBySection/${subjectSectionId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    let message = "Could not download the active grade template.";
    try { const json = await res.json(); message = json.message ?? message; } catch { /* keep fallback */ }
    throw new Error(message);
  }
  return res.arrayBuffer();
}

export async function downloadGradeRecordExport(subjectSectionId: string, gradingPeriodId: string): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const res = await fetch(
    `${BASE_URL}/exportGradeTemplateBySection/${subjectSectionId}?gradingPeriodId=${encodeURIComponent(gradingPeriodId)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    let message = "Could not create the official grade record export.";
    try { const json = await res.json(); message = json.message ?? message; } catch { /* keep fallback */ }
    throw new Error(message);
  }
  if (!(res.headers.get("content-type") ?? "").includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
    throw new Error("The server did not return an Excel workbook. Please try again or contact the administrator.");
  }
  const disposition = res.headers.get("content-disposition") ?? "";
  const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? `QED-TERM-${gradingPeriodId}.xlsx`;
  return { buffer: await res.arrayBuffer(), fileName };
}

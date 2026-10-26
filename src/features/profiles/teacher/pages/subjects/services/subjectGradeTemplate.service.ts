import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import type {TeacherRequestOptions} from '../../../query/teacherQueryScope';
import {QueryHttpError} from '@shared/http/QueryHttpError';
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
  request:TeacherRequestOptions={},
): Promise<EffectiveWeights | null> {
  const controller = new AbortController();
  const cancel = () => controller.abort(request.signal?.reason);
  if (request.signal?.aborted) cancel();
  else request.signal?.addEventListener('abort', cancel, { once: true });
  // Match session verification's bounded read. This retries no operation.
  const timeout = window.setTimeout(() => controller.abort(new DOMException('Grading-rule verification timed out.', 'TimeoutError')), 15_000);
  try {
    const periodQuery = gradingPeriodId ? `?gradingPeriodId=${encodeURIComponent(gradingPeriodId)}` : "";
    const res = await authedFetch(`${BASE_URL}/getEffectiveWeights/${subjectSectionId}${periodQuery}`,{signal:controller.signal});
    if(res.status===401)request.onUnauthorized?.();
    if(!res.ok)throw new QueryHttpError("Could not load grading rules.",res.status, undefined, {requestId: res.requestId});
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) throw new Error('The server did not return valid grading rules.');

    const json = await res.json();
    if (json?.success !== true) throw new Error('Could not load grading rules.');
    // Only an explicit successful null means no configured template/manual rules.
    if (json.data === null) return null;
    const rules = json.data;
    if (!rules || !['template', 'manual'].includes(rules.source)
      || ![rules.ww, rules.pt, rules.exam].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100)) {
      throw new Error('The server did not return valid grading rules.');
    }
    return rules;
  } finally {
    window.clearTimeout(timeout);
    request.signal?.removeEventListener('abort', cancel);
  }
}

export async function downloadActiveGradeTemplate(subjectSectionId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/downloadActiveGradeTemplateBySection/${subjectSectionId}`, {
    credentials: "include", operation: "export",
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
    { credentials: "include", operation: "export" },
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

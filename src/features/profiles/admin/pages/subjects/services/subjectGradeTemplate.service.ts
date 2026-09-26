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
  file: File
): Promise<ActiveGradeTemplate> {
  const formData = new FormData();
  formData.append("template", file);

  const res = await fetch(`${BASE_URL}/uploadGradeTemplate/${subjectId}`, {
    method: "POST",
    credentials: "include", // required so the httpOnly auth cookie is sent
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Failed to upload grade template.");
  }
  return json.data;
}

export async function getActiveGradeTemplate(
  subjectId: number
): Promise<ActiveGradeTemplate | null> {
  const res = await fetch(`${BASE_URL}/getActiveGradeTemplate/${subjectId}`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Failed to load grade template.");
  }
  return json.data;
}

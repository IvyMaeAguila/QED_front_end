import { API_CONFIG } from '../../../../../../config/api.config';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { QueryHttpError } from '@shared/http/QueryHttpError';

export interface AssignmentStudent {
  id: number; student_number: string; first_name: string; last_name: string; middle_name: string | null;
  gender: string; grade_level_id: number; grade_level: string; section_id: number | null;
  section_name: string | null; assignment_status: 'Assigned' | 'Unassigned' | 'Needs review';
}
export interface AssignmentData {
  schoolYear: { id: number; label: string };
  grades: { id: number; grade_level: string }[];
  sections: { id: number; section_name: string; grade_level_id: number; class_id: number }[];
  students: AssignmentStudent[];
  counts: { assigned: number; unassigned: number; needsReview: number };
}
export interface AssignmentInput { schoolYearId: number; gradeLevelId: number; sectionId: number; studentIds: number[] }
export interface AssignmentResult {
  assignedCount: number; schoolYear: { id: number; label: string };
  gradeLevel: { id: number; label: string }; section: { id: number; label: string };
}
async function request<T>(path: string, options: ApiRequestOptions, body?: AssignmentInput): Promise<T> {
  const response = await fetch(`${API_CONFIG.baseURL}/api/student/${path}`, {
    credentials: 'include', signal: options.signal, method: body ? 'POST' : 'GET',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) options.onUnauthorized?.();
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.data) throw new QueryHttpError(json.message || 'Unable to load section assignments.', response.status);
  return json.data as T;
}
export const fetchSectionAssignments = (options: ApiRequestOptions = {}) => request<AssignmentData>('section-assignments', options);
export const assignSections = (input: AssignmentInput, options: ApiRequestOptions = {}) => request<AssignmentResult>('bulk-section-assignment', options, input);

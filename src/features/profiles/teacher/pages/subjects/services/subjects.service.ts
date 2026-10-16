import { API_CONFIG } from '../../../../../../config/api.config';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import type { TeacherRequestOptions } from '../../../query/teacherQueryScope';

const BASE_URL = `${API_CONFIG.baseURL}/api/mySubjects`;

export interface AssignedSubjectRow {
  subject_section_id: number;
  subject_id: number;
  subject_code: string | null;
  subject_name: string;
  grade_level_id: number;
  grade_level: string;
  section_id: number;
  section_name: string;
}

export interface AssignedSubject {
  subjectSectionId: number;
  subjectId: number;
  subjectCode: string | null;
  subjectName: string;
  gradeLevelId: number;
  gradeLevel: string;
  sectionId: number;
  sectionName: string;
}

function mapAssignedSubjectRow(row: AssignedSubjectRow): AssignedSubject {
  return {
    subjectSectionId: row.subject_section_id,
    subjectId: row.subject_id,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    gradeLevelId: row.grade_level_id,
    gradeLevel: row.grade_level,
    sectionId: row.section_id,
    sectionName: row.section_name,
  };
}

export const assignedSubjectsService = {
  async getAssignedSubjects(options?: TeacherRequestOptions): Promise<AssignedSubject[]> {
    const response = await fetch(`${BASE_URL}/subjects`, {
      method: "GET",
      credentials: "include",
      signal: options?.signal,
    });

    if (response.status === 401) {
      if (!options?.signal?.aborted) options?.onUnauthorized?.();
      throw new QueryHttpError("Unauthorized: kailangan mag-login muna.", 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new QueryHttpError(errorData.message || "Failed to fetch assigned subjects", response.status);
    }

    const json = await response.json();
    const rows: AssignedSubjectRow[] = json.data ?? [];
    return rows.map(mapAssignedSubjectRow);
  },
};

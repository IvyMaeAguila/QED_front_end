import { API_CONFIG } from '../../../../../../config/api.config';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import type { TeacherRequestOptions } from '../../../query/teacherQueryScope';

const BASE_URL = `${API_CONFIG.baseURL}/api/mySubjects`;

export interface SubjectClassListStudentRow {
  student_id: number;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: "Male" | "Female";
}

export interface SubjectClassListRow {
  subject_name: string;
  grade_level: string;
  section_name: string;
  students: SubjectClassListStudentRow[];
}

export interface SubjectClassListStudent {
  studentId: number;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "Male" | "Female";
}

export interface SubjectClassList {
  subjectName: string;
  gradeLevel: string;
  sectionName: string;
  students: SubjectClassListStudent[];
}

function mapStudentRow(row: SubjectClassListStudentRow): SubjectClassListStudent {
  return {
    studentId: row.student_id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    gender: row.gender,
  };
}

export const subjectClassListService = {
  // Assumes a REST pattern consistent with /mySubjects/subjects — adjust
  // the path below if your backend route differs.
  async getClassList(subjectSectionId: number, options?: TeacherRequestOptions): Promise<SubjectClassList> {
    const response = await fetch(`${BASE_URL}/subjects/${subjectSectionId}/students`, {
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
      throw new QueryHttpError(errorData.message || "Failed to fetch class list", response.status);
    }

    const json = await response.json();
    const data: SubjectClassListRow = json.data ?? {};

    return {
      subjectName: data.subject_name ?? "",
      gradeLevel: data.grade_level ?? "",
      sectionName: data.section_name ?? "",
      students: (data.students ?? []).map(mapStudentRow),
    };
  },
};

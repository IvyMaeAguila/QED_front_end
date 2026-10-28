import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';
import type { Student } from "../types/Students";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';

interface StudentRequestOptions { signal?: AbortSignal; onUnauthorized?: () => void }

const BASE_URL = `${API_CONFIG.baseURL}/api/student`;

export interface GradeLevelResponse {
  id: number;
  grade_level: string;
  is_deleted?: number;
}

interface StudentRow {
  id: number;
  grade_level_id: number;
  section_id: number | null;
  current_school_year_id: number;
  student_number: string;
  learner_reference_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: string;
  grade_level_name: string;  
  section_name: string | null;
  joined_date?: string | null;
  enrollment_status?: string;
  dropout_effective_date?: string | null;
  parent_guardian_name?: string | null;
  guardian_first_name?: string | null;
  guardian_middle_name?: string | null;
  guardian_last_name?: string | null;
  guardian_contact_number?: string | null;
  is_deleted?: number;
}

function mapStudentRow(row: StudentRow): Student {
  return {
    joinedDate: row.joined_date ?? undefined,
    enrollmentStatus: row.enrollment_status,
    dropoutEffectiveDate: row.dropout_effective_date ?? undefined,
    guardianName: [row.guardian_first_name, row.guardian_middle_name, row.guardian_last_name].map(part => part?.trim()).filter(Boolean).join(' ') || row.parent_guardian_name?.trim() || undefined,
    guardianContact: row.guardian_contact_number?.trim() || undefined,
    dbId: row.id,
    id: String(row.id),
    gradeLevelId: row.grade_level_id,
    sectionId: row.section_id,
    schoolYearId: row.current_school_year_id,
    studentId: row.student_number,
    lrn: row.learner_reference_number,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    gender: row.gender as Student["gender"],
    gradeLevel: row.grade_level_name as Student["gradeLevel"],
    section: row.section_name ?? null, 
  };
}

export const studentService = {

  async addNewStudent(payload: any, options:ApiRequestOptions={}) {
    const response = await fetch(`${BASE_URL}/addNewStudent`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal:options.signal,
    });
    if(response.status===401)options.onUnauthorized?.();
    if (!response.ok) {
      const errorData = await response.json().catch(()=>({}));
      throw new QueryHttpError(errorData.message || "Failed to add new student",response.status, undefined, {requestId: response.requestId});
    }
    return response.json();
  },

  async getAllStudents(options: StudentRequestOptions = {}): Promise<Student[]> {
    const response = await fetch(`${BASE_URL}/allStudents`, {
      method: "GET",
      credentials: "include",
      signal: options.signal,
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) options.onUnauthorized?.();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new QueryHttpError(errorData.message || "Failed to fetch students", response.status, undefined, {requestId: response.requestId});
    }

    const json = await response.json();
    const rows: StudentRow[] = json.data ?? [];
    return rows.map(mapStudentRow);
  },

  //-- UPDATE --
  async updateStudent(id: number, payload: any, options:ApiRequestOptions={}) {
    const response = await fetch(`${BASE_URL}/updateStudent/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal:options.signal,
    });
    if(response.status===401)options.onUnauthorized?.();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new QueryHttpError(errorData.message || "Failed to update student",response.status, undefined, {requestId: response.requestId});
    }
    return response.json();
  },


  //delete (sot)
  async softDeleteStudent(id: number, options:ApiRequestOptions={}) {
    const response = await fetch(`${BASE_URL}/deleteStudent/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal:options.signal,
    });
    if(response.status===401)options.onUnauthorized?.();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new QueryHttpError(errorData.message || "Failed to delete student",response.status, undefined, {requestId: response.requestId});
    }
    return response.json();
  },


};


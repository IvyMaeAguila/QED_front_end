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
  student_number: string;
  learner_reference_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: string;
  grade_level_name: string;  
  section_name: string | null;
  is_deleted?: number;
}

function mapStudentRow(row: StudentRow): Student {
  return {
    dbId: row.id,
    id: String(row.id),
    gradeLevelId: row.grade_level_id,
    sectionId: row.section_id,
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
      throw new QueryHttpError(errorData.message || "Failed to add new student",response.status);
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
      throw new QueryHttpError(errorData.message || "Failed to fetch students", response.status);
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
      throw new QueryHttpError(errorData.message || "Failed to update student",response.status);
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
      throw new QueryHttpError(errorData.message || "Failed to delete student",response.status);
    }
    return response.json();
  },


};


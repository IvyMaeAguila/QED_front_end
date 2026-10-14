import { QueryHttpError } from '@shared/http/QueryHttpError';
import { parentFetch } from '../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import type { PerformanceStatus, Student } from "../../dashboard/types/student";
import { API_CONFIG } from '../../../../../../config/api.config';

const LINKEDCHILDREN_API = `${API_CONFIG.baseURL}/api/linkedChildren`;

export interface StudentVerifyRequest {
    studentNumber: string;
    lastName: string;
    firstName: string;
}

export interface StudentData {
    id: number;
    student_number: string;
    last_name: string;
    first_name: string;
    gender?: string | null;
    grade_level: string;
    // Nagiging null ang mga ito kapag hindi pa naka-assign ang student
    // sa isang section/adviser.
    section_name: string | null;
    adviser_name: string | null;
    // Kasama na lang ito ng getEnrolledChildren response — hindi babalik
    // sa getChildren/verifyStudent (bago pa naman ma-link, wala pang
    // performance data ang isang student).
    overall_score?: number | null;
    performance_status?: PerformanceStatus | null;
}

export interface StudentVerifyResponse {
    success: boolean;
    message: string;
    student?: Student;
}

export interface LinkConfirmResponse {
    success: boolean;
    message: string;
    student?: Student;
}

export interface EnrolledChildrenResponse {
    success: boolean;
    message: string;
    students: Student[];
}

function mapStudentRow(row: StudentData): Student {
    return {
        id: String(row.id),
        studentNumber: row.student_number,
        lastName: row.last_name,
        firstName: row.first_name,
        fullName: `${row.first_name} ${row.last_name}`.trim(),
        gender: row.gender ?? undefined,
        gradeLevel: row.grade_level,
        section: row.section_name ?? "",
        adviser: row.adviser_name ?? "",
        attendanceRate: null,
        attendanceStatus: "pending",
        overallScore: row.overall_score ?? null,
        performanceStatus: row.performance_status ?? "pending",
        linked: true,
    };
}

export const verificationService = {
    verifyStudent: async (data: StudentVerifyRequest, options?: ApiRequestOptions): Promise<StudentVerifyResponse> => {
        try {
            const response = await fetch(`${LINKEDCHILDREN_API}/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result: { success: boolean; message: string; student?: StudentData } =
                await response.json();
            if(response.status===401 && result.message!=='No information matched') options?.onUnauthorized?.();
            if([401,403].includes(response.status) && result.message!=='No information matched') throw new QueryHttpError(result.message,response.status);

            return {
                success: result.success,
                message: result.message,
                student: result.student ? mapStudentRow(result.student) : undefined,
            };
        } catch (error) {
            if(options) throw error;
            return {
                success: false,
                message: "Can't connect to server, try again.",
            };
        }
    },

    confirmLink: async (data: StudentVerifyRequest, options?: ApiRequestOptions): Promise<LinkConfirmResponse> => {
        try {
            const response = await fetch(`${LINKEDCHILDREN_API}/confirm`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data), // { studentNumber, lastName, firstName }
            });

            const result: { success: boolean; message: string; student?: StudentData } =
                await response.json();
            if(response.status===401 && result.message!=='No information matched') options?.onUnauthorized?.();
            if([401,403].includes(response.status) && result.message!=='No information matched') throw new QueryHttpError(result.message,response.status);

            return {
                success: result.success,
                message: result.message,
                student: result.student ? mapStudentRow(result.student) : undefined,
            };
        } catch (error) {
            if(options) throw error;
            return {
                success: false,
                message: "Can't connect to server, try again.",
            };
        }
    },
};

export const enrolledChildrenService = {
    getEnrolledChildren: async (options?: ApiRequestOptions): Promise<EnrolledChildrenResponse> => {
        try {
            const response = await parentFetch(`${LINKEDCHILDREN_API}/`, options, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result: { success: boolean; message: string; students?: StudentData[] } =
                await response.json();

            return {
                success: result.success,
                message: result.message,
                students: result.students ? result.students.map(mapStudentRow) : [],
            };
        } catch (error) {
            if(options) throw error;
            return {
                success: false,
                message: "Can't connect to server, try again.",
                students: [],
            };
        }
    },
};
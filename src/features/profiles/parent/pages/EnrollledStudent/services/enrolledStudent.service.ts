import type { Student } from "../../dashboard/types/student";
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
    grade_level: string;
    section_name: string;
    adviser_name: string;
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
        gradeLevel: row.grade_level,
        section: row.section_name,
        adviser: row.adviser_name,
        attendanceRate: null,
        attendanceStatus: "pending",
        linked: true,
    };
}

export const verificationService = {
    verifyStudent: async (data: StudentVerifyRequest): Promise<StudentVerifyResponse> => {
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

            return {
                success: result.success,
                message: result.message,
                student: result.student ? mapStudentRow(result.student) : undefined,
            };
        } catch (error) {
            return {
                success: false,
                message: "Can't connect to server, try again.",
            };
        }
    },

    confirmLink: async (data: StudentVerifyRequest): Promise<LinkConfirmResponse> => {
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

        return {
            success: result.success,
            message: result.message,
            student: result.student ? mapStudentRow(result.student) : undefined,
        };
    } catch (error) {
        return {
            success: false,
            message: "Can't connect to server, try again.",
        };
    }
},
};

export const enrolledChildrenService = {
    getEnrolledChildren: async (): Promise<EnrolledChildrenResponse> => {
        try {
            const response = await fetch(`${LINKEDCHILDREN_API}/`, {
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
            return {
                success: false,
                message: "Can't connect to server, try again.",
                students: [],
            };
        }
    },
};
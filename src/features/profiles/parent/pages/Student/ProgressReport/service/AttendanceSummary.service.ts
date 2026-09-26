import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE = `${API_CONFIG.baseURL}/api/attendanceSummary`;

// ---------- Types ----------

export interface ChildSummary {
  id: number;
  student_number: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  grade_level: string | null;
  section_name: string | null;
}

export interface MonthlyAttendance {
  monthKey: string;   // e.g. "2026-08"
  monthLabel: string; // e.g. "August 2026"
  present: number;
  absent: number;
  tardiness: number;
  excused: number;
  totalDays: number;
}

export interface GradingPeriodAttendance {
  gradingPeriodId: number;
  termNumber: number;
  termLabel: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  months: MonthlyAttendance[];
  totals: {
    present: number;
    absent: number;
    tardiness: number;
    excused: number;
    totalDays: number;
  };
}

export interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gradeLevel: string | null;
  section: string | null;
}

export interface AttendanceSummaryResponse {
  student: StudentInfo;
  gradingPeriods: GradingPeriodAttendance[];
}

interface MyChildrenResponse {
  children: ChildSummary[];
}

// ---------- Helper ----------

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { message?: string })?.message || "Something went wrong.";
    throw new Error(message);
  }

  return data as T;
}

// ---------- Service ----------

const AttendanceService = {
  async getMyChildren(): Promise<ChildSummary[]> {
    const res = await fetch(`${API_BASE}/my-children`, {
      method: "GET",
      credentials: "include",
    });

    const data = await handleResponse<MyChildrenResponse>(res);
    return data.children;
  },

  /**
   * Kunin ang attendance summary (per grading period, per month)
   * ng isang partikular na anak.
   */
  async getAttendanceSummary(studentId: number): Promise<AttendanceSummaryResponse> {
    const res = await fetch(`${API_BASE}/summary/${studentId}`, {
      method: "GET",
      credentials: "include",
    });

    return handleResponse<AttendanceSummaryResponse>(res);
  },
};

export default AttendanceService;
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE_URL = `${API_CONFIG.baseURL}`;

export interface MonthlyAttendanceResponseRaw {
  success: boolean;
  message?: string;
  data?: {
    student: {
      id: number;
      student_number: string;
      full_name: string;
      grade_level_id: number;
      section_id: number;
    };
    month: number;
    year: number;
    school_days: number;
    status_summary: {
      present: number;
      absent: number;
      late: number;
      excused: number;
    };
    total_records: number;
  };
}

export interface MonthlyAttendance {
  student: {
    id: number;
    studentNumber: string;
    fullName: string;
    gradeLevelId: number;
    sectionId: number;
  };
  month: number;
  year: number;
  schoolDays: number;
  statusSummary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  totalRecords: number;
}

function mapToMonthlyAttendance(
  raw: NonNullable<MonthlyAttendanceResponseRaw["data"]>
): MonthlyAttendance {
  return {
    student: {
      id: raw.student.id,
      studentNumber: raw.student.student_number,
      fullName: raw.student.full_name,
      gradeLevelId: raw.student.grade_level_id,
      sectionId: raw.student.section_id,
    },
    month: raw.month,
    year: raw.year,
    schoolDays: raw.school_days,
    statusSummary: {
      present: raw.status_summary.present,
      absent: raw.status_summary.absent,
      late: raw.status_summary.late,
      excused: raw.status_summary.excused,
    },
    totalRecords: raw.total_records,
  };
}

function buildCacheKey(studentId: number, month: number, year: number): string {
  return `${studentId}-${month}-${year}`;
}

const cache = new Map<string, MonthlyAttendance>();
const inFlightRequests = new Map<string, Promise<MonthlyAttendance>>();

const AttendanceService = {
  async getMonthlyAttendance(
    studentId: number,
    month: number,
    year: number
  ): Promise<MonthlyAttendance> {
    const cacheKey = buildCacheKey(studentId, month, year);

    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request = (async () => {
      const params = new URLSearchParams({
        student_id: String(studentId),
        month: String(month),
        year: String(year),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/attendance?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result: MonthlyAttendanceResponseRaw = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch monthly attendance.");
      }

      const mapped = mapToMonthlyAttendance(result.data);
      cache.set(cacheKey, mapped);
      return mapped;
    })();

    inFlightRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  },

  clearCache(studentId?: number, month?: number, year?: number) {
    if (studentId !== undefined && month !== undefined && year !== undefined) {
      cache.delete(buildCacheKey(studentId, month, year));
    } else {
      cache.clear();
    }
  },
};

export default AttendanceService;
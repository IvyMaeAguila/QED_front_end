import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
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

const AttendanceService={
 async getMonthlyAttendance(studentId:number,month:number,year:number,options?:ApiRequestOptions):Promise<MonthlyAttendance>{
 const params=new URLSearchParams({student_id:String(studentId),month:String(month),year:String(year)});
 const response=await parentFetch(`${API_BASE_URL}/api/attendance?${params}`,options);
 const result:MonthlyAttendanceResponseRaw=await response.json();
 if(!result.success||!result.data)throw new Error(result.message||'Failed to fetch monthly attendance.');return mapToMonthlyAttendance(result.data);
 }};export default AttendanceService;

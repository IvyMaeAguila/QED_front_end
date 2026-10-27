import { boundedFetch } from '@shared/http/boundedFetch';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import { API_CONFIG } from '../../../../../../config/api.config';
import type { TeacherRequestOptions } from '../../../query/teacherQueryScope';

export interface MonthlyAttendanceReport {
  classId: string; schoolYearId: string; schoolYearLabel: string; gradeSection: string; month: string; months: string[];
  annualEnrollment?: { male:number; female:number; total:number };
  transferIns?: {studentId:string;name:string;joinedDate:string}[];
  dropouts?: {studentId:string;name:string;effectiveDate:string}[];
  enrollment: { male: number; female: number; total: number }; rosterCount: number;
  unknownGender: { id: string; name: string }[];
  days: { date: string; malePresent: number; femalePresent: number; maleAbsent: number; femaleAbsent: number; unmarked: number; enrollment?:{male:number;female:number;total:number} }[];
  numberOfDays: number; sums: { male: number; female: number };
  ada: { male: number; female: number; total: number } | null;
  adviserName: string; principalName: string; principalDesignation: string; principalSource: 'system' | 'manual';
}
export interface ReportSignatories { adviserName: string; adviserDesignation: string; principalName: string; principalDesignation: string }
export async function fetchMonthlyAttendanceReport(classId: string, schoolYearId: string, month: string, options: TeacherRequestOptions = {}): Promise<MonthlyAttendanceReport> {
  const params = new URLSearchParams({ schoolYearId, month });
  const res = await boundedFetch(API_CONFIG.baseURL + '/api/teacherAttendance/' + encodeURIComponent(classId) + '/monthly-report?' + params, { credentials: 'include', signal: options.signal });
  if (res.status === 401) options.onUnauthorized?.();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new QueryHttpError(body?.message || 'Unable to load the monthly report.', res.status, undefined, { requestId: res.requestId });
  }
  const result = await res.json();
  return result.data;
}

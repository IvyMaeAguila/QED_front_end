export type AttendanceStatus = "present" | "absent" | "late" | "pending";

export type PerformanceStatus =
  | "excellent"
  | "good"
  | "fair"
  | "needsImprovement"
  | "pending";

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  fullName?: string;
  gradeLevel: string; 
  section: string; 
  adviser: string;
  avatarUrl?: string;
  attendanceRate?: number | null; 
  attendanceStatus?: AttendanceStatus;
  overallScore?: number | null; 
  performanceStatus?: PerformanceStatus;
  linked?: boolean; 
}

export interface DailyUpdate {
  id: string;
  studentId: string;
  studentName: string;
  time: string; 
  message: string;
}

export interface SchoolEvent {
  id: string;
  day: number;
  month: string;
  title: string;
  holidayType: string;
  type: "activity" | "holiday";
}

export interface LinkStudentInput {
  idNumber: string;
  lastName: string;
  firstName: string;
}

export interface MatchedStudentRecord {
  id: number;          
  idNumber: string;
  lastName: string; 
  firstName: string;     
  fullName: string;
  gradeLevel: string;
  section: string;
  adviser: string;
}

export type CardViewMode = "grid" | "list";
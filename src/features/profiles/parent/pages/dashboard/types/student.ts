// Core domain types for the Parent role of QED.
// Kept separate from the admin/teacher/principal types so each role's
// contracts can evolve independently once the backend is wired in.

export type AttendanceStatus = "present" | "absent" | "late" | "pending";

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  fullName?: string;
  gradeLevel: string; // e.g. "Grade 2"
  section: string; // e.g. "Rizal"
  adviser: string;
  avatarUrl?: string;
  attendanceRate?: number | null; // null = no data yet (pending status)
  attendanceStatus?: AttendanceStatus;
  linked?: boolean; // false while awaiting parent verification
}

export interface DailyUpdate {
  id: string;
  studentId: string;
  studentName: string;
  time: string; // display value, e.g. "7:30 am"
  message: string;
}

export interface SchoolEvent {
  id: string;
  day: number;
  month: string; // short label, e.g. "AUG"
  title: string;
  holidayType: string;
  type: "activity" | "holiday";
}

// Payload the "Link Student" form collects before it is matched
// against school records.
export interface LinkStudentInput {
  idNumber: string;
  lastName: string;
  firstName: string;
}

// What comes back once the ID number matches a record on file.
// This is what the parent is asked to verify in the confirmation modal.
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

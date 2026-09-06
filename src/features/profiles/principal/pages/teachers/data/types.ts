// src/features/profiles/principal/pages/teachers/data/types.ts

export interface TeacherSummary {
  teacherId: string;
  fullName: string;
  advisorySection: string; // e.g. "Section A"
  gradeLevel: string; // e.g. "Grade 1"
  room: string;
}

export interface ScheduleEntry {
  day: string;
  time: string;
  subject: string;
  gradeSection: string;
  room: string;
}

// The detail view needs everything a summary row has, plus the schedule —
// kept as a strict extension so a TeacherProfile can always be displayed
// anywhere a TeacherSummary is expected (e.g. reusing TeacherSummaryStats).
export interface TeacherProfile extends TeacherSummary {
  schedule: ScheduleEntry[];
}

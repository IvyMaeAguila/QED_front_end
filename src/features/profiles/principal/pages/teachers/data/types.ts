
export interface TeacherSummary {
  teacherId: string;
  fullName: string;
  advisorySection: string | null;
  gradeLevel: string | null;
  room: string | null;
  advisories: {
    gradeLevel: string | null;
    section: string | null;
    room: string | null;
  }[];
}

export interface ScheduleEntry {
  day: string;
  time: string;
  subject: string;
  gradeSection: string | null;
  room: string | null;
}

// The detail view needs everything a summary row has, plus the schedule —
// kept as a strict extension so a TeacherProfile can always be displayed
// anywhere a TeacherSummary is expected (e.g. reusing TeacherSummaryStats).
export interface TeacherProfile extends TeacherSummary {
  schedule: ScheduleEntry[];
}

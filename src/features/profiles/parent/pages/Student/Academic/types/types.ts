export interface MissedActivity {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
}

export interface InterventionFlag {
  id: string;
  concern: string;
  severity: "low" | "medium" | "high";
}

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
}
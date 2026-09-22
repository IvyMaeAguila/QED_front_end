export interface MissedActivity {
  id: string;
  topic: string;
  subject: string;
  type: "Written Works" | "Performance Task" | "Examination";
  score: number | null;
  maxItems: number;
  dueDate: string;
}

export interface InterventionFlag {
  id: string;
  topicId: number;
  concern: string;
  severity: "low" | "medium" | "high";
}

export type ScheduleDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  days: ScheduleDay[];
}
import type { MissedActivity, InterventionFlag, ScheduleItem } from "../types/types";

// Walang missed activities — para lumabas yung empty state (gaya ng reference image)
export const mockMissedActivities: MissedActivity[] = [];

// May missed activities — pwedeng gamitin para i-test yung listahan
export const mockMissedActivitiesWithData: MissedActivity[] = [
  {
    id: "ma-1",
    title: "Alphabet Tracing Worksheet",
    subject: "Language",
    dueDate: "Aug 5, 2026",
  },
  {
    id: "ma-2",
    title: "Counting 1-20 Activity Sheet",
    subject: "Mathematics",
    dueDate: "Aug 7, 2026",
  },
  {
    id: "ma-3",
    title: "Show and Tell: My Family",
    subject: "Makabansa",
    dueDate: "Aug 8, 2026",
  },
];

// No flagged concerns — matching yung green "no concern" state sa reference
export const mockInterventionFlags: InterventionFlag[] = [];

// May flagged concern(s) — para i-test yung red warning state
export const mockInterventionFlagsWithData: InterventionFlag[] = [
  {
    id: "if-1",
    concern:
      "Frequently distracted during Reading & Literacy; recommend one-on-one reading support.",
    severity: "medium",
  },
  {
    id: "if-2",
    concern:
      "Missed 3 consecutive Mathematics activities; parent conference suggested.",
    severity: "high",
  },
];

export const mockSchedule: ScheduleItem[] = [
  {
    id: "sch-1",
    subject: "Flag Ceremony",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "7:30 AM",
    endTime: "8:00 AM",
  },
  {
    id: "sch-2",
    subject: "Language",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "8:00 AM",
    endTime: "9:00 AM",
  },
  {
    id: "sch-3",
    subject: "Reading & Literacy",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "9:00 AM",
    endTime: "10:00 AM",
  },
  {
    id: "sch-4",
    subject: "Mathematics",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
  },
  {
    id: "sch-5",
    subject: "Makabansa",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "11:00 AM",
    endTime: "12:00 PM",
  },
  {
    id: "sch-6",
    subject: "GMRC",
    teacher: "Mrs. Eleanor Sequijor",
    startTime: "12:00 PM",
    endTime: "1:00 PM",
  },
];
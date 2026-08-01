import { Users, GraduationCap, BookOpen } from "lucide-react";
import type { StatItem } from "../components/Statcards";
import type { GradeTrendSubject } from "../components/GradeTrendAnalytics";
import type { AgendaItem } from "../components/TodayAgenda";
import type { EventItem } from "../components/UpcomingEvents";

export const TEACHER_STATS: StatItem[] = [
  { label: "Advisory Class", value: 35, Icon: Users, variant: "primary" },
  { label: "Total Student", value: 70, Icon: GraduationCap, variant: "default" },
  { label: "Total Classes", value: 6, Icon: BookOpen, variant: "default" },
];

export const TEACHER_ATTENDANCE = {
  present: 32,
  absent: 3,
  late: 0,
};

export const TEACHER_GRADE_TRENDS: GradeTrendSubject[] = [
  {
    subject: "Mathematics",
    points: [
      { label: "T1", score: 86 },
      { label: "T2", score: 88 },
      { label: "T3", score: 87 },
      { label: "FG", score: 92 },
    ],
  },
  {
    subject: "English",
    points: [
      { label: "T1", score: 86 },
      { label: "T2", score: 86 },
      { label: "T3", score: 87 },
      { label: "FG", score: 92 },
    ],
  },
  {
    subject: "Science",
    points: [
      { label: "T1", score: 82 },
      { label: "T2", score: 85 },
      { label: "T3", score: 88 },
      { label: "FG", score: 90 },
    ],
  },
  {
    subject: "Filipino",
    points: [
      { label: "T1", score: 89 },
      { label: "T2", score: 90 },
      { label: "T3", score: 91 },
      { label: "FG", score: 93 },
    ],
  },
];

export const TEACHER_EVENTS: EventItem[] = [
  { id: "1", time: "Today @ 1:00pm", title: "Parents General Meeting" },
  { id: "2", time: "Tomorrow @ 4:00pm", title: "Faculty Meeting" },
];

export const TEACHER_AGENDA: AgendaItem[] = [
  { id: "1", time: "8:00 - 9:00 AM", subject: "Mathematics 7A" },
  { id: "2", time: "9:15 - 10:15 AM", subject: "Mathematics 7B" },
  { id: "3", time: "10:30 - 11:30 AM", subject: "Mathematics 8A" },
  { id: "4", time: "1:00 - 2:00 PM", subject: "Mathematics 8B" },
];

export interface AdvisoryStudent {
  id: string;
  lastName: string;
  firstName: string;
  middleInitial: string; // e.g. "M." or "" if none
  gender: "Male" | "Female";
}

export const ADVISORY_ROSTER: AdvisoryStudent[] = [
  { id: "sn-2024-0142", lastName: "Dela Cruz", firstName: "Juan", middleInitial: "M.", gender: "Male" },
  { id: "sn-2024-0149", lastName: "Santos", firstName: "Maria", middleInitial: "L.", gender: "Female" },
  { id: "sn-2024-0155", lastName: "Cruz", firstName: "Isabella", middleInitial: "R.", gender: "Female" },
  { id: "sn-2024-0158", lastName: "Santos", firstName: "Miguel", middleInitial: "A.", gender: "Male" },
  { id: "sn-2024-0163", lastName: "Bautista", firstName: "Rafael", middleInitial: "P.", gender: "Male" },
  { id: "sn-2024-0167", lastName: "Mendoza", firstName: "Sofia", middleInitial: "D.", gender: "Female" },
  { id: "sn-2024-0171", lastName: "Reyes", firstName: "Antonio", middleInitial: "G.", gender: "Male" },
  { id: "sn-2024-0174", lastName: "Torres", firstName: "Angela", middleInitial: "M.", gender: "Female" },
];
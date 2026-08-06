import {
  Users,
  GraduationCap,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

export const statsConfig = [
  { key: "totalUsers", label: "Total Users", Icon: UserRound },
  { key: "totalStudents", label: "Total Students", Icon: GraduationCap },
  { key: "totalTeachers", label: "Total Teachers", Icon: UserRoundCheck },
  { key: "totalParents", label: "Total Parents", Icon: Users },
] as const;

export const loginBars = [
  { day: "Mon", value: 46, active: false },
  { day: "Tue", value: 29, active: false },
  { day: "Wed", value: 51, active: false },
  { day: "Thu", value: 72, active: true },
  { day: "Fri", value: 51, active: false },
];

export type Trend = "Improving" | "Consistent" | "Stable" | "Emerging" | "Declining";
export type GradeRow = [string, number, number, number, number, Trend];

export const grades: GradeRow[] = [
  ["Grade 1", 62, 89, 19, 30, "Stable"],
  ["Grade 2", 76, 76, 23, 30, "Improving"],
  ["Grade 3", 62, 62, 19, 30, "Emerging"],
  ["Grade 4", 89, 89, 27, 30, "Consistent"],
  ["Grade 5", 76, 89, 23, 30, "Improving"],
  ["Grade 6", 62, 76, 19, 30, "Declining"],
];
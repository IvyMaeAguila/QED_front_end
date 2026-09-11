import {
  LayoutDashboard,
  ClipboardList,
  ListTodo,
  Table2,
  LibraryBig,
  SquareStar,
  CalendarDays,
} from "lucide-react";

export const TEACHER_NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/teacher" },
  { label: "Attendance", Icon: ListTodo, to: "/teacher/attendance" },
  { label: "My Subjects", Icon: LibraryBig, to: "/teacher/subjects" },
  { label: "Gradesheet", Icon: Table2, to: "/teacher/grades" },
  { label: "Holistic", Icon: SquareStar, to: "/teacher/holistic" },
  { label: "Calendar", Icon: CalendarDays, to: "/teacher/calendar" },
];

export const TEACHER_HELP_ITEM = {
  label: "Help & Support",
  Icon: ClipboardList,
  to: "/teacher/help",
};
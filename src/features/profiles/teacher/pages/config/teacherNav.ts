import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Users,
} from "lucide-react";

export const TEACHER_NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/teacher" },
  { label: "My Subjects", Icon: BookOpen, to: "/teacher/subjects" },
  { label: "Gradebook", Icon: ClipboardList, to: "/teacher/grades" },
  { label: "Holistic", Icon: CalendarCheck, to: "/teacher/holistic" },
  { label: "Calendar", Icon: Users, to: "/teacher/calendar" },
];

export const TEACHER_HELP_ITEM = {
  label: "Help & Support",
  Icon: ClipboardList,
  to: "/teacher/help",
};
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  BarChart3,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";

export const PRINCIPAL_NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/principal" },
  { label: "Teachers", Icon: Users, to: "/principal/teachers" },
  { label: "Students", Icon: School, to: "/principal/students" },
  { label: "Reports", Icon: BarChart3, to: "/principal/reports" },
  { label: "Gradebooks", Icon: BookOpen, to: "/principal/gradebooks" },
  { label: "Calendar", Icon: CalendarCheck, to: "/principal/calendar" },
];

export const PRINCIPAL_HELP_ITEM = {
  label: "Help & Support",
  Icon: ClipboardList,
  to: "/principal/help",
};
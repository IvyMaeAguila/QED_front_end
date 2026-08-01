import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookMarked,
  Calendar,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/admin" },
  { label: "Student Records", Icon: Users, to: "/admin/students" },
  { label: "Manage Users", Icon: Users, to: "/admin/users" },
  { label: "Classes", Icon: BookOpen, to: "/admin/classes" },
  { label: "Academics", Icon: BookMarked, to: "/admin/subjects" },
  { label: "Calendar", Icon: Calendar, to: "/admin/calendar" },
];

export const ADMIN_HELP_ITEM = {
  label: "Help & Support",
  Icon: Calendar, 
  to: "/admin/help",
};
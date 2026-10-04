import {
  LayoutDashboard,
  UserPlus,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import type { NavItem } from "@shared/components/Sidebar"; 

export const PARENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/parent" },
  { label: "Enrolled Children", Icon: UserPlus, to: "/parent/enrolled-children" },
  { label: "Calendar", Icon: CalendarDays, to: "/parent/calendar" },
];

export const PARENT_HELP_ITEM: NavItem = {
  label: "Help & Support",
  Icon: ClipboardList,
  to: "/parent/help",
};

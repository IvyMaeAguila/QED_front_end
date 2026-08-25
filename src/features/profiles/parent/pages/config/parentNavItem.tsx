import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import type { NavItem } from "@shared/components/Sidebar"; // i-adjust path base sa actual import mo
import EnrolledChildrenNavItem from "../dashboard/components/EnrolledChildrenNavItem";

export const PARENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/parent" },
  {
    label: "Enrolled Children",
    Icon: UserCheck,
    activeMatch: "/parent/enrolled-children",
    render: ({ isActive, onCloseSidebar }) => (
      <EnrolledChildrenNavItem
        isActive={isActive}
        onCloseSidebar={onCloseSidebar}
      />
    ),
  },
  { label: "Calendar", Icon: CalendarDays, to: "/parent/calendar" },
];

export const PARENT_HELP_ITEM: NavItem = {
  label: "Help & Support",
  Icon: ClipboardList,
  to: "/parent/help",
};

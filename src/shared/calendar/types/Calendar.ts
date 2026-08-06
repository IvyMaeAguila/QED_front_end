import type { GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admins",
  PRINCIPAL: "Principal",
  TEACHER: "Teachers",
  PARENT: "Parents",
};

// ADMIN is intentionally never a target here — admins already see every
// announcement principals/teachers create (see canViewerSeeEvent), and the
// backend's calendar_target_roles table doesn't accept "admin" as a target
// role, so offering it as a "Send To" option would just 400 on submit.
export const POSTABLE_ROLES_BY_POSTER: Record<Role, Role[]> = {
  ADMIN: ["PRINCIPAL", "TEACHER", "PARENT"],
  PRINCIPAL: ["PRINCIPAL", "TEACHER", "PARENT"],
  TEACHER: ["PARENT"],
  PARENT: [],
};

export interface AnnouncementAudience {
  roles: Role[];
  gradeLevel?: GradeLevel;
  section?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  audience: AnnouncementAudience;
  createdByRole: Role;
  createdByName: string;
}

export interface ViewerContext {
  role: Role;
  gradeLevel?: GradeLevel;
  section?: string;
}

export function canViewerSeeEvent(event: CalendarEvent, viewer: ViewerContext): boolean {
  // Admins see every announcement, no matter who it was targeted at.
  if (viewer.role === "ADMIN") return true;

  if (!event.audience.roles.includes(viewer.role)) return false;
  if (event.audience.gradeLevel && event.audience.gradeLevel !== viewer.gradeLevel) return false;
  if (event.audience.section && event.audience.section !== viewer.section) return false;
  return true;
}

export interface CalendarTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export const ACCENT = "#8B0D0D";
import type { GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT" | "STUDENT";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admins",
  PRINCIPAL: "Principal",
  TEACHER: "Teachers",
  PARENT: "Parents",
  STUDENT: "Students",
};

export const POSTABLE_ROLES_BY_POSTER: Record<Role, Role[]> = {
  ADMIN: ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  PRINCIPAL: ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"],
  TEACHER: ["PARENT", "STUDENT"],
  PARENT: [],
  STUDENT: [],
};

export interface AnnouncementAudience {
  roles: Role[];
  gradeLevel?: GradeLevel; 
  section?: string; 
}

export interface CalendarEvent {
  id: string;
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
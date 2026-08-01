import type { GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

// Roles na pwedeng piliin sa "Send To" — wala nang admin dahil laging
// nakikita ng admin ang LAHAT ng events, kaya hindi na kailangang i-target siya.
export type AudienceRole = "principal" | "teacher" | "parent";

// Roles ng mga taong pwedeng gumamit ng calendar (viewer/poster identity).
// Kasama pa rin dito ang "admin" kahit hindi na siya target-able.
export type Role = "admin" | AudienceRole;

export const ROLE_LABELS: Record<AudienceRole, string> = {
  principal: "Principal",
  teacher: "Teachers",
  parent: "Parents",
};

export const POSTABLE_ROLES_BY_POSTER: Record<Role, AudienceRole[]> = {
  admin: ["principal", "teacher", "parent"],
  principal: ["principal", "teacher", "parent"],
  teacher: ["parent"],
  parent: [],
};

export interface AnnouncementAudience {
  roles: AudienceRole[];
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
  createdById?: number; // ✅ idagdag — user_id ng gumawa, para sa edit-permission check
}

export interface ViewerContext {
  role: Role;
  userId?: number; // ✅ idagdag — user_id ng kasalukuyang naka-login
  gradeLevel?: GradeLevel;
  section?: string;
}

export function canViewerSeeEvent(event: CalendarEvent, viewer: ViewerContext): boolean {
  // Admins can see ALL events regardless of target audience — full visibility.
  if (viewer.role === "admin") return true;

  if (!event.audience.roles.includes(viewer.role as AudienceRole)) return false;
  if (event.audience.gradeLevel && event.audience.gradeLevel !== viewer.gradeLevel) return false;
  if (event.audience.section && event.audience.section !== viewer.section) return false;
  return true;
}

// ✅ idagdag — pwedeng mag-edit ang gumawa mismo, o si admin (kahit sino gumawa)
export function canEditEvent(event: CalendarEvent, viewer: ViewerContext): boolean {
  if (viewer.role === "admin") return true;
  if (viewer.userId != null && event.createdById != null) {
    return viewer.userId === event.createdById;
  }
  return false;
}

export interface CalendarTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export const ACCENT = "#8B0D0D";
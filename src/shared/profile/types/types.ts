import type { GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

// src/features/profiles/types.ts
export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

export interface BaseProfile {
  id: string;
  userName: string;
  role: Role;
  name: string;
  email: string;
}

export interface AdminProfile extends BaseProfile {
  role: "ADMIN";
}

export interface PrincipalProfile extends BaseProfile {
  role: "PRINCIPAL";
  phone?: string;
}

export interface TeacherProfile extends BaseProfile {
  role: "TEACHER";
  phone?: string;
  subject?: string;
  gradeLevel?: GradeLevel; // idagdag
  section?: string;        // idagdag
}

export interface ParentProfile extends BaseProfile {
  role: "PARENT";
  phone: string;
  address: string;
}

export type UserProfile = AdminProfile | PrincipalProfile | TeacherProfile | ParentProfile;
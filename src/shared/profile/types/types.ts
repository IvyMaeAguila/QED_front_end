// src/features/profiles/types.ts
import type { GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";
export type Gender = "male" | "female";
export type TeacherAvatarKey =
  | "female-braid"
  | "male-tie"
  | "male-white-shirt"
  | "female-pink-hair"
  | "male-beard"
  | "female-brown-hair";

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
  gender?: Gender;
}

export interface TeacherProfile extends BaseProfile {
  role: "TEACHER";
  phone?: string;
  subject?: string;
  gradeLevel?: GradeLevel;
  section?: string;
  gender?: Gender; // added — drives default avatar selection
  avatarKey?: TeacherAvatarKey;
}

export interface ParentProfile extends BaseProfile {
  role: "PARENT";
  phone: string;
  address: string;
  gender?: Gender;
}

export type UserProfile = AdminProfile | PrincipalProfile | TeacherProfile | ParentProfile;

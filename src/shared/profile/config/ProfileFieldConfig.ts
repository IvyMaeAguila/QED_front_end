// src/features/profiles/profileFieldConfig.ts
import { Mail, Shield, Phone, MapPin, BookOpen } from "lucide-react";
import type { Role } from "../types/types";

export interface ProfileField {
  key: string;          // property on the profile object
  label: string;        // used as dropdown label when editing
  icon: React.ComponentType<{ size?: number; className?: string }>;
  editable: boolean;
  showInSummary: boolean; // shown in the collapsed (non-editing) view
}

// Role -> ordered list of fields for that role's profile
export const PROFILE_FIELD_CONFIG: Record<Role, ProfileField[]> = {
  ADMIN: [
    { key: "email", label: "Email", icon: Mail, editable: true, showInSummary: true },
    { key: "role", label: "Role", icon: Shield, editable: false, showInSummary: true },
  ],
  PRINCIPAL: [
    { key: "email", label: "Email", icon: Mail, editable: true, showInSummary: true },
    { key: "phone", label: "Phone", icon: Phone, editable: true, showInSummary: true },
    { key: "role", label: "Role", icon: Shield, editable: false, showInSummary: true },
  ],
  TEACHER: [
    { key: "email", label: "Email", icon: Mail, editable: true, showInSummary: true },
    { key: "phone", label: "Phone", icon: Phone, editable: true, showInSummary: true },
    { key: "subject", label: "Subject", icon: BookOpen, editable: true, showInSummary: false },
    { key: "role", label: "Role", icon: Shield, editable: false, showInSummary: true },
  ],
  PARENT: [
    { key: "email", label: "Email", icon: Mail, editable: true, showInSummary: true },
    { key: "phone", label: "Phone", icon: Phone, editable: true, showInSummary: true },
    { key: "address", label: "Address", icon: MapPin, editable: true, showInSummary: false },
    { key: "role", label: "Role", icon: Shield, editable: false, showInSummary: true },
  ],
};
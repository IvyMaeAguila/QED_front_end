export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";
export type UserStatus = "Active" | "Inactive";

export interface UserAccount {
  id: string; 
  lastName: string;
  firstName: string;
  middleName: string; 
  role: Role;
  email: string;
  contactNumber: string;
  status: UserStatus;
  lastLogin: string | null; 
}


export function formatFullName(u: Pick<UserAccount, "lastName" | "firstName" | "middleName">) {
  const middleName = u.middleName ? ` ${u.middleName}.` : "";
  return `${u.lastName}, ${u.firstName}${middleName}`;
}

export const ROLES: Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  PARENT: "Parent",
};

export const ROLE_LABEL_LIST: string[] = Object.values(ROLE_LABELS);

export const STATUSES: UserStatus[] = ["Active", "Inactive"];
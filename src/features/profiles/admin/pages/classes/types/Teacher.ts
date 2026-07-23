export interface Teacher {
  id: string; 
  userId?: string; 
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
}

export function formatTeacherName(t: Pick<Teacher, "firstName" | "lastName">) {
  return `${t.firstName} ${t.lastName}`;
}
import type { Student } from "../../../../admin/pages/studentrecords/types/Students";

export function studentFullName(student: Student): string {
  const middleInitial = student.middleName ? `${student.middleName.charAt(0)}.` : "";
  return [student.firstName, middleInitial, student.lastName].filter(Boolean).join(" ");
}

export function studentSectionLabel(student: Student): string {
  return `${student.gradeLevel} - ${student.section}`;
}
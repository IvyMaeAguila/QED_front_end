// features/profiles/parent/pages/Student/useParentStudentDetail.ts
import { useParams } from "react-router-dom";
import { useParentDashboard } from "../../dashboard/context/ParentDashboardContext";
import type { DetailStudent } from "./../GlobalTypes/types";

export function useStudentDetail(): {
  student: DetailStudent | undefined;
  studentId: string | undefined;
} {
  const { studentId } = useParams<{ studentId: string }>();
  const { students } = useParentDashboard();

  const raw = students.find((s) => String(s.id) === studentId);

  const student: DetailStudent | undefined = raw
    ? {
        id: raw.id,
        firstName: raw.firstName,
        fullName: raw.fullName ?? `${raw.firstName} ${raw.lastName}`.trim(),
        gradeLevel: raw.gradeLevel,
        section: raw.section,
        adviser: raw.adviser,
        schoolYear: "2026 - 2027", // TODO: same as before
      }
    : undefined;

  return { student, studentId };
}
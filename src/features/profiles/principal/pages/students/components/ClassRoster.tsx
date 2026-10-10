import type { Student } from "../data/types";
import { fullName } from "../utils/roster";
import { StudentDirectory } from "@shared/components/StudentDirectory";

interface ClassRosterProps {
  roster: Student[];
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function ClassRoster({ roster, ...theme }: ClassRosterProps) {
  return (
    <StudentDirectory
      students={roster.map((student) => ({
        id: student.studentId,
        studentId: student.studentId,
        name: fullName(student),
        gender: student.gender,
      }))}
      {...theme}
    />
  );
}


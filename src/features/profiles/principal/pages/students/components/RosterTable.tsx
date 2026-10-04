import type { Student } from "../data/types";
import { fullName } from "../utils/roster";
import { StudentDirectoryTable } from "@shared/components/StudentDirectoryTable";

interface RosterTableProps {
  students: Student[];
  totalStudents: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function RosterTable(props: RosterTableProps) {
  return (
    <StudentDirectoryTable
      {...props}
      students={props.students.map((student) => ({
        id: student.studentId,
        name: fullName(student),
        gender: student.gender,
      }))}
    />
  );
}

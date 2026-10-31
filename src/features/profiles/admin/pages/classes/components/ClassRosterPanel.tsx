import { StudentDirectory } from "@shared/components/StudentDirectory";
import { TeacherClassListHeader } from "../../../../principal/pages/teachers/components/TeacherClassListHeader";
import { TeacherClassRosters } from "../../../../principal/pages/teachers/components/TeacherClassRosters";
import type { Student } from "../../studentrecords/types/Students";
import { formatFullName } from "../../studentrecords/types/Students";
import type { SchoolClass } from "../types/Class";

interface ClassRosterPanelProps {
  roster: Student[];
  schoolClass: SchoolClass;
  loading: boolean;
  error: unknown;
  retry: () => void;
  view: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  onStudentActivate: (id: string) => void;
}

export default function ClassRosterPanel({ roster, schoolClass, loading, error, retry, view, onStudentActivate, ...theme }: ClassRosterPanelProps) {
  return <>
    <TeacherClassListHeader sectionCount={1} loading={loading} {...theme} />
    <StudentDirectory
      loading={loading} error={error} retry={retry} view={`${view}:roster`} {...theme}
      students={roster.map(student => ({ id: String(student.id), studentId: student.studentId, name: formatFullName(student), gender: student.gender }))}
      renderStudents={visibleStudents => {
        const visibleIds = new Set(visibleStudents.map(student => student.id));
        return <TeacherClassRosters
          rosters={[{
            classId: Number(schoolClass.id),
            sectionLabel: `${schoolClass.gradeLevel}${schoolClass.section ? ` · ${schoolClass.section}` : ""}`,
            room: schoolClass.room ? `Room ${schoolClass.room}` : "",
            students: roster.filter(student => visibleIds.has(String(student.id)))
              .sort((a, b) => formatFullName(a).localeCompare(formatFullName(b)))
              .map(student => ({ studentId: String(student.id), firstName: student.firstName, lastName: student.lastName, middleInitial: student.middleName, gender: student.gender })),
          }]}
          loading={loading} error={!!error} retry={retry} view={`${view}:roster-cards`} {...theme}
          getStudentName={student => formatFullName({ ...student, middleName: student.middleInitial })}
          onStudentActivate={onStudentActivate}
        />;
      }}
    />
  </>;
}

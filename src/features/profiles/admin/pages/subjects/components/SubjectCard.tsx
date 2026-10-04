import { SubjectAssignmentCard } from "../../../../shared/components/SubjectAssignmentCard";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { type Subject, type SubjectsTheme } from "../types/types";

interface SubjectCardProps extends SubjectsTheme {
  subject: Subject;
  onEdit: () => void;
  onAssign: () => void;
  onToggleStatus: () => void;
}

export function SubjectCard({
  subject,
  onEdit,
  onAssign,
  onToggleStatus,
  ...theme
}: SubjectCardProps) {
  const { teachers } = useTeachers();
  const teacher = teachers.find((t) => t.id === subject.teacherId);
  const isActive = subject.status === "Active";

  return (
    <SubjectAssignmentCard
      {...theme}
      schoolYear={subject.schoolYear}
      status={subject.status}
      title={subject.name}
      subtitle={`${subject.gradeLevel}${subject.section ? ` · ${subject.section}` : " · Section not assigned"}`}
      detail={teacher ? `Teacher · ${formatTeacherName(teacher)}` : "Teacher not assigned"}
      showStudentCount={false}
      actions={
        <>
          <button
            onClick={onEdit}
            className="h-8 rounded-lg bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000]"
          >
            Edit
          </button>
          {!teacher && (
            <button
              onClick={onAssign}
              className="h-8 whitespace-nowrap rounded-lg border border-[#D8C3C6] bg-white px-3 text-[11px] font-extrabold text-[#800020] transition-colors hover:bg-[#FFF8F8]"
            >
              Assign teacher
            </button>
          )}
          <button
            onClick={onToggleStatus}
            className={`h-8 whitespace-nowrap rounded-lg border px-3 text-[11px] font-extrabold transition-colors ${isActive ? "border-gray-200 bg-white text-gray-600 hover:border-[#D8C3C6] hover:text-[#800020]" : "border-[#D8C3C6] bg-[#FFF8F8] text-[#800020] hover:bg-[#F5E9EA]"}`}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </>
      }
    />
  );
}

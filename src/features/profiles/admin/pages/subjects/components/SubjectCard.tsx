import { SubjectAssignmentCard } from "../../../../shared/components/SubjectAssignmentCard";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { type Subject, type SubjectsTheme } from "../types/types";

interface SubjectCardProps extends SubjectsTheme {
  loading?: boolean;
  subject: Subject;
  onEdit: () => void;
  onAssign: () => void;
  onToggleStatus: () => void;
}

export function SubjectCard({
  loading = false,
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
      loading={loading}
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
            className="h-8 rounded-lg bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light"
          >
            Edit
          </button>
          {!teacher && (
            <button
              onClick={onAssign}
              className="h-8 whitespace-nowrap rounded-lg border border-[#D8C3C6] bg-white px-3 text-xs font-extrabold text-brand-ink transition-colors hover:bg-[#FFF8F8]"
            >
              Assign teacher
            </button>
          )}
          <button
            onClick={onToggleStatus}
            className={`h-8 whitespace-nowrap rounded-lg border px-3 text-xs font-extrabold transition-colors ${isActive ? "border-gray-200 bg-white text-gray-600 hover:border-[#D8C3C6] hover:text-maroon-light" : "border-[#D8C3C6] bg-[#FFF8F8] text-brand-ink hover:bg-brand-soft"}`}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </>
      }
    />
  );
}

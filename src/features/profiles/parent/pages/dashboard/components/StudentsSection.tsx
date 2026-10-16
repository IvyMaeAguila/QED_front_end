import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import type { CardViewMode, Student } from "../types/student";
import StudentCard from "./StudentCard";
import ViewToggle from "./ViewToggle";

interface StudentsSectionProps {
  students: Student[];
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view: CardViewMode;
  onViewChange: (view: CardViewMode) => void;
  onViewStudent?: (student: Student) => void;
  panelBg?: string;
  panelBorder?: string;
  textPrimary?: string;
  textMuted?: string;
  darkMode?: boolean;
}

export default function StudentsSection({
  students,
  loading = false, error, retry,
  view,
  onViewChange,
  onViewStudent,
  panelBg = "bg-white",
  textPrimary = "text-gray-800",
  textMuted = "text-gray-400",
  darkMode = false,
}: StudentsSectionProps) {
  const renderStudents = (pending: boolean) => {
    const rows: Student[] = pending ? Array.from({ length: skeletonRows(`parent-cards:${view}`, undefined, view === "grid" ? 260 : 90) }, (_, index) => ({ id: String(index), studentNumber: "", firstName: "", lastName: "", fullName: "", gradeLevel: "", section: "", adviser: "Reserved", performanceStatus: "pending" })) : students;
    return <>        {rows.length === 0 ? (
          <p className={`py-6 text-center text-xs ${textMuted}`} data-sk-region="studentssection-no-children-linked-yet-use-link-student-above" data-sk-static="">
            No children linked yet. Use "Link Student" above to get started.
          </p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                loading={pending}
                view="grid"
                onView={onViewStudent}
                darkMode={darkMode}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                loading={pending}
                view="list"
                onView={onViewStudent}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
</>;
  };
  return (
    <div className="flex flex-col gap-5">

      <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className={`text-sm font-bold ${textPrimary}`} data-sk-region="studentssection-currently-enrolled" data-sk-static="">
            Currently Enrolled
          </p>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>

        <LoadingRegion name="enrolled-student-cards" loading={loading} error={error} retry={retry} variable retainPrevious hasContent={students.length > 0} skeleton={null} frame={renderStudents} onSettled={() => rememberRows(`parent-cards:${view}`, students.length)}>{renderStudents(false)}</LoadingRegion>
      </div>
    </div>
  );
}


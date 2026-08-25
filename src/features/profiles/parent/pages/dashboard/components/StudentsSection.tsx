import type { CardViewMode, Student } from "../types/student";
import StudentCard from "./StudentCard";
import ViewToggle from "./ViewToggle";

interface StudentsSectionProps {
  students: Student[];
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
  view,
  onViewChange,
  onViewStudent,
  panelBg = "bg-white",
  textPrimary = "text-gray-800",
  textMuted = "text-gray-400",
  darkMode = false,
}: StudentsSectionProps) {
  return (
    <div className="flex flex-col gap-5">

      <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className={`text-sm font-bold ${textPrimary}`}>
            Currently Enrolled
          </p>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>

        {students.length === 0 ? (
          <p className={`py-6 text-center text-xs ${textMuted}`}>
            No children linked yet. Use "Link Student" above to get started.
          </p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                view="grid"
                onView={onViewStudent}
                darkMode={darkMode}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                view="list"
                onView={onViewStudent}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

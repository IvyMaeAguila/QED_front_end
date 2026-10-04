import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Student } from "../../dashboard/types/student";

interface EnrolledChildrenListProps {
  students: Student[];
  darkMode: boolean;
}

const MAROON = "#800000";

export function EnrolledChildrenList({
  students,
  darkMode,
}: EnrolledChildrenListProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const dividerColor = darkMode ? "border-white/10" : "border-black/5";

  const rowSurface = darkMode
    ? "bg-[#1f2937] ring-1 ring-white/10 hover:bg-[#263344]"
    : "bg-gray-50 ring-1 ring-black/5 hover:bg-white hover:shadow-md";

  const pillClass = darkMode ? "bg-white/10 text-gray-300" : "font-semibold";
  const pillStyle = darkMode
    ? undefined
    : { backgroundColor: "rgba(128,0,0,0.08)", color: MAROON };

  const handleView = (student: Student) => {
    const rolePrefix = location.pathname.split("/")[1];
    navigate(`/${rolePrefix}/students/${student.id}`);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5 ${dividerColor}`}
      >
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${mutedColor}`}
        >
          Linked students
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pillClass}`}
          style={pillStyle}
        >
          {students.length} {students.length === 1 ? "child" : "children"}
        </span>
      </div>

      {students.length === 0 ? (
        <p
          className={`px-4 py-10 text-center text-xs font-medium sm:text-sm ${mutedColor}`}
        >
          No linked students yet. Use the form to connect your child.
        </p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto px-4 py-4 sm:px-5">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => handleView(student)}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg py-2.5 pl-5 pr-3 text-left transition-all ${rowSurface}`}
            >
              {/* Maroon accent bar */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: MAROON }}
              />

              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: MAROON }}
              >
                {student.firstName.charAt(0)}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold ${titleColor}`}>
                  {student.fullName}
                </p>
                <p className={`truncate text-xs ${mutedColor}`}>
                  {student.gradeLevel} • {student.section}
                </p>
              </div>

              {/* Right affordance */}
              <ChevronRight
                size={16}
                className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${mutedColor}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {students.length > 0 && (
        <p
          className={`border-t px-4 py-3 text-[11px] sm:px-5 ${dividerColor} ${mutedColor}`}
        >
          Select a child to view their profile and progress.
        </p>
      )}
    </div>
  );
}

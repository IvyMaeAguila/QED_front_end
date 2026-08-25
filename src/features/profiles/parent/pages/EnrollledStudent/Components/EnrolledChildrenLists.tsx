import { useLocation, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import type { Student } from "../../dashboard/types/student";

interface EnrolledChildrenListProps {
  students: Student[];
  darkMode: boolean;
}

export function EnrolledChildrenList({
  students,
  darkMode,
}: EnrolledChildrenListProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const cardBg = darkMode
    ? "bg-[#1f2937]/50 hover:bg-[#1f2937]"
    : "bg-gray-50 hover:bg-gray-100";


  const handleView = (student: Student) => {
    const rolePrefix = location.pathname.split("/")[1];
    navigate(`/${rolePrefix}/students/${student.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users size={16} className={mutedColor} />
        <h2 className={`text-sm font-semibold ${titleColor}`}>
          {students.length} {students.length === 1 ? "Child" : "Children"}{" "}
          Enrolled
        </h2>
      </div>

      {students.length === 0 ? (
        <p className={`py-6 text-center text-xs ${mutedColor}`}>
          No linked students yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => handleView(student)}
              style={{ borderLeft: "1px solid #711111", borderBottom: "1px solid #711111" }}
              className={`flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${cardBg}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  darkMode
                    ? "bg-maroon/20 text-maroon"
                    : "bg-maroon/10 text-maroon-dark"
                }`}
              >
                {student.firstName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${titleColor}`}>
                  {student.fullName}
                </p>
                <p className={`truncate text-xs ${mutedColor}`}>
                  {student.gradeLevel} • {student.section}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
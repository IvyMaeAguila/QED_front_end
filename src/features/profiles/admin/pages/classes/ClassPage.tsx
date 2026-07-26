import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Filter } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { formatTeacherName } from "./types/Teacher";
import { ClassCard } from "./components/ClassCard";
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "../studentrecords/types/Students";
import type { AdminThemeContext } from "../../AdminLayout";

export function ClassesPage() {
  const navigate = useNavigate();
  const { classes, deleteClass } = useClasses();
  const { getTeacher } = useTeachers();
  const { students } = useStudents();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();

  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "All Grades">(
    "All Grades",
  );

  const filtered = useMemo(
    () =>
      classes.filter(
        (c) => gradeFilter === "All Grades" || c.gradeLevel === gradeFilter,
      ),
    [classes, gradeFilter],
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center p-2">
        <div>
          <h3
            className={`text-base sm:text-4xl font-bold  ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            Classes Management
          </h3>
          <p className="text-sm text-[#9CA3AF] mt-1 font-medium">
            Showing {filtered.length} of {classes.length} total classes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative inline-flex items-center">
            <select
              value={gradeFilter}
              onChange={(e) =>
                setGradeFilter(e.target.value as GradeLevel | "All Grades")
              }
              className="h-10 pl-4 pr-10 rounded-xl text-xs font-bold bg-white text-[#650000] border border-[#650000] outline-none cursor-pointer appearance-none 
              hover:bg-linear-to-r hover:from-[#550000] hover:to-[#bb0000] hover:text-white transition-all duration-300"
            >
              <option value="All Grades">All Grades</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute right-3 z-20 flex items-center text-[#650000] group-hover:text-white transition-colors duration-300">
              <Filter size={16} strokeWidth={2} />
            </div>
          </div>

          <button
            onClick={() => navigate("new")}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(160deg, #F99D3A 0%, #935D23 100%)",
            }}
          >
            <Plus size={14} /> Add Class
          </button>
        </div>
      </header>

      <main>
        {filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className={`text-sm font-semibold ${textMuted}`}>
              No classes found for this filter.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((c) => {
              const adviser = getTeacher(c.adviserId);
              const studentCount = students.filter(
                (s) => s.gradeLevel === c.gradeLevel && s.section === c.section,
              ).length;

              return (
                <ClassCard
                  key={c.id}
                  schoolClass={c}
                  adviserName={
                    adviser ? formatTeacherName(adviser) : "Unassigned"
                  }
                  studentCount={studentCount}
                  darkMode={darkMode}
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  onView={() => navigate(c.id)}
                  onEdit={() => navigate(`${c.id}/edit`)}
                  onDelete={() => {
                    if (
                      confirm(
                        `Delete ${c.gradeLevel} • ${c.section}? This cannot be undone.`,
                      )
                    ) {
                      deleteClass(c.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

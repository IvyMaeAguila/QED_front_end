import { useOutletContext, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronRight } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import students from "../../../../../shared/images/students.jpg";

const SCHOOL_YEAR = "2025-2026"; // TODO: pull from active school year context

// TODO: replace with real API data
// Simplified: one section per grade level for now.
const GRADE_LEVELS = [
  { grade: "Grade 1", section: "Section A", totalStudents: 42 },
  { grade: "Grade 2", section: "Section A", totalStudents: 41 },
  { grade: "Grade 3", section: "Section A", totalStudents: 40 },
  { grade: "Grade 4", section: "Section A", totalStudents: 44 },
  { grade: "Grade 5", section: "Section A", totalStudents: 43 },
  { grade: "Grade 6", section: "Section A", totalStudents: 47 },
];

const TOTAL_STUDENTS = GRADE_LEVELS.reduce(
  (sum, g) => sum + g.totalStudents,
  0,
);

export function PrincipalStudentsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}
          >
            Students
          </h1>
          <p className={`text-sm mt-2 ${textMuted}`}>
            Enrollment overview by grade level &middot; School Year{" "}
            {SCHOOL_YEAR}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: darkMode
              ? "var(--color-gold-soft-dark)"
              : "var(--color-gold-soft)",
            color: "var(--color-gold-dark)",
          }}
        >
          <GraduationCap className="h-3.5 w-3.5" />{" "}
          {TOTAL_STUDENTS.toLocaleString()} Total Students
        </span>
      </div>

      {/* Grade level cards — rich-media header, title, secondary text,
          supporting text, action, matching the card anatomy spec. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {GRADE_LEVELS.map((g) => (
          <div
            key={g.grade}
            className="rounded-2xl overflow-hidden flex flex-col border"
            style={{ backgroundColor: panelBg, borderColor: panelBorder }}
          >
            {/* Rich media area */}
            <div
              className="h-40 flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: darkMode
                  ? "var(--color-maroon-soft-dark)"
                  : "var(--color-maroon-soft)",
              }}
            >
              <img
                src={students}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-1 flex-1">
              <h2 className={`text-lg font-black ${textPrimary}`}>{g.grade}</h2>
              <p className={`text-sm font-semibold ${textMuted}`}>
                {g.section}
              </p>

              <p className={`text-sm mt-2 ${textMuted}`}>
                {g.totalStudents} student{g.totalStudents === 1 ? "" : "s"}{" "}
                enrolled this school year.
              </p>

              {/* Action */}
              <button
                onClick={() =>
                  navigate(`/principal/students/${encodeURIComponent(g.grade)}`)
                }
                className="mt-4 text-maroon text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:underline self-start"
              >
                View Class List <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

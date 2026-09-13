import { useOutletContext, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalStudentsOverview } from "./hooks/usePrincipalStudentsOverview";
import { GradeLevelGrid } from "./components/GradeLevelGrid";

export function PrincipalStudentsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { gradeLevels, totalStudents, schoolYear, loading } = usePrincipalStudentsOverview();

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>Students</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>
            Enrollment overview by grade level &middot; School Year {schoolYear}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: darkMode ? "var(--color-gold-soft-dark)" : "var(--color-gold-soft)",
            color: "var(--color-gold-dark)",
          }}
        >
          <GraduationCap className="h-3.5 w-3.5" /> {totalStudents.toLocaleString()} Total Students
        </span>
      </div>

      {loading ? (
        <p className={`text-sm ${textMuted}`}>Loading students…</p>
      ) : (
        <GradeLevelGrid
          gradeLevels={gradeLevels}
          onViewClassList={(classId) => navigate(`/principal/students/${classId}`)}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
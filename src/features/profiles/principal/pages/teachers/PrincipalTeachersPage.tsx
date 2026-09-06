import { useOutletContext, useNavigate } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useTeachersDirectory } from "./hooks/useTeachersDirectory";
import { TeacherDirectoryTable } from "./components/TeacherDirectoryTable";

export function PrincipalTeachersPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { teachers, schoolYear, loading } = useTeachersDirectory();

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div>
        <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>Teachers</h1>
        <p className={`text-sm mt-2 ${textMuted}`}>
          Teacher list and advisory assignments &middot; School Year {schoolYear}
        </p>
      </div>

      {loading ? (
        <p className={`text-sm ${textMuted}`}>Loading teachers…</p>
      ) : (
        <TeacherDirectoryTable
          teachers={teachers}
          onSelectTeacher={(teacherId) => navigate(`/principal/teachers/${encodeURIComponent(teacherId)}`)}
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

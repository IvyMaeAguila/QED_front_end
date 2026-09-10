import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../shared/components/DashboardUI";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useClassList, type ClassListTarget } from "./hooks/useClassList";
import { ClassSummaryStats } from "./components/ClassSummaryStats";
import { ClassRoster } from "./components/ClassRoster";
import { ClassNotFound } from "./components/ClassNotFound";

export function ClassListPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId, gradeId } = useParams<{ classId?: string; gradeId?: string }>();

  let target: ClassListTarget | undefined;
  let isInvalidId = false;

  if (classId !== undefined) {
    const parsed = Number(classId);
    if (Number.isNaN(parsed)) isInvalidId = true;
    else target = { type: "class", id: parsed };
  } else if (gradeId !== undefined) {
    const parsed = Number(gradeId);
    if (Number.isNaN(parsed)) isInvalidId = true;
    else target = { type: "grade", id: parsed };
  }

  const { classList, schoolYear, loading, notFound } = useClassList(target);

  if (loading) {
    return <p className={`text-sm ${textMuted}`}>Loading class list…</p>;
  }

  if (notFound || !classList || isInvalidId) {
    return (
      <ClassNotFound
        gradeLabel={classId ?? gradeId ?? ""}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/principal/students")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div>
          <h1 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${textPrimary}`}>
            {classList.grade} — Class List
          </h1>
          <p className={`text-sm mt-1 ${textMuted}`}>School Year {schoolYear}</p>
        </div>
      </div>

      <ClassSummaryStats
        sectionInfo={classList.sectionInfo}
        totalStudents={classList.roster.length}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <ClassRoster
        roster={classList.roster}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </div>
  );
}
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../shared/components/DashboardUI";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useClassList, type ClassListTarget } from "./hooks/useClassList";
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
      <div className="flex items-start gap-2.5">
        <BackButton onClick={() => navigate("/principal/students")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-maroon">
            {classList.grade} · {classList.sectionInfo.section}
          </p>
          <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>
            Class List
          </h1>
          <p className={`mt-1 text-xs font-medium ${textMuted}`}>
            School Year {schoolYear} · Adviser {classList.sectionInfo.adviser} · Room {classList.sectionInfo.room}
          </p>
        </div>
      </div>

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

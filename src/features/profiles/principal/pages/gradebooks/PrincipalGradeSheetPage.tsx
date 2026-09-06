import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradeSheet } from "./hooks/usePrincipalGradeSheet";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradeSheetNotFound } from "./components/GradeSheetNotFound";
import { GradeSheetHeader } from "./components/GradeSheetHeader";
import { GradeSheetSummary } from "./components/GradeSheetSummary";
import { GradeSheetTable } from "./components/GradeSheetTable";
import { sortByLastName } from "./utils/gradeSheetUtils";

export function PrincipalGradeSheetPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { grade } = useParams<{ grade: string }>();

  const gradeLabel = grade ? decodeURIComponent(grade) : "";
  const { students, subjects, schoolYear, loading, error, notFound } = usePrincipalGradeSheet(gradeLabel);

  const males = students.filter((s) => s.gender === "Male").sort(sortByLastName);
  const females = students.filter((s) => s.gender === "Female").sort(sortByLastName);

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradeSheetHeader
        gradeLabel={gradeLabel}
        schoolYear={schoolYear}
        onBack={() => navigate("/principal/gradebooks")}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {loading || error ? (
        <DashboardStatus loading={loading} error={error} panelBg={panelBg} panelBorder={panelBorder} textMuted={textMuted} />
      ) : notFound ? (
        <GradeSheetNotFound gradeLabel={gradeLabel} panelBg={panelBg} panelBorder={panelBorder} textMuted={textMuted} />
      ) : (
        <>
          <GradeSheetSummary
            totalStudents={students.length}
            maleCount={males.length}
            femaleCount={females.length}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
          <GradeSheetTable
            subjects={subjects}
            males={males}
            females={females}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </>
      )}
    </div>
  );
}

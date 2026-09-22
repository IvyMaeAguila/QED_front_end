import { useNavigate, useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradebooks } from "./hooks/usePrincipalGradebooks";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradebooksHeader } from "./components/GradebooksHeader";
import { GradeLevelCards } from "./components/GradeLevelCards";

export function PrincipalGradebooksPage() {
  const { panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { gradeLevels, schoolYear, loading, error } =
    usePrincipalGradebooks();

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradebooksHeader
        schoolYear={schoolYear}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {loading || error ? (
        <DashboardStatus
          loading={loading}
          error={error}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textMuted={textMuted}
        />
      ) : (
        <GradeLevelCards
          gradeLevels={gradeLevels}
          panelBg={panelBg}
          onSelectGrade={(summary) => {
            if (!summary.isSubmitted || summary.gradingPeriodId === null)
              return;

            const params = new URLSearchParams({
              gradeLevelId: String(summary.gradeLevelId),
              gradingPeriodId: String(summary.gradingPeriodId),
            });
            if (summary.sectionId)
              params.set("sectionId", String(summary.sectionId));

            navigate(
              `/principal/gradebooks/${encodeURIComponent(summary.grade)}?${params}`,
            );
          }}
        />
      )}
    </div>
  );
}

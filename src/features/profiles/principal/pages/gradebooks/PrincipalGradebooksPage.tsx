import { useNavigate, useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradebooks } from "./hooks/usePrincipalGradebooks";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradebooksHeader } from "./components/GradebooksHeader";
import { GradeLevelCards } from "./components/GradeLevelCards";
import { Skeleton } from "@shared/components/SkeletonLoading";

function GradebooksSkeleton() {
  return (
    <div className="flex flex-col gap-4 mt-1">
      <Skeleton className="h-3 w-40 ml-8" />
      <Skeleton className="h-3 w-40 ml-8 mb-7" />
      <div className="flex gap-4">
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
      </div>
      <div className="flex gap-4 mt-1">
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
      </div>
    </div>
  );
}

export function PrincipalGradebooksPage() {
  const { panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { gradeLevels, schoolYear, loading, error } =
    usePrincipalGradebooks();

  if (loading) {
    return <GradebooksSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradebooksHeader
        schoolYear={schoolYear}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {error ? (
        <DashboardStatus
          loading={false}
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
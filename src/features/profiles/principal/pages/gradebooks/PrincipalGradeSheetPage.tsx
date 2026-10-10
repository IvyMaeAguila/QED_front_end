import { useEffect } from "react";
import { PrincipalGradeSheetPageComposition,type PrincipalGradeSheetPageEffectScope } from "./PrincipalGradeSheetPage.loading-view";
export * from "./PrincipalGradeSheetPage.loading-view";

function PrincipalGradeSheetPageDataEffects({ scope }: { scope: PrincipalGradeSheetPageEffectScope }) {
 const { gradeLevelId, setPeriodsLoading, setPeriodError, fetchGradingPeriods, setGradingPeriods, gradingPeriodId, searchParams, setSearchParams, sectionId, periodAttempt } = scope;
 useEffect(() => {
    if (gradeLevelId === undefined) {
      setPeriodsLoading(false);
      return;
    }
    const controller = new AbortController();
    setPeriodsLoading(true);
    setPeriodError(null);

    fetchGradingPeriods({ gradeLevelId, sectionId }, controller.signal)
      .then(({ periods, defaultGradingPeriodId }) => {
        if (controller.signal.aborted) return;
        setGradingPeriods(periods);
        if (gradingPeriodId === undefined && defaultGradingPeriodId !== null) {
          const next = new URLSearchParams(searchParams);
          next.set("gradingPeriodId", String(defaultGradingPeriodId));
          setSearchParams(next, { replace: true });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setPeriodError(err instanceof Error ? err.message : "Failed to fetch grading periods.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPeriodsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevelId, sectionId, periodAttempt]);
 return null;
}

export function PrincipalGradeSheetPage() {
 return <PrincipalGradeSheetPageComposition effects={scope => <PrincipalGradeSheetPageDataEffects scope={scope}/>} />;
}

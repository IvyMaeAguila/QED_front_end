import { useEffect } from "react";
import { PrincipalGradeSheetPageComposition, type PrincipalGradeSheetPageEffectScope } from "./PrincipalGradeSheetPage.loading-view";
export * from "./PrincipalGradeSheetPage.loading-view";

function PrincipalGradeSheetPageDataEffects({ scope }: { scope: PrincipalGradeSheetPageEffectScope }) {
 const { gradingPeriodId, defaultGradingPeriodId, searchParams, setSearchParams } = scope;
 useEffect(() => {
    if (gradingPeriodId !== undefined || defaultGradingPeriodId === null) return;
    const next = new URLSearchParams(searchParams);
    next.set("gradingPeriodId", String(defaultGradingPeriodId));
    setSearchParams(next, { replace: true });
  }, [gradingPeriodId, defaultGradingPeriodId, searchParams, setSearchParams]);
 return null;
}

export function PrincipalGradeSheetPage() {
 return <PrincipalGradeSheetPageComposition effects={scope => <PrincipalGradeSheetPageDataEffects scope={scope}/>} />;
}

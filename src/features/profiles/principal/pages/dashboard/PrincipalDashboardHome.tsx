import { useEffect } from "react";
import { PrincipalDashboardHomeComposition,type PrincipalDashboardHomeEffectScope } from "./PrincipalDashboardHome.loading-view";
export * from "./PrincipalDashboardHome.loading-view";

function PrincipalDashboardHomeDataEffects({ scope }: { scope: PrincipalDashboardHomeEffectScope }) {
 const { setYearLoading, setYearError, fetchActiveAcademicYear, setAcademicYear, yearAttempt } = scope;
 useEffect(() => {
    let cancelled = false; setYearLoading(true); setYearError(null);
    fetchActiveAcademicYear().then(value => { if (!cancelled) setAcademicYear(value); })
      .catch(error => { if (!cancelled) setYearError(error instanceof Error ? error : new Error("Failed to load school year.")); })
      .finally(() => { if (!cancelled) setYearLoading(false); });
    return () => { cancelled = true; };
  }, [yearAttempt]);
 return null;
}

export function PrincipalDashboardHome() {
 return <PrincipalDashboardHomeComposition effects={scope => <PrincipalDashboardHomeDataEffects scope={scope}/>} />;
}

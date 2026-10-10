import { useEffect } from "react";
import { HolisticOverviewPageComposition,type HolisticOverviewPageEffectScope } from "./HolisticOverviewPage.loading-view";
export * from "./HolisticOverviewPage.loading-view";

function HolisticOverviewPageDataEffects({ scope }: { scope: HolisticOverviewPageEffectScope }) {
 const { setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTerms, setSelectedTerm, termsAttempt, selectedTerm, setLoading, setOverviewError, fetchHolisticOverview, setStudents, overviewAttempt } = scope;
 useEffect(() => {
    let cancelled = false; setTermsLoading(true); setTermsError(null);
    fetchGradingPeriodsGlobal().then(data => {
      if (cancelled) return; setTerms(data);
      setSelectedTerm(previous => previous ?? data.find(term => term.isActive)?.termNumber ?? data[0]?.termNumber ?? 1);
    }).catch(error => { if (!cancelled) setTermsError(error instanceof Error ? error.message : "Failed to load terms."); })
      .finally(() => { if (!cancelled) setTermsLoading(false); });
    return () => { cancelled = true; };
  }, [termsAttempt]);
useEffect(() => {
    if (selectedTerm === null) return;
    let cancelled = false; setLoading(true); setOverviewError(null);
    fetchHolisticOverview(selectedTerm).then(data => { if (!cancelled) setStudents(data); })
      .catch(error => { if (!cancelled) setOverviewError(error instanceof Error ? error.message : "Failed to load holistic overview."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTerm, overviewAttempt]);
 return null;
}

export function HolisticOverviewPage() {
 return <HolisticOverviewPageComposition effects={scope => <HolisticOverviewPageDataEffects scope={scope}/>} />;
}

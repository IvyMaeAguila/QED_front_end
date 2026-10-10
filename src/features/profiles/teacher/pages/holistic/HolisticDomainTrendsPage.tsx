import { useEffect } from "react";
import { HolisticDomainTrendsPageComposition,type HolisticDomainTrendsPageEffectScope } from "./HolisticDomainTrendsPage.loading-view";
export * from "./HolisticDomainTrendsPage.loading-view";

function HolisticDomainTrendsPageDataEffects({ scope }: { scope: HolisticDomainTrendsPageEffectScope }) {
 const { setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTerms, setSelectedTerm, termsAttempt, selectedTerm, section, setSearchParams, setTrendsLoading, setTrendsError, fetchDomainTrendsOverview, setTrendsData, setActiveTab, trendsAttempt } = scope;
 useEffect(() => {
    let cancelled = false;
    setTermsLoading(true); setTermsError(null);
    fetchGradingPeriodsGlobal().then(data => {
      if (cancelled) return;
      setTerms(data);
      setSelectedTerm(previous => previous ?? data.find(term => term.isActive)?.termNumber ?? data[0]?.termNumber ?? 1);
    }).catch(error => { if (!cancelled) setTermsError(error instanceof Error ? error.message : "Failed to load terms."); })
      .finally(() => { if (!cancelled) setTermsLoading(false); });
    return () => { cancelled = true; };
  }, [termsAttempt]);
useEffect(() => {
    if (selectedTerm === null || !section) return;
    let cancelled = false;

    setSearchParams({ term: String(selectedTerm) }, { replace: true });
    setTrendsLoading(true);
    setTrendsError(null);
    fetchDomainTrendsOverview(selectedTerm, section.classId)
      .then((data) => {
        if (cancelled) return;
        setTrendsData(data);
        // Keep the current subject tab if this section also has it,
        // otherwise fall back to "Overall".
        setActiveTab((prev) =>
          prev === "overall" || data.subjects.some((s) => s.subjectSectionId === prev)
            ? prev
            : "overall"
        );
      })
      .catch((err) => { if (!cancelled) setTrendsError(err instanceof Error ? err.message : "Failed to load domain trends."); })
      .finally(() => {
        if (!cancelled) setTrendsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTerm, section?.classId, trendsAttempt]);
 return null;
}

export function HolisticDomainTrendsPage() {
 return <HolisticDomainTrendsPageComposition effects={scope => <HolisticDomainTrendsPageDataEffects scope={scope}/>} />;
}

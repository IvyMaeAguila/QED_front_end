import { useEffect } from "react";
import { GradesPageComposition,type GradesPageEffectScope } from "./GradePage.loading-view";
export * from "./GradePage.loading-view";

function GradesPageDataEffects({ scope }: { scope: GradesPageEffectScope }) {
 const { setTermsLoading, setSectionsLoading, setMetadataError, fetchGradingPeriods, setTerms, setSelectedTermId, fetchAdvisorySections, setSections, setSelectedClassId, attempt, selectedTermId, selectedClassId, termsLoading, sectionsLoading, setGradebookLoading, setGradebookError, fetchAdvisoryGradebook, setGradebook, setLogsLoading, setLogsError, fetchClassSubmissionLogs, setSubmissionLogs, logsAttempt, setStatusLoading, setStatusError, fetchClassSubmissionStatus, setSubmitted, setSubmittedAt, statusAttempt, gradebook, gradebookLoading, rememberRows } = scope;
 useEffect(() => {
    let cancelled = false; setTermsLoading(true); setSectionsLoading(true); setMetadataError(null);
    fetchGradingPeriods().then(periods => {if(!cancelled){setTerms(periods);const active=periods.find(p=>p.isActive)??periods[0];if(active)setSelectedTermId(active.id);}})
      .catch(error => {if(!cancelled)setMetadataError(error instanceof Error ? error.message : "Failed to load terms.");})
      .finally(()=>{if(!cancelled)setTermsLoading(false);});
    fetchAdvisorySections().then(options=>{if(!cancelled){setSections(options);if(options.length)setSelectedClassId(options[0].classId);}})
      .catch(error=>{if(!cancelled)setMetadataError(error instanceof Error ? error.message : "Failed to load sections.");})
      .finally(()=>{if(!cancelled)setSectionsLoading(false);});
    return ()=>{cancelled=true;};
  },[attempt]);
useEffect(() => {
    if (!selectedTermId || !selectedClassId) { if (!termsLoading && !sectionsLoading) setGradebookLoading(false); return; }
    let cancelled = false;
    setGradebookLoading(true);
    setGradebookError(null);
    fetchAdvisoryGradebook(selectedTermId, selectedClassId)
      .then((data) => !cancelled && setGradebook(data))
      .catch((err) => {
        console.error("Failed to load advisory gradebook:", err);
        if (!cancelled) setGradebookError("Failed to load grade records for this term.");
      })
      .finally(() => !cancelled && setGradebookLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedTermId, selectedClassId, attempt, termsLoading, sectionsLoading]);
useEffect(() => {
    if (!selectedTermId || !selectedClassId) return;
    let cancelled = false;
    setLogsLoading(true); setLogsError(null);
    fetchClassSubmissionLogs(selectedTermId, selectedClassId)
      .then((logs) => { if (!cancelled) setSubmissionLogs(logs); })
      .catch((err) => {if(!cancelled)setLogsError(err instanceof Error ? err.message : "Failed to load submission history.");})
      .finally(()=>{if(!cancelled)setLogsLoading(false);});
    return () => { cancelled = true; };
  }, [selectedTermId, selectedClassId, attempt, logsAttempt]);
useEffect(() => {
    if (!selectedTermId || !selectedClassId) return;
    let cancelled = false;
    setStatusLoading(true); setStatusError(null);
    fetchClassSubmissionStatus(selectedTermId, selectedClassId)
      .then((status) => {
        if (cancelled) return;
        setSubmitted(status.submitted);
        setSubmittedAt(status.submittedAt);
      })
      .catch((err) => {if(!cancelled)setStatusError(err instanceof Error ? err.message : "Failed to load submission status.");})
      .finally(()=>{if(!cancelled)setStatusLoading(false);});
    return () => {
      cancelled = true;
    };
  }, [selectedTermId, selectedClassId, attempt, statusAttempt]);
useEffect(()=>{if(gradebook&&!gradebookLoading)rememberRows("teacher-grades-subjects",gradebook.subjects.length);},[gradebook,gradebookLoading]);
 return null;
}

export function GradesPage() {
 return <GradesPageComposition effects={scope => <GradesPageDataEffects scope={scope}/>} />;
}

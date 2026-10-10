import { useEffect } from "react";
import { SubjectRecordsPageComposition,type SubjectRecordsPageEffectScope } from "./SubjectRecordsPage.loading-view";
export * from "./SubjectRecordsPage.loading-view";

function SubjectRecordsPageDataEffects({ scope }: { scope: SubjectRecordsPageEffectScope }) {
 const { subjectId, isAssessment, tab, setIsLoadingRecords, setLoadError, fetchItems, term, fetchScores, getEffectiveWeightsSafe, setItems, setLocalScores, setEffectiveWeights, setWeightsError, setHasLoadedOnce, attempt } = scope;
 useEffect(() => {
    if (!subjectId || !isAssessment || !tab) return;

    let cancelled = false;
    setIsLoadingRecords(true);
    setLoadError(null);

    // IMPORTANT: do NOT filter by `tab` here. AssessmentRecordsSection
    // needs items from ALL THREE components (writtenWorks, performanceTask,
    // exams) in one array — it splits them into column groups itself.
    // Filtering server-side by the single tab this page was opened from
    // silently drops the other two groups' items, which is why Performance
    // Task / Exams appeared to go empty after an edit triggered a refetch.
    Promise.all([
      fetchItems(subjectId, { term: term || undefined }),
      fetchScores(subjectId),
      // subjectId here is a subject-section id (confirmed against the
      // schema: `subject-section`.id, distinct from elem_subjects.id).
      // getEffectiveWeightsSafe resolves the subject_id join server-side,
      // so passing the section id directly here is correct.
      getEffectiveWeightsSafe(Number(subjectId), term || undefined),
    ])
      .then(([freshItems, freshScores, weights]) => {
        if (cancelled) return;
        setItems(freshItems);
        setLocalScores(freshScores);
        setEffectiveWeights(weights);
        setWeightsError(weights ? null : "No grading rules are configured for this subject. Ask an admin to upload the approved grade template before recording grades.");
        setHasLoadedOnce(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load records:", err);
        setLoadError(
          "Could not load the latest records. Showing last known data.",
        );
        setWeightsError("Could not load this subject's grading rules. Grade calculations are unavailable until the rules load successfully.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, isAssessment, tab, term, attempt]);
 return null;
}

export function SubjectRecordsPage() {
 return <SubjectRecordsPageComposition effects={scope => <SubjectRecordsPageDataEffects scope={scope}/>} />;
}

import { useEffect } from "react";
import { SubjectDetailPageComposition,type SubjectDetailPageEffectScope } from "./SubjectDetailPage.loading-view";
import type {
GradeItem,
GradingPeriod,
HolisticMap,
ScoreMap
} from "./types/Grading";
export * from "./SubjectDetailPage.loading-view";

function SubjectDetailPageDataEffects({ scope }: { scope: SubjectDetailPageEffectScope }) {
 const { subjectId, setTemplateLoading, getEffectiveWeightsSafe, selectedTerm, setTemplateStructure, hasUnsavedChanges, attempt, getCachedSubjectDetail, setSubjectName, setGradeLevel, setRoster, setItems, setScores, setHolistic, setHolisticWeekStartDate, setTerms, setSelectedTerm, setIsOwnAdvisory, setAdviserName, setLoading, setError, fetchSubjectSectionInfo, fetchGradingPeriods, fetchItems, fetchScores, fetchHolistic, setCachedSubjectDetail } = scope;
 useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;
    setTemplateLoading(true);
    getEffectiveWeightsSafe(Number(subjectId), selectedTerm || undefined).then((weights) => {
      if (!cancelled) { setTemplateStructure(weights?.templateStructure); setTemplateLoading(false); }
    });
    return () => { cancelled = true; };
  }, [subjectId, selectedTerm]);
useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);
useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;

    const cached = attempt === 0 ? getCachedSubjectDetail(subjectId) : undefined;
    if (cached) {
      setSubjectName(cached.subjectName);
      setGradeLevel(cached.gradeLevel);
      setRoster(cached.roster);
      setItems(cached.items);
      setScores(cached.scores);
      setHolistic(cached.holistic);
      setHolisticWeekStartDate(cached.holisticWeekStartDate);
      setTerms(cached.terms);
      setSelectedTerm(cached.selectedTerm);
      setIsOwnAdvisory(cached.isOwnAdvisory);
      setAdviserName(cached.adviserName);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const loadAll = async () => {
      setLoading(true);
      setError(null);

      const [
        infoResult,
        termsResult,
        itemsResult,
        scoresResult,
        holisticResult,
      ] = await Promise.allSettled([
        fetchSubjectSectionInfo(subjectId),
        fetchGradingPeriods(),
        fetchItems(subjectId, { allPeriods: true }),
        fetchScores(subjectId),
        fetchHolistic(subjectId),
      ]);

      if (cancelled) return;

      if (infoResult.status === "rejected") {
        console.error("Failed to load subject info:", infoResult.reason);
        setError("Failed to load this class. You may not have access to it.");
        setLoading(false);
        return;
      }

      if ([termsResult, itemsResult, scoresResult, holisticResult].some(result => result.status === "rejected")) {
        setError("Could not load the class records. Please try again.");
        setLoading(false);
        return;
      }

      const info = infoResult.value;
      const nextSubjectName = info.subjectName.toUpperCase();
      const nextSubjectCode = `${info.subjectName.replace(/\s+/g, "").toUpperCase().slice(0, 4)}101`;
      const nextGradeLevel = info.gradeLevel;
      const nextRoster = info.roster;
      const nextIsOwnAdvisory = info.isOwnAdvisory;
      const nextAdviserName = info.adviserName;

      setSubjectName(nextSubjectName);
      setGradeLevel(nextGradeLevel);
      setRoster(nextRoster);
      setIsOwnAdvisory(nextIsOwnAdvisory);
      setAdviserName(nextAdviserName);

      let nextTerms: GradingPeriod[] = [];
      let nextSelectedTerm = "";
      if (termsResult.status === "fulfilled") {
        nextTerms = termsResult.value;
        nextSelectedTerm =
          nextTerms.find((t) => t.isActive)?.id ?? nextTerms[0]?.id ?? "";
        setTerms(nextTerms);
        setSelectedTerm(nextSelectedTerm);
      } else {
        console.error("Failed to load grading periods:", termsResult.reason);
      }

      let nextItems: GradeItem[] = [];
      if (itemsResult.status === "fulfilled") {
        nextItems = itemsResult.value;
        setItems(nextItems);
      } else {
        console.error("Failed to load items:", itemsResult.reason);
      }

      let nextScores: ScoreMap = {};
      if (scoresResult.status === "fulfilled") {
        nextScores = scoresResult.value;
        setScores(nextScores);
      } else {
        console.error("Failed to load scores:", scoresResult.reason);
      }

      let nextHolistic: HolisticMap = {};
      let nextHolisticWeekStartDate = "";
      if (holisticResult.status === "fulfilled") {
        nextHolistic = holisticResult.value.data;
        nextHolisticWeekStartDate = holisticResult.value.weekStartDate;
        setHolistic(nextHolistic);
        setHolisticWeekStartDate(nextHolisticWeekStartDate);
      } else {
        console.error(
          "Failed to load holistic ratings:",
          holisticResult.reason,
        );
      }

      if (cancelled) return;

      setCachedSubjectDetail(subjectId, {
        subjectName: nextSubjectName,
        subjectCode: nextSubjectCode,
        subjectCategory: null,
        gradeLevel: nextGradeLevel,
        roster: nextRoster,
        items: nextItems,
        scores: nextScores,
        holistic: nextHolistic,
        holisticWeekStartDate: nextHolisticWeekStartDate,
        terms: nextTerms,
        selectedTerm: nextSelectedTerm,
        isOwnAdvisory: nextIsOwnAdvisory,
        adviserName: nextAdviserName,
      });

      setLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [subjectId, attempt]);
 return null;
}

export function SubjectDetailPage() {
 return <SubjectDetailPageComposition effects={scope => <SubjectDetailPageDataEffects scope={scope}/>} />;
}

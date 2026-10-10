import {
useEffect
} from "react";
import { AddSubjectPageComposition,type AddSubjectPageEffectScope } from "./AddSubjectPage.loading-view";
export * from "./AddSubjectPage.loading-view";

function AddSubjectPageDataEffects({ scope }: { scope: AddSubjectPageEffectScope }) {
 const { setSchoolYearLoading, setSchoolYearError, fetchActiveAcademicYear, setSchoolYear, yearAttempt, loadAssessmentTypes, setName, setIsGraded, setTemplateFile, setTemplateFileName, setTemplatePreview, setTemplateError, gradeLevel } = scope;
 useEffect(() => {
    let cancelled = false;
    setSchoolYearLoading(true); setSchoolYearError(null);
    fetchActiveAcademicYear()
      .then((year) => {
        if (!cancelled) setSchoolYear(year.label);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSchoolYearError(err instanceof Error ? err.message : "Failed to load active school year.");
        }
      }).finally(() => { if (!cancelled) setSchoolYearLoading(false); });
    return () => { cancelled = true; };
  }, [yearAttempt]);
useEffect(() => {
    void loadAssessmentTypes();
  }, [loadAssessmentTypes]);
useEffect(() => {
    setName("");
    setIsGraded(null);
    setTemplateFile(null);
    setTemplateFileName(null);
    setTemplatePreview(null);
    setTemplateError(null);
  }, [gradeLevel]);
 return null;
}

export function AddSubjectPage() {
 return <AddSubjectPageComposition effects={scope => <AddSubjectPageDataEffects scope={scope}/>} />;
}

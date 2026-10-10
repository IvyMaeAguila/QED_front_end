import { useEffect } from "react";
import { SubjectClassListPageComposition,type SubjectClassListPageEffectScope } from "./SubjectClassListPage.loading-view";
export * from "./SubjectClassListPage.loading-view";

function SubjectClassListPageDataEffects({ scope }: { scope: SubjectClassListPageEffectScope }) {
 const { subjectSectionId, setLoading, setError, subjectClassListService, setSubjectName, setGradeLevel, setSectionName, setStudents, attempt } = scope;
 useEffect(() => {
    if (!subjectSectionId) return;
    setLoading(true);
    setError(null);
    subjectClassListService
      .getClassList(Number(subjectSectionId))
      .then((result) => {
        setSubjectName(result.subjectName);
        setGradeLevel(result.gradeLevel);
        setSectionName(result.sectionName);
        setStudents(result.students);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load class list:", err);
        setError("Failed to load this class list.");
      })
      .finally(() => setLoading(false));
  }, [subjectSectionId, attempt]);
 return null;
}

export function SubjectClassListPage() {
 return <SubjectClassListPageComposition effects={scope => <SubjectClassListPageDataEffects scope={scope}/>} />;
}

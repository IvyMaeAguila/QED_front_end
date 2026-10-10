import { useEffect } from "react";
import { SubjectsPageComposition,type SubjectsPageEffectScope } from "./SubjectPage.loading-view";
export * from "./SubjectPage.loading-view";

function SubjectsPageDataEffects({ scope }: { scope: SubjectsPageEffectScope }) {
 const { user, setLoading, setError, assignedSubjectsService, setSubjects, mapToDisplaySubject, refresh } = scope;
 useEffect(() => {
    if (!user?.id) return;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await assignedSubjectsService.getAssignedSubjects();
        setSubjects(rows.map(mapToDisplaySubject));
      } catch (err) {
        console.error("Failed to fetch teacher subjects:", err);
        setError("Failed to load your subjects.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user?.id, refresh]);
 return null;
}

export function SubjectsPage() {
 return <SubjectsPageComposition effects={scope => <SubjectsPageDataEffects scope={scope}/>} />;
}

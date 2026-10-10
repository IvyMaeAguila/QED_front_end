import { useEffect } from "react";
import { ManageSubjectsPageComposition,type ManageSubjectsPageEffectScope } from "./ManageSubjectsPage.loading-view";
export * from "./ManageSubjectsPage.loading-view";

function ManageSubjectsPageDataEffects({ scope }: { scope: ManageSubjectsPageEffectScope }) {
 const { activeGrade, GRADE_LEVELS, loadSubjectsForGrade } = scope;
 useEffect(() => {
    if (activeGrade === "all") {
      GRADE_LEVELS.forEach((g) => void loadSubjectsForGrade(g));
    } else {
      void loadSubjectsForGrade(activeGrade);
    }
  }, [activeGrade, loadSubjectsForGrade]);
 return null;
}

export function ManageSubjectsPage() {
 return <ManageSubjectsPageComposition effects={scope => <ManageSubjectsPageDataEffects scope={scope}/>} />;
}

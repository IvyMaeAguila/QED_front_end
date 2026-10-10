import { useEffect } from "react";
import { AcademicYearPageComposition,type AcademicYearPageEffectScope } from "./AcademicYearPage.loading-view";
export * from "./AcademicYearPage.loading-view";

function AcademicYearPageDataEffects({ scope }: { scope: AcademicYearPageEffectScope }) {
 const { loadAcademicYear } = scope;
 useEffect(() => {
    void loadAcademicYear();
  }, [loadAcademicYear]);
 return null;
}

export function AcademicYearPage() {
 return <AcademicYearPageComposition effects={scope => <AcademicYearPageDataEffects scope={scope}/>} />;
}

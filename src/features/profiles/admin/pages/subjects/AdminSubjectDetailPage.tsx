import { useEffect } from "react";
import { AdminSubjectDetailPageComposition,type AdminSubjectDetailPageEffectScope } from "./AdminSubjectDetailPage.loading-view";
export * from "./AdminSubjectDetailPage.loading-view";

function AdminSubjectDetailPageDataEffects({ scope }: { scope: AdminSubjectDetailPageEffectScope }) {
 const { numericSubjectId, setLoadingTemplate, setTemplateError, getActiveGradeTemplate, setActiveTemplate, attempt } = scope;
 useEffect(() => {
    if (!numericSubjectId) return;
    let cancelled = false;
    setLoadingTemplate(true);
    setTemplateError(null);
    getActiveGradeTemplate(numericSubjectId)
      .then(template => { if (!cancelled) setActiveTemplate(template); })
      .catch((err) => {
        if (!cancelled) setTemplateError(err instanceof Error ? err.message : "Failed to load active grade template.");
      })
      .finally(() => { if (!cancelled) setLoadingTemplate(false); });
    return () => { cancelled = true; };
  }, [numericSubjectId, attempt]);
 return null;
}

export function AdminSubjectDetailPage() {
 return <AdminSubjectDetailPageComposition effects={scope => <AdminSubjectDetailPageDataEffects scope={scope}/>} />;
}

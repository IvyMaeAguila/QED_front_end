import { useEffect } from "react";
import { StudentHolisticProfilePageComposition,type StudentHolisticProfilePageEffectScope } from "./StudentHolisticProfilePage.loading-view";
export * from "./StudentHolisticProfilePage.loading-view";

function StudentHolisticProfilePageDataEffects({ scope }: { scope: StudentHolisticProfilePageEffectScope }) {
 const { termNumber, termsAttempt, setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTermNumber, studentId, setLoading, setError, fetchStudentHolisticProfile, setProfile, attempt } = scope;
 useEffect(() => {
    if (termNumber !== null && termsAttempt === 0) return;
    let cancelled = false; setTermsLoading(true); setTermsError(null);
    fetchGradingPeriodsGlobal().then(data => {
      if (!cancelled) setTermNumber(data.find(term => term.isActive)?.termNumber ?? data[0]?.termNumber ?? 1);
    }).catch(error => { if (!cancelled) { setTermsError(error instanceof Error ? error.message : "Failed to load terms."); setTermNumber(1); } })
      .finally(() => { if (!cancelled) setTermsLoading(false); });
    return () => { cancelled = true; };
  }, [termsAttempt]);
useEffect(() => {
    if (!studentId || termNumber === null) return;
    let cancelled = false; setLoading(true); setError(null);
    fetchStudentHolisticProfile(studentId, termNumber).then(data => { if (!cancelled) setProfile(data); })
      .catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : "Failed to load profile."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId, termNumber, attempt]);
 return null;
}

export function StudentHolisticProfilePage() {
 return <StudentHolisticProfilePageComposition effects={scope => <StudentHolisticProfilePageDataEffects scope={scope}/>} />;
}

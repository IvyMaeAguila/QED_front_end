import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { useTeacherReader } from "../../query/useTeacherReader";
import { useTeacherRetryAttempt } from "../../query/useTeacherRetryAttempt";
import { TeacherAdvisoryQueries } from "../../query/TeacherAdvisoryQueries";
import { TeacherSessionBoundary } from "../../query/TeacherSessionBoundary";
import { fetchGradingPeriodsGlobal, fetchHolisticOverview, type HolisticOverviewStudent, type GradingPeriod } from "./services/holistic.service";
import { HolisticOverviewPageComposition,type HolisticOverviewPageEffectScope } from "./HolisticOverviewPage.loading-view";
export { HolisticOverviewPageComposition } from "./HolisticOverviewPage.loading-view";
export type { HolisticOverviewPageEffectScope, HolisticOverviewPageRouteProps } from "./HolisticOverviewPage.loading-view";
const emptyStudents: HolisticOverviewStudent[] = [];
const emptyTerms: GradingPeriod[] = [];
const message = (error: unknown) => error instanceof Error ? error.message : "Request failed.";

function HolisticOverviewPageDataEffects({ scope }: { scope: HolisticOverviewPageEffectScope }) {
 const { setTermsLoading,setTermsError,setTerms,setSelectedTerm,termsAttempt,selectedTerm,setLoading,setOverviewError,setStudents,overviewAttempt }=scope;
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,message);
 const year=periods.data?.[0]?.schoolYearId ?? 'active';
 const overview=useTeacherReader(['holistic','overview',year,selectedTerm],options=>fetchHolisticOverview(selectedTerm!,options),message,30_000,selectedTerm!==null&&!periods.loading&&!periods.error);
 useTeacherRetryAttempt(termsAttempt,periods.retry);useTeacherRetryAttempt(overviewAttempt,overview.retry);
 useEffect(()=>{
  setTermsLoading(periods.loading);setTermsError(periods.error);setTerms(periods.data??emptyTerms);
  if(periods.data)setSelectedTerm(previous=>previous??periods.data!.find(term=>term.isActive)?.termNumber??periods.data![0]?.termNumber??1);
 },[periods.data,periods.loading,periods.error,setTermsLoading,setTermsError,setTerms,setSelectedTerm]);
 useEffect(()=>{setLoading(overview.loading);setOverviewError(overview.error);if(!overview.loading)setStudents(overview.data??emptyStudents);},[overview.data,overview.loading,overview.error,setLoading,setOverviewError,setStudents]);
 return null;
}

export function HolisticOverviewPage() {
 return <TeacherSessionBoundary><QueryClientProvider client={queryClient}><TeacherAdvisoryQueries><HolisticOverviewPageComposition effects={scope => <HolisticOverviewPageDataEffects scope={scope}/>} /></TeacherAdvisoryQueries></QueryClientProvider></TeacherSessionBoundary>;
}

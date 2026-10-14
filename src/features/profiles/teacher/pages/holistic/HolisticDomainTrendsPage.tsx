import { useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { useTeacherReader } from "../../query/useTeacherReader";
import { useTeacherRetryAttempt } from "../../query/useTeacherRetryAttempt";
import { TeacherAdvisoryQueries } from "../../query/TeacherAdvisoryQueries";
import { TeacherSessionBoundary } from "../../query/TeacherSessionBoundary";
import { fetchGradingPeriodsGlobal, type GradingPeriod } from "./services/holistic.service";
import { fetchDomainTrendsSections } from "./services/holisticTrends.service";
import { HolisticDomainTrendsPageComposition,type HolisticDomainTrendsPageEffectScope } from "./HolisticDomainTrendsPage.loading-view";
export { HolisticDomainTrendsPageComposition } from "./HolisticDomainTrendsPage.loading-view";
export type { HolisticDomainTrendsPageEffectScope, HolisticDomainTrendsPageRouteProps } from "./HolisticDomainTrendsPage.loading-view";
const emptyTerms: GradingPeriod[]=[];
const message=(error:unknown)=>error instanceof Error?error.message:'Request failed.';

function HolisticDomainTrendsPageDataEffects({ scope }: { scope: HolisticDomainTrendsPageEffectScope }) {
 const {setTermsLoading,setTermsError,setTerms,setSelectedTerm,termsAttempt,selectedTerm,section,setSearchParams,setTrendsLoading,setTrendsError,setTrendsData,setActiveTab,trendsAttempt}=scope;
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,message);
 const trends=useTeacherReader(['holistic','domain-trends',periods.data?.[0]?.schoolYearId??'active',selectedTerm],options=>fetchDomainTrendsSections(selectedTerm!,options),message,30_000,selectedTerm!==null&&!!section&&!periods.loading&&!periods.error);
 const classId=section?.classId;
 const data=useMemo(()=>{
  if(!trends.data||selectedTerm===null||!classId)return null;
  const match=trends.data.find(item=>item.classId===classId);
  return {termNumber:selectedTerm,subjects:match?.subjects??[],overallWeeks:match?.overallWeeks??[]};
 },[trends.data,selectedTerm,classId]);
 useTeacherRetryAttempt(termsAttempt,periods.retry);useTeacherRetryAttempt(trendsAttempt,trends.retry);
 useEffect(()=>{
  setTermsLoading(periods.loading);setTermsError(periods.error);setTerms(periods.data??emptyTerms);
  if(periods.data)setSelectedTerm(previous=>previous??periods.data!.find(term=>term.isActive)?.termNumber??periods.data![0]?.termNumber??1);
 },[periods.data,periods.loading,periods.error,setTermsLoading,setTermsError,setTerms,setSelectedTerm]);
 useEffect(()=>{
  if(selectedTerm===null||!classId)return;
  setSearchParams(previous=>{const next=new URLSearchParams(previous);next.set('term',String(selectedTerm));return next;},{replace:true});
 },[selectedTerm,classId,setSearchParams]);
 useEffect(()=>{
  setTrendsLoading(trends.loading);setTrendsError(trends.error);
  if(!trends.loading){setTrendsData(data);if(data)setActiveTab(previous=>previous==='overall'||data.subjects.some(subject=>subject.subjectSectionId===previous)?previous:'overall');}
 },[data,trends.loading,trends.error,setTrendsLoading,setTrendsError,setTrendsData,setActiveTab]);
 return null;
}

export function HolisticDomainTrendsPage() {
 return <TeacherSessionBoundary><QueryClientProvider client={queryClient}><TeacherAdvisoryQueries><HolisticDomainTrendsPageComposition effects={scope => <HolisticDomainTrendsPageDataEffects scope={scope}/>} /></TeacherAdvisoryQueries></QueryClientProvider></TeacherSessionBoundary>;
}

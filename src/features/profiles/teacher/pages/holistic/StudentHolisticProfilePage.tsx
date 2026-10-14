import {useParams} from 'react-router-dom';
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { useTeacherReader } from "../../query/useTeacherReader";
import { useTeacherRetryAttempt } from "../../query/useTeacherRetryAttempt";
import { TeacherSessionBoundary } from "../../query/TeacherSessionBoundary";
import { fetchGradingPeriodsGlobal,fetchStudentHolisticProfile } from "./services/holistic.service";
import { StudentHolisticProfilePageComposition,type StudentHolisticProfilePageEffectScope } from "./StudentHolisticProfilePage.loading-view";
export { StudentHolisticProfilePageComposition } from "./StudentHolisticProfilePage.loading-view";
export type { StudentHolisticProfilePageEffectScope, StudentHolisticProfilePageRouteProps } from "./StudentHolisticProfilePage.loading-view";
const message=(error:unknown)=>error instanceof Error?error.message:'Request failed.';

function StudentHolisticProfilePageDataEffects({ scope }: { scope: StudentHolisticProfilePageEffectScope }) {
 const {termNumber,termsAttempt,setTermsLoading,setTermsError,setTermNumber,studentId,setLoading,setError,setProfile,attempt}=scope;
 // Resolve the active year even with an explicit term; share metadata with the
 // other holistic pages instead of caching an active-year response under an old ID.
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,message);
 const profile=useTeacherReader(['holistic','profile',periods.data?.[0]?.schoolYearId??'active',studentId,termNumber],options=>fetchStudentHolisticProfile(studentId!,termNumber!,options),message,30_000,!!studentId&&termNumber!==null&&!periods.loading);
 useTeacherRetryAttempt(termsAttempt,periods.retry);useTeacherRetryAttempt(attempt,profile.retry);
 useEffect(()=>{
  setTermsLoading(periods.loading);setTermsError(periods.error);
  if(periods.data)setTermNumber(previous=>previous??periods.data!.find(term=>term.isActive)?.termNumber??periods.data![0]?.termNumber??1);
  else if(periods.error)setTermNumber(previous=>previous??1); // Preserve the metadata-failure fallback and explicit URL term.
 },[periods.data,periods.loading,periods.error,setTermsLoading,setTermsError,setTermNumber]);
 useEffect(()=>{setLoading(profile.loading);setError(profile.error);if(!profile.loading)setProfile(profile.data??null);},[profile.data,profile.loading,profile.error,setLoading,setError,setProfile]);
 return null;
}

export function StudentHolisticProfilePage() {
 const {studentId}=useParams();
 return <TeacherSessionBoundary resource={studentId}><QueryClientProvider client={queryClient}><StudentHolisticProfilePageComposition effects={scope => <StudentHolisticProfilePageDataEffects scope={scope}/>} /></QueryClientProvider></TeacherSessionBoundary>;
}

import {useReadFreshness} from '@shared/query/readFreshness';
import {useTeacherQueryScope} from '../../query/teacherQueryScope';
import {useEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useTeacherReader} from '../../query/useTeacherReader';
import {useTeacherRetryAttempt} from '../../query/useTeacherRetryAttempt';
import {TeacherSessionBoundary} from '../../query/TeacherSessionBoundary';
import {TeacherGradeQueries} from '../../query/TeacherGradeQueries';
import {advisoryGradeKey} from '../../query/teacherGradeKeys';
import {fetchGradingPeriodsGlobal} from '../holistic/services/holistic.service';
import * as api from './services/gradePage.service';
import {GradesPageComposition,type GradesPageEffectScope} from './GradePage.loading-view';
export {GradesPageComposition} from './GradePage.loading-view';
export type {GradesPageEffectScope,GradesPageRouteProps} from './GradePage.loading-view';
const message=(e:unknown)=>e instanceof Error?e.message:'Request failed.';
const emptyLogs:api.GradeSubmissionLog[]=[];
function Effects({scope:s}:{scope:GradesPageEffectScope}){
 const owner=useTeacherQueryScope();
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,message,30_000,true,true);
 const sections=useTeacherReader(['advisory-grades','sections'],api.fetchAdvisorySections,message,30_000,true,true);
 const ready=!!s.selectedTermId&&!!s.selectedClassId&&!periods.loading&&!sections.loading&&!periods.error&&!sections.error&&!!periods.data?.some(p=>p.id===s.selectedTermId)&&!!sections.data?.some(c=>c.classId===s.selectedClassId);
 const key=(resource:string)=>advisoryGradeKey(periods.data?.[0]?.schoolYearId??'active',s.selectedTermId,s.selectedClassId,resource);
 const book=useTeacherReader(key('gradebook'),o=>api.fetchAdvisoryGradebook(s.selectedTermId,s.selectedClassId,o),'Failed to load grade records for this term.',30_000,ready,true);
 const logs=useTeacherReader(key('history'),o=>api.fetchClassSubmissionLogs(s.selectedTermId,s.selectedClassId,o),message,30_000,ready,true);
 const status=useTeacherReader(key('submission'),o=>api.fetchClassSubmissionStatus(s.selectedTermId,s.selectedClassId,o),message,30_000,ready,true);
 useReadFreshness(JSON.stringify([...owner.key,'advisory-read',s.selectedTermId,s.selectedClassId]),owner.enabled&&!!s.selectedTermId&&!!s.selectedClassId&&s.activeTab!=='visibility'&&!s.submitting,async signal=>{
  if(!ready||queryClient.isMutating()||[periods,sections,book,status].some(r=>r.refreshing))return;
  const [nextPeriods,nextSections]=await Promise.all([periods.refresh(),sections.refresh()]);
  if(signal.aborted||queryClient.isMutating()||!nextPeriods?.isSuccess||!nextSections?.isSuccess)return;
  if((nextPeriods.data[0]?.schoolYearId??'active')!==(periods.data?.[0]?.schoolYearId??'active')||!nextPeriods.data.some(p=>p.id===s.selectedTermId)||!nextSections.data.some(c=>c.classId===s.selectedClassId))return;
  // History GET initializes a table; keep its existing initial/manual owner.
  await Promise.all([book.refresh(),status.refresh()]);
 });
 useTeacherRetryAttempt(s.attempt,periods.retry);useTeacherRetryAttempt(s.attempt,sections.retry);useTeacherRetryAttempt(s.attempt,book.retry);useTeacherRetryAttempt(s.attempt,logs.retry);useTeacherRetryAttempt(s.attempt,status.retry);
 useTeacherRetryAttempt(s.logsAttempt,logs.retry);useTeacherRetryAttempt(s.statusAttempt,status.retry);
 const {setTermsLoading,setSectionsLoading,setMetadataError,setTerms,setSelectedTermId,setSections,setSelectedClassId,setGradebookLoading,setGradebookError,setGradebook,setLogsLoading,setLogsError,setSubmissionLogs,setStatusLoading,setStatusError,setSubmitted,setSubmittedAt}=s;
 useEffect(()=>{
  setTermsLoading(periods.loading);setSectionsLoading(sections.loading);setMetadataError(periods.error??sections.error);
  if(periods.data){setTerms(periods.data.map(p=>({...p,label:p.termLabel})));setSelectedTermId(previous=>periods.data!.some(p=>p.id===previous)?previous:(periods.data!.find(p=>p.isActive)??periods.data![0])?.id??'');}
  if(sections.data){setSections(sections.data);setSelectedClassId(previous=>sections.data!.some(p=>p.classId===previous)?previous:sections.data![0]?.classId??'');}
 },[periods.data,periods.loading,periods.error,sections.data,sections.loading,sections.error,setTermsLoading,setSectionsLoading,setMetadataError,setTerms,setSelectedTermId,setSections,setSelectedClassId]);
 useEffect(()=>{setGradebookLoading(ready?book.loading:periods.loading||sections.loading);setGradebookError(book.error);if(!book.loading)setGradebook(book.data??null);},[book.data,book.loading,book.error,ready,periods.loading,sections.loading,setGradebookLoading,setGradebookError,setGradebook]);
 useEffect(()=>{setLogsLoading(ready?logs.loading:periods.loading||sections.loading);setLogsError(logs.error);if(!logs.loading)setSubmissionLogs(logs.data??emptyLogs);},[logs.data,logs.loading,logs.error,ready,periods.loading,sections.loading,setLogsLoading,setLogsError,setSubmissionLogs]);
 useEffect(()=>{setStatusLoading(ready?status.loading:periods.loading||sections.loading);setStatusError(status.error);if(!status.loading){setSubmitted(status.data?.submitted??false);setSubmittedAt(status.data?.submittedAt??null);}},[status.data,status.loading,status.error,ready,periods.loading,sections.loading,setStatusLoading,setStatusError,setSubmitted,setSubmittedAt]);
 const {gradebook,gradebookLoading,rememberRows}=s;
 useEffect(()=>{if(gradebook&&!gradebookLoading)rememberRows('teacher-grades-subjects',gradebook.subjects.length);},[gradebook,gradebookLoading,rememberRows]);
 return null;
}
export function GradesPage(){return <TeacherSessionBoundary><QueryClientProvider client={queryClient}><TeacherGradeQueries><GradesPageComposition effects={scope=><Effects scope={scope}/>}/></TeacherGradeQueries></QueryClientProvider></TeacherSessionBoundary>;}

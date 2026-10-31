import {useContext,useEffect,useLayoutEffect,useRef} from 'react';
import {useParams} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {TeacherSessionBoundary} from '../../../query/TeacherSessionBoundary';
import {TeacherAcademicQueries} from '../../../query/TeacherAcademicQueries';
import {TeacherAcademicQueryContext} from '../../../query/TeacherAcademicQueryContext';
import {useTeacherReader} from '../../../query/useTeacherReader';
import {useTeacherRetryAttempt} from '../../../query/useTeacherRetryAttempt';
import {subjectKey,currentSchoolWeek} from '../../../query/teacherSubjectKeys';
import {useTeacherQueryInvalidation} from '../../../query/useTeacherQueryInvalidation';
import {useTeacherQueryScope} from '../../../query/teacherQueryScope';
import * as api from '../services/subjectGrading.service';
import {getEffectiveWeightsSafe} from '../services/subjectGradeTemplate.service';
import {SubjectDetailPageComposition,type SubjectDetailPageEffectScope} from './SubjectDetailPage.loading-view';
export {SubjectDetailPageComposition} from './SubjectDetailPage.loading-view';
export type {SubjectDetailPageEffectScope,SubjectDetailPageRouteProps} from './SubjectDetailPage.loading-view';
const emptyItems:import('./types/Grading').GradeItem[]=[];
const emptyScores:import('./types/Grading').ScoreMap={};
const emptyHolistic:import('./types/Grading').HolisticMap={};
const emptyRoster:import('./data').RosterStudent[]=[];
function Effects({scope:s}:{scope:SubjectDetailPageEffectScope}){
 const port=useContext(TeacherAcademicQueryContext)!;
 const lastApplied=useRef<unknown[]>([]);
 const session=useTeacherQueryScope();
 const {periods,info}=port,year=periods.data?.[0]?.schoolYearId??'active',id=s.subjectId??'';
 const ready=!!id&&!periods.loading&&!periods.error&&!info.loading&&!info.error;
 const graded=info.data?.isGraded!==false;
 const items=useTeacherReader(subjectKey(year,id,'items',{allPeriods:true}),o=>api.fetchItems(id,{allPeriods:true},o),'Could not load the class records. Please try again.',300_000,ready&&graded,false,true);
 const scores=useTeacherReader(subjectKey(year,id,'scores'),o=>api.fetchScores(id,o),'Could not load the class records. Please try again.',300_000,ready&&graded);
 const holistic=useTeacherReader(subjectKey(year,id,'holistic','current',currentSchoolWeek()),o=>api.fetchHolistic(id,o),'Could not load the class records. Please try again.',300_000,ready);
 const weights=useTeacherReader(subjectKey(year,id,'weights',s.selectedTerm||'active'),o=>getEffectiveWeightsSafe(Number(id),s.selectedTerm||undefined,o),'Could not load grading rules.',300_000,ready&&graded&&!!s.selectedTerm);
 useTeacherRetryAttempt(s.attempt,periods.retry);useTeacherRetryAttempt(s.attempt,info.retry);useTeacherRetryAttempt(s.attempt,items.retry);useTeacherRetryAttempt(s.attempt,scores.retry);useTeacherRetryAttempt(s.attempt,holistic.retry);useTeacherRetryAttempt(s.attempt,weights.retry);
 const {setTemplateLoading,setTemplateStructure,setTerms,setSelectedTerm,setSubjectName,setGradeLevel,setRoster,setItems,setScores,setHolistic,setHolisticWeekStartDate,setIsOwnAdvisory,setAdviserName,setLoading,setError,hasUnsavedChanges}=s;
 useLayoutEffect(()=>{s.setGradingRules({period:s.selectedTerm,loading:weights.loading,error:weights.error,configured:!!weights.data});},[s.selectedTerm,weights.loading,weights.error,weights.data,s.setGradingRules]);
 useEffect(()=>{setTemplateLoading(weights.loading);setTemplateStructure(weights.data?.templateStructure);},[weights.loading,weights.data,setTemplateLoading,setTemplateStructure]);
 useEffect(()=>{if(periods.data){setTerms(periods.data.map(p=>({...p,label:p.termLabel})));setSelectedTerm(previous=>periods.data!.some(p=>p.id===previous)?previous:(periods.data!.find(p=>p.isActive)??periods.data![0])?.id??'');}},[periods.data,setTerms,setSelectedTerm]);
 const error=periods.error??info.error??(graded?(items.error??scores.error):null)??holistic.error;
 // Publish one complete score-sheet snapshot, including the rules that determine
 // its available assessment controls. Do not expose the roster while rules load.
 const waitingForTerm=!!periods.data?.length&&!s.selectedTerm;
 const loading=!error&&(periods.loading||info.loading||(graded&&(items.loading||scores.loading))||holistic.loading||waitingForTerm||(ready&&graded&&!!s.selectedTerm&&weights.loading));
 const itemKey=[...session.key,...subjectKey(year,id,'items',{allPeriods:true})],scoreKey=[...session.key,...subjectKey(year,id,'scores')];
 const itemsInvalidated=useTeacherQueryInvalidation(itemKey),scoresInvalidated=useTeacherQueryInvalidation(scoreKey);
 const invalidated=itemsInvalidated||scoresInvalidated;
 useEffect(()=>{
  setLoading(loading);setError(error);
  if(loading)return;
  // Never replace a local score draft or a confirmed local save with a stale cache projection.
  if(!error&&(hasUnsavedChanges||invalidated||port.writing))return;
  const projection=[info.data,items.data,scores.data,holistic.data];
  if(!error&&projection.every((value,index)=>value===lastApplied.current[index]))return;
  lastApplied.current=projection;
  setSubjectName(info.data?.subjectName.toUpperCase()??'');setGradeLevel(info.data?.gradeLevel??'');
  setRoster(error?emptyRoster:info.data?.roster??emptyRoster);setIsOwnAdvisory(info.data?.isOwnAdvisory??false);setAdviserName(info.data?.adviserName??null);
  setItems(error?emptyItems:items.data??emptyItems);setScores(error?emptyScores:scores.data??emptyScores);setHolistic(error?emptyHolistic:holistic.data?.data??emptyHolistic);setHolisticWeekStartDate(holistic.data?.weekStartDate??'');
 },[loading,error,info.data,items.data,scores.data,holistic.data,hasUnsavedChanges,invalidated,port.writing,setLoading,setError,setSubjectName,setGradeLevel,setRoster,setItems,setScores,setHolistic,setHolisticWeekStartDate,setIsOwnAdvisory,setAdviserName]);
 useEffect(()=>{if(!hasUnsavedChanges)return;const handler=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[hasUnsavedChanges]);
 return null;
}
export function SubjectDetailPage(){const {subjectId}=useParams();return <TeacherSessionBoundary resource={subjectId}><QueryClientProvider client={queryClient}><TeacherAcademicQueries><SubjectDetailPageComposition effects={scope=><Effects scope={scope}/>}/></TeacherAcademicQueries></QueryClientProvider></TeacherSessionBoundary>;}

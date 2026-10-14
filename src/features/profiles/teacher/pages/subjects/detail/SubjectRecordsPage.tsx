import {useContext,useEffect,useRef} from 'react';
import {useParams} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {TeacherSessionBoundary} from '../../../query/TeacherSessionBoundary';
import {TeacherAcademicQueries} from '../../../query/TeacherAcademicQueries';
import {TeacherAcademicQueryContext} from '../../../query/TeacherAcademicQueryContext';
import {useTeacherReader} from '../../../query/useTeacherReader';
import {useTeacherRetryAttempt} from '../../../query/useTeacherRetryAttempt';
import {subjectKey} from '../../../query/teacherSubjectKeys';
import {useTeacherQueryInvalidation} from '../../../query/useTeacherQueryInvalidation';
import {useTeacherQueryScope} from '../../../query/teacherQueryScope';
import * as api from '../services/subjectGrading.service';
import {getEffectiveWeightsSafe} from '../services/subjectGradeTemplate.service';
import {SubjectRecordsPageComposition,type SubjectRecordsPageEffectScope} from './SubjectRecordsPage.loading-view';
export {SubjectRecordsPageComposition} from './SubjectRecordsPage.loading-view';
export type {SubjectRecordsPageEffectScope,SubjectRecordsPageRouteProps} from './SubjectRecordsPage.loading-view';
const emptyItems:import('./types/Grading').GradeItem[]=[];
const emptyScores:import('./types/Grading').ScoreMap={};
function Effects({scope:s}:{scope:SubjectRecordsPageEffectScope}){
 const academic=useContext(TeacherAcademicQueryContext)!;
 const {periods,info}=academic;
 const session=useTeacherQueryScope();
 const lastApplied=useRef<unknown[]>([]);
 const id=s.subjectId??'',year=periods.data?.[0]?.schoolYearId??'active';
 const ready=!!id&&s.isAssessment&&!!s.tab&&!periods.loading&&!periods.error&&!info.loading&&!info.error;
 const items=useTeacherReader(subjectKey(year,id,'items',{term:s.term||undefined}),o=>api.fetchItems(id,{term:s.term||undefined},o),'Could not load the latest records. Showing last known data.',30_000,ready);
 const scores=useTeacherReader(subjectKey(year,id,'scores'),o=>api.fetchScores(id,o),'Could not load the latest records. Showing last known data.',30_000,ready);
 const weights=useTeacherReader(subjectKey(year,id,'weights',s.term||'active'),async o=>(await getEffectiveWeightsSafe(Number(id),s.term||undefined,o))??null,'Could not load grading rules.',300_000,ready);
 useTeacherRetryAttempt(s.attempt,periods.retry);useTeacherRetryAttempt(s.attempt,info.retry);useTeacherRetryAttempt(s.attempt,items.retry);useTeacherRetryAttempt(s.attempt,scores.retry);useTeacherRetryAttempt(s.attempt,weights.retry);
 const {setIsLoadingRecords,setLoadError,setItems,setLocalScores,setEffectiveWeights,setWeightsError,setHasLoadedOnce,setTerm,term}=s;
 useEffect(()=>{if(periods.data?.length&&!periods.data.some(p=>p.id===term))setTerm((periods.data.find(p=>p.isActive)??periods.data[0]).id);},[periods.data,term,setTerm]);
 const error=periods.error??info.error??items.error??scores.error??weights.error;
 const invalidated=useTeacherQueryInvalidation([...session.key,...subjectKey(year,id,'scores')]);
 const loading=!error&&(periods.loading||info.loading||items.loading||scores.loading||weights.loading);
 useEffect(()=>{
  if(!s.isAssessment)return;
  setIsLoadingRecords(loading);setLoadError(error);
  if(loading)return;
  if(error){setItems(emptyItems);setLocalScores(emptyScores);setEffectiveWeights(undefined);setWeightsError("Could not load this subject's grading rules. Grade calculations are unavailable until the rules load successfully.");return;}
  const projection=[items.data,scores.data,weights.data];
  if(s.isEditing||academic.writing||invalidated||projection.every((value,index)=>value===lastApplied.current[index]))return;
  lastApplied.current=projection;
  setItems(items.data??emptyItems);setLocalScores(scores.data??emptyScores);setEffectiveWeights(weights.data??undefined);setWeightsError(weights.data?null:'No grading rules are configured for this subject. Ask an admin to upload the approved grade template before recording grades.');setHasLoadedOnce(true);
 },[s.isAssessment,s.isEditing,academic.writing,invalidated,loading,error,items.data,scores.data,weights.data,setIsLoadingRecords,setLoadError,setItems,setLocalScores,setEffectiveWeights,setWeightsError,setHasLoadedOnce]);
 return null;
}
export function SubjectRecordsPage(){const {subjectId}=useParams();return <TeacherSessionBoundary resource={subjectId}><QueryClientProvider client={queryClient}><TeacherAcademicQueries><SubjectRecordsPageComposition effects={scope=><Effects scope={scope}/>}/></TeacherAcademicQueries></QueryClientProvider></TeacherSessionBoundary>;}

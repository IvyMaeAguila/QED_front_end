import {removeItemScores} from './subjectScoreCache';
import {confirmedSubmission} from './teacherSubmissionRecovery';
import {useEffect,useRef,useContext,type ReactNode} from 'react';
import {useParams} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import {useTeacherQueryInvalidation} from './useTeacherQueryInvalidation';
import {useTeacherReader} from './useTeacherReader';
import {useTeacherQueryScope,type TeacherRequestOptions} from './teacherQueryScope';
import {useTeacherRetryAttempt} from './useTeacherRetryAttempt';
import {TeacherAcademicQueryContext,type TopicScope,type WeeklyScope,type GradingPort,type HolisticPort} from './TeacherAcademicQueryContext';
import {subjectKey,currentSchoolWeek} from './teacherSubjectKeys';
import * as grading from '../pages/subjects/services/subjectGrading.service';
import * as holistic from '../pages/holistic/services/holistic.service';
const errorMessage=(e:unknown)=>e instanceof Error?e.message:'Request failed.';
const emptyTopics:grading.Topic[]=[];
const emptyPeriods:holistic.GradingPeriod[]=[];
const emptyWeekly:holistic.HolisticWeeklyMap={};
// A route remount must not turn an old uncertain action into another write.
// A full reload resets this fence and reads authoritative scores first.
const scoreWriteFences=new Set<string>();
function TopicsEffects({subjectId,enabled,setTopics,setLoading,setError,setNewTopicMode,onTopicsChanged}:TopicScope){
 const periods=useTeacherReader(['grading-periods','active'],holistic.fetchGradingPeriodsGlobal,errorMessage);
 const reader=useTeacherReader(subjectKey(periods.data?.[0]?.schoolYearId??'active',subjectId,'topics'),o=>grading.fetchTopics(subjectId,o),'Failed to load topics.',30_000,enabled&&!periods.loading&&!periods.error);
 useEffect(()=>{
  setLoading(enabled?reader.loading:false);setError(reader.error??periods.error);
  if(!reader.loading){const topics=reader.data??emptyTopics;setTopics(topics);onTopicsChanged?.(topics);if(topics.length===0)setNewTopicMode?.(true);}
 },[reader.loading,reader.error,reader.data,periods.error,enabled,setTopics,setLoading,setError,setNewTopicMode,onTopicsChanged]);
 return null;
}
function WeeklyEffects({subjectId,termNumber,periodId,attempt,editing,setData,setLoading,setError,setPeriods,setPeriodsLoaded,setPeriodError}:WeeklyScope){
 const academic=useContext(TeacherAcademicQueryContext)!;
 const scope=useTeacherQueryScope();
 const lastApplied=useRef<unknown>(undefined);
 const periods=useTeacherReader(['grading-periods','active'],holistic.fetchGradingPeriodsGlobal,errorMessage);
 const reader=useTeacherReader(subjectKey(periods.data?.[0]?.schoolYearId??'active',subjectId,'weekly-holistic',termNumber??'active',periodId??'active',currentSchoolWeek()),o=>holistic.fetchHolisticWeekly(subjectId,termNumber,o),"Couldn't load holistic records. Try refreshing.",30_000,!periods.loading&&!periods.error&&termNumber!==undefined);
 useTeacherRetryAttempt(attempt,periods.retry);useTeacherRetryAttempt(attempt,reader.retry);
 useEffect(()=>{setPeriods(periods.data??emptyPeriods);setPeriodsLoaded(!periods.loading);setPeriodError(periods.error);},[periods.data,periods.loading,periods.error,setPeriods,setPeriodsLoaded,setPeriodError]);
 const invalidated=useTeacherQueryInvalidation([...scope.key,...subjectKey(periods.data?.[0]?.schoolYearId??'active',subjectId,'weekly-holistic',termNumber??'active',periodId??'active',currentSchoolWeek())]);
 useEffect(()=>{setLoading(reader.loading);setError(reader.error);if(reader.loading)return;if(!reader.error&&(editing||academic.writing||invalidated||lastApplied.current===reader.data))return;lastApplied.current=reader.data;setData(reader.data?.data??emptyWeekly);},[reader.data,reader.loading,reader.error,editing,academic.writing,invalidated,setData,setLoading,setError]);
 return null;
}
type Operation={run:()=>Promise<unknown>;keys:readonly (readonly unknown[])[];allowed:boolean};
export function TeacherAcademicQueries({children}:{children:ReactNode}){
 const scoreOwner=useRef(true);
 useEffect(()=>{scoreOwner.current=true;return()=>{scoreOwner.current=false;};},[]);
 const scoreChain=useRef<Promise<unknown>>(Promise.resolve());
 const confirmedScores=useRef(new Map<string,number|null>());
 const {subjectId=''}=useParams();
 const scope=useTeacherQueryScope();
 const periods=useTeacherReader(['grading-periods','active'],holistic.fetchGradingPeriodsGlobal,errorMessage);
 const year=periods.data?.[0]?.schoolYearId??'active';
 const info=useTeacherReader(subjectKey(year,subjectId,'info'),o=>grading.fetchSubjectSectionInfo(subjectId,o),'Failed to load this class. You may not have access to it.',300_000,!!subjectId&&!periods.loading&&!periods.error);
 const mutation=useMutation({retry:false,networkMode:'always',mutationFn:async({run,allowed}:Operation)=>{
  if(!allowed)throw new Error("You're offline or your session is not ready.");return run();
 },onSuccess:(_data,{keys})=>{keys.forEach(key=>{void queryClient.invalidateQueries({queryKey:key,refetchType:'none'});});}});
 const write=<T,>(run:(request:TeacherRequestOptions)=>Promise<T>,resources:readonly (readonly unknown[])[])=>{
  const request=scope.mutationRequest(new AbortController().signal);
  return mutation.mutateAsync({run:()=>run(request),allowed:scope.enabled&&scope.online,keys:resources.map(key=>[...scope.key,...key])}) as Promise<T>;
 };
 const read=<T,>(resource:readonly unknown[],fetcher:(request:TeacherRequestOptions)=>Promise<T>,staleTime=30_000)=>{
  const key=[...scope.key,...resource];
  if(!scope.enabled)return Promise.reject(new Error('Your session is not ready.'));
  if(!scope.online){
   const cached=queryClient.getQueryState<T>(key);
   if(cached?.data!==undefined&&!(cached.error instanceof QueryHttpError&&[401,403].includes(cached.error.status)))return Promise.resolve(cached.data);
   return Promise.reject(new Error("You're offline. Reconnect and try again."));
  }
  return queryClient.fetchQuery({...scope.options,staleTime,queryKey:key,queryFn:({signal})=>fetcher(scope.request(signal))});
 };
 const subject=(id:string,resource:string,...filters:unknown[])=>subjectKey(year,id,resource,...filters);
 const allGrades=['advisory-grades'];
 const saveScore=(id:string,student:string,item:string,value:number|null)=>{
  const key=[...scope.key,...subject(id,'scores')],fence=JSON.stringify(key),cell=JSON.stringify([...key,student,item]);
  const task=scoreChain.current.catch(()=>{}).then(async()=>{
   if(!scoreOwner.current)throw new Error('Score action cancelled because its page changed.');
   if(scoreWriteFences.has(fence))throw new QueryHttpError('Score state needs reconciliation. Your edits are retained. Reload this class to check stored scores before saving again.',503,'uncertain');
   const cached=queryClient.getQueryData<Awaited<ReturnType<typeof grading.fetchScores>>>(key);
   const expected=confirmedScores.current.has(cell)?confirmedScores.current.get(cell)!:cached?.[student]?.[item]??null;
   let sent=false;
   try{
    await write(o=>{sent=true;return grading.saveScore(id,student,item,value,o,expected);},[subject(id,'scores'),subject(id,'submission'),allGrades]);
    confirmedScores.current.set(cell,value);
    queryClient.setQueryData<Awaited<ReturnType<typeof grading.fetchScores>>>(key,previous=>previous?{...previous,[student]:{...previous[student],[item]:value}}:previous);
   }catch(error){
    if(sent&&(!(error instanceof QueryHttpError)||error.outcome==='uncertain'||error.outcome==='conflict'||(error.status>=500&&error.outcome!=='not_saved'))){
     scoreWriteFences.add(fence);
     throw new QueryHttpError(error instanceof QueryHttpError&&error.outcome==='conflict'?error.message:'Score saving could not be confirmed. Your edits are retained. Reload this class to check stored scores before saving again.',error instanceof QueryHttpError?error.status:503,error instanceof QueryHttpError&&error.outcome==='conflict'?'conflict':'uncertain');
    }
    throw error;
   }
  });
  scoreChain.current=task;return task;
 };
 const gradingPort:GradingPort={
  fetchTopics:id=>read(subject(id,'topics'),o=>grading.fetchTopics(id,o)),
  fetchScores:id=>read(subject(id,'scores'),o=>grading.fetchScores(id,o),0),
  fetchItems:(id,filters={})=>read(subject(id,'items',filters),o=>grading.fetchItems(id,filters,o),0),
  addItem:async(id,item)=>{
   await queryClient.cancelQueries({queryKey:[...scope.key,...subject(id,'items')]});
   const created=await write(o=>grading.addItem(id,item,o),[subject(id,'items')]);
   const entry={...item,id:created.id,gradingPeriodId:item.term} as Awaited<ReturnType<typeof grading.fetchItems>>[number];
   for(const query of queryClient.getQueryCache().findAll({queryKey:[...scope.key,...subject(id,'items')]})){
    const filter=query.queryKey[query.queryKey.length-1] as {allPeriods?:boolean;term?:string;tab?:string};
    if(!filter?.allPeriods&&filter?.term!==item.term)continue;
    if(filter.tab&&filter.tab!==item.tab)continue;
    queryClient.setQueryData<Awaited<ReturnType<typeof grading.fetchItems>>>(query.queryKey,previous=>previous?[...previous.filter(row=>row.id!==entry.id),entry]:previous);
   }
   return created;
  },
  deleteItem:async(id,item)=>{
   await queryClient.cancelQueries({queryKey:[...scope.key,...subject(id,'scores')]});
   await queryClient.cancelQueries({queryKey:[...scope.key,...subject(id,'items')]});
   await write(o=>grading.deleteItem(id,item,o),[subject(id,'items'),subject(id,'scores'),allGrades]);
   queryClient.setQueriesData<Awaited<ReturnType<typeof grading.fetchItems>>>({queryKey:[...scope.key,...subject(id,'items')]},previous=>previous?.filter(entry=>entry.id!==item));
   queryClient.setQueryData<Awaited<ReturnType<typeof grading.fetchScores>>>([...scope.key,...subject(id,'scores')],previous=>previous?removeItemScores(previous,item):previous);
  },
  saveScore,
  saveHolistic:(id,student,axis,value,term)=>write(o=>grading.saveHolistic(id,student,axis,value,term,o),[subject(id,'holistic'),subject(id,'weekly-holistic'),['holistic']]),
  createTopic:(id,name)=>write(o=>grading.createTopic(id,name,o),[subject(id,'topics')]),
  fetchGradeSubmissionStatus:(id,period)=>read(subject(id,'submission',period),o=>grading.fetchGradeSubmissionStatus(id,period,o),0),
  submitGrades:(id,period,_request,expectedVersion)=>write(o=>confirmedSubmission(JSON.stringify([...scope.key,...subject(id,'submission'),period]),async()=>expectedVersion!==undefined?expectedVersion:(await read(subject(id,'submission',period),request=>grading.fetchGradeSubmissionStatus(id,period,request),0)).submissionVersion??null,version=>grading.submitGrades(id,period,o,version),()=>{[subject(id,'submission'),allGrades].forEach(key=>{void queryClient.invalidateQueries({queryKey:[...scope.key,...key],refetchType:'none'});});}),[subject(id,'submission'),allGrades]),
 };
 const holisticPort:HolisticPort={fetchGradingPeriodsGlobal:holistic.fetchGradingPeriodsGlobal,fetchHolisticWeekly:holistic.fetchHolisticWeekly,
  saveHolistic:(id,student,axis,value,overrides)=>write(o=>holistic.saveHolistic(id,student,axis,value,overrides,o),[subject(id,'weekly-holistic'),subject(id,'holistic'),['holistic']]),
 };
 return <TeacherAcademicQueryContext.Provider value={{grading:gradingPort,holistic:holisticPort,writing:mutation.isPending,TopicsEffects,WeeklyEffects,info,periods}}>{children}</TeacherAcademicQueryContext.Provider>;
}

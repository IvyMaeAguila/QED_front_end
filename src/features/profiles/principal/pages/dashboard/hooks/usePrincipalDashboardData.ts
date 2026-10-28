import {useReadFreshness} from '@shared/query/readFreshness';
import {useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import {onlineManager,useQueries,useQuery} from '@tanstack/react-query';
import {useAuth} from '@shared/hooks/useAuth';
import {useRoutePreview} from '@shared/loading/RoutePreview';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import {principalDashboardKeys,queryClient} from '@shared/query/queryClient';
import {safeReadOptions,isTransientReadFailure} from '@shared/query/safeReadPolicy';
import type {PrincipalDashboardData,Term} from '../data/types';
import * as service from '../services/principalDashboard.service';
import {HOLISTIC_RUBRIC} from '../utils/HolisticRubrics';
import {ATTENTION_ITEMS} from '../data/mockData';
import {dashboardOfflineError} from './dashboardOfflineError';

const policy={...safeReadOptions,staleTime:30_000,gcTime:300_000};
const sources={totalStudents:service.getTotalStudents,overviewSummary:service.getOverviewSummary,todaysAttendance:service.getTodaysAttendance,performanceByGrade:service.getPerformanceByGrade,performanceTrend:service.getPerformanceTrend,attendanceByGrade:service.getAttendanceByGrade,topSubjectPerGrade:service.getTopSubjectPerGrade,subjectRankingByTerm:service.getSubjectRankingByTerm,holisticDomains:service.getHolisticOverview};
type Resource=keyof typeof sources;
type Values={[K in Resource]:Awaited<ReturnType<typeof sources[K]>>};
const names=Object.keys(sources) as Resource[];
const groups={overview:['totalStudents','overviewSummary'],attendance:['todaysAttendance','attendanceByGrade'],subject:['topSubjectPerGrade','subjectRankingByTerm'],holistic:['holisticDomains'],academic:['performanceByGrade','performanceTrend']} satisfies Record<string,Resource[]>;
const blocked=(error:unknown)=>error instanceof QueryHttpError&&[401,403].includes(error.status);
const subscribe=(notify:()=>void)=>onlineManager.subscribe(notify);

export function usePrincipalDashboardData(){
 const {user,isLoading,sessionScope,expireSession}=useAuth(),preview=useRoutePreview();
 const online=useSyncExternalStore(subscribe,()=>onlineManager.isOnline());
 const enabled=!preview&&!isLoading&&user?.role==='PRINCIPAL';
 const role=user?.role??'',userId=String(user?.id??'');
 const lifecycle=useRef({mounted:false,sessionScope,enabled});
 useLayoutEffect(()=>{const current={mounted:true,sessionScope,enabled};lifecycle.current=current;onlineManager.setOnline(navigator.onLine);return()=>{current.mounted=false;};},[sessionScope,enabled]);
 const options=(signal:AbortSignal)=>({signal,onUnauthorized:()=>{if(!signal.aborted)expireSession(sessionScope);}});
 const term=useQuery({...policy,queryKey:principalDashboardKeys.term(sessionScope,role,userId),enabled,queryFn:async({signal})=>{const value=await service.fetchActiveTerm(options(signal));service.mapToTerm(value.name);return value;}});
 const year=useQuery({...policy,queryKey:principalDashboardKeys.year(sessionScope,role,userId),enabled,queryFn:({signal})=>service.fetchActiveAcademicYear(options(signal))});
 const context=term.data,validContext=!!context&&['Term 1','Term 2','Term 3'].includes(context.name);
 const today=new Date(),date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const prefix=principalDashboardKeys.snapshot(sessionScope,role,userId,context?.schoolYearId??null,context?.id??null,context?.termNumber??null,date);
 const reads=useQueries({queries:names.map(resource=>({...policy,queryKey:[...prefix,resource],enabled:enabled&&validContext&&!term.isFetching&&!term.isPaused&&!blocked(term.error)&&!blocked(year.error),queryFn:async({signal}:{signal:AbortSignal}):Promise<Values[Resource]>=>sources[resource](options(signal))}))});
 const all=[term,year,...reads],permission=all.find(q=>blocked(q.error))?.error;
 const denied=!!permission,paused=all.some(q=>q.isPaused),offline=enabled&&(!online||paused);
 const value=<K extends Resource>(name:K)=>reads[names.indexOf(name)].data as Values[K]|undefined;
 const hasAny=reads.some(q=>q.data!==undefined),initialPending=reads.some(q=>q.isPending&&!q.isError);
 // These empty values reserve presentation shape; they are never cached.
 // A region without verified data renders its own error or skeleton.
 const data:PrincipalDashboardData|null=enabled&&validContext&&!denied&&hasAny?{
  overview:{totalStudents:value('totalStudents')??0,totalTeachers:0,attendance:0,academicPerf:0,...value('overviewSummary'),needsIntervention:0},
  todaysAttendance:value('todaysAttendance')??{present:0,absent:0,concerning:0},performanceByGrade:value('performanceByGrade')??[],performanceTrend:value('performanceTrend')??[],attendanceByGrade:value('attendanceByGrade')??[],topSubjectPerGrade:value('topSubjectPerGrade')??[],subjectRankingByTerm:value('subjectRankingByTerm')??{'Term 1':[],'Term 2':[],'Term 3':[]},holisticDomains:value('holisticDomains')??[],holisticRubric:HOLISTIC_RUBRIC,attentionItems:ATTENTION_ITEMS,currentTerm:context!.name as Term,
 }:null;
 const active=()=>lifecycle.current.mounted&&lifecycle.current.enabled&&lifecycle.current.sessionScope===sessionScope;
 const refetch=async()=>{
  if(!enabled||!online||paused||all.some(q=>q.isFetching))return;
  const failed=all.filter(q=>q.error);
  if(failed.length){await Promise.all(failed.map(q=>q.refetch({cancelRefetch:false})));return;}
  const [nextTerm,nextYear]=await Promise.all([term.refetch({cancelRefetch:false}),year.refetch({cancelRefetch:false})]);
  if(!active()||!nextTerm.isSuccess||blocked(nextYear.error))return;
  if(context&&nextTerm.data.id===context.id&&nextTerm.data.schoolYearId===context.schoolYearId&&nextTerm.data.termNumber===context.termNumber)await Promise.all(reads.map(q=>q.refetch({cancelRefetch:false})));
 };
 useReadFreshness(JSON.stringify([sessionScope,role,userId,'dashboard']),enabled,async signal=>{
  if(!online||paused||all.some(q=>q.isFetching)||permission)return;
  const termKey=principalDashboardKeys.term(sessionScope,role,userId),yearKey=principalDashboardKeys.year(sessionScope,role,userId);
  const termQuery=queryClient.getQueryCache().find({queryKey:termKey,exact:true}),yearQuery=queryClient.getQueryCache().find({queryKey:yearKey,exact:true});
  if(!termQuery||!yearQuery)return;
  const termState=termQuery.state,yearState=yearQuery.state;
  const result=await Promise.allSettled([service.fetchActiveTerm(options(signal)),service.fetchActiveAcademicYear(options(signal))]);
  if(signal.aborted||!active()||queryClient.getQueryCache().find({queryKey:termKey,exact:true})!==termQuery||queryClient.getQueryCache().find({queryKey:yearKey,exact:true})!==yearQuery||termQuery.state!==termState||yearQuery.state!==yearState)return;
  for(const [index,r]of result.entries())if(r.status==='rejected')(index===0?termQuery:yearQuery).setState({error:r.reason instanceof Error?r.reason:new Error('Unable to verify dashboard context.'),status:'error',errorUpdatedAt:Date.now()});
  if(result[0].status!=='fulfilled'||result[1].status!=='fulfilled')return;
  const nextTerm=result[0].value,nextYear=result[1].value;
  try{service.mapToTerm(nextTerm.name);if(nextTerm.schoolYearId!==nextYear.id)throw new Error('Dashboard year and term could not be verified together.');}
  catch(error){termQuery.setState({error:error as Error,status:'error',errorUpdatedAt:Date.now()});return;}
  queryClient.setQueryData(yearKey,nextYear);queryClient.setQueryData(termKey,nextTerm);
  const now=new Date(),currentDate=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if(date===currentDate&&context&&nextTerm.id===context.id&&nextTerm.schoolYearId===context.schoolYearId&&nextTerm.termNumber===context.termNumber)await Promise.all(reads.map(q=>q.refetch({cancelRefetch:false})));
 });
 const regions=Object.fromEntries(Object.entries(groups).map(([name,resources])=>{
  const queries=resources.map(resource=>reads[names.indexOf(resource)]),hasData=!denied&&queries.every(q=>q.data!==undefined);
  const error=permission??queries.find(q=>q.error)?.error??(offline&&!hasData?dashboardOfflineError:null);
  return [name,{hasData,error,loading:!offline&&!denied&&queries.some(q=>q.data===undefined&&q.isPending),retainOnError:hasData&&(error===dashboardOfflineError||isTransientReadFailure(error)),retry:()=>{if(!enabled||offline||queries.some(q=>q.isFetching||q.isPaused))return;const failed=queries.filter(q=>q.error||q.data===undefined);for(const q of failed.length?failed:queries)void q.refetch({cancelRefetch:false});}}];
 })) as Record<keyof typeof groups,{hasData:boolean;error:Error|null;loading:boolean;retainOnError:boolean;retry:()=>void}>;
 const requestError=!term.isFetching?term.error??(!validContext&&context?new Error('Unexpected term name from API.'):null)??(!hasAny?reads.find(q=>q.error)?.error:null):null;
 const error=enabled?permission??requestError??(offline?dashboardOfflineError:null):null;
 const selectionScope=JSON.stringify([sessionScope,role,userId,context?.schoolYearId??null]);
 const [selection,setSelection]=useState<{scope:string;term:Term}|null>(null);
 return {data,regions,loading:!enabled||online&&!paused&&!error&&(term.isPending||term.isFetching&&!context||validContext&&initialPending),error,
  rankingTerm:selection?.scope===selectionScope?selection.term:data?.currentTerm??'Term 1',setRankingTerm:(term:Term)=>setSelection({scope:selectionScope,term}),refetch,
  academicYear:enabled&&!denied?year.data??null:null,yearLoading:!enabled||online&&!year.isPaused&&!year.error&&!year.data&&year.isPending,
  yearError:enabled?(!year.isFetching?year.error:null)??(offline&&!year.data?dashboardOfflineError:null):null,
  retryYear:()=>{if(enabled&&online&&!year.isPaused&&!year.isFetching)void year.refetch({cancelRefetch:false});},
 };
}

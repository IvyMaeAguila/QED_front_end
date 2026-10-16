import {useEffect,type ReactNode} from 'react';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useTeacherQueryScope,type TeacherRequestOptions} from './teacherQueryScope';
import {useTeacherReader} from './useTeacherReader';
import {useTeacherRetryAttempt} from './useTeacherRetryAttempt';
import {TeacherGradeQueryContext,type VisibilityScope} from './TeacherGradeQueryContext';
import {fetchGradingPeriodsGlobal} from '../pages/holistic/services/holistic.service';
import * as api from '../pages/grades/services/gradePage.service';
import {advisoryGradeKey} from './teacherGradeKeys';
const emptyStudents:api.VisibilityStudent[]=[];
function VisibilityEffects({period,classId,ready,attempt,setStudents,setSelected,setLoading,setError}:VisibilityScope){
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,'Failed to load terms.');
 const reader=useTeacherReader(advisoryGradeKey(periods.data?.[0]?.schoolYearId??'active',period,classId,'visibility'),o=>api.fetchGradeVisibility(period,classId,o),'Failed to load visibility settings for this term.',30_000,ready&&!!period&&!periods.loading&&!periods.error);
 useTeacherRetryAttempt(attempt,reader.retry);
 useEffect(()=>{setLoading(reader.loading);setError(reader.error);if(!reader.loading){setStudents(reader.data??emptyStudents);setSelected(new Set());}},[reader.loading,reader.error,reader.data,setStudents,setSelected,setLoading,setError]);
 return null;
}
type Write={kind:'submit';period:string;classId?:string}|{kind:'visibility';params:api.SetGradeVisibilityParams};
type Request={write:Write;key:readonly unknown[];year:string;allowed:boolean;request:TeacherRequestOptions};
export function TeacherGradeQueries({children}:{children:ReactNode}){
 const scope=useTeacherQueryScope();
 const periods=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,'Failed to load terms.');
 const year=periods.data?.[0]?.schoolYearId??'active';
 const mutation=useMutation({retry:false,networkMode:'always',mutationFn:async({write,request,allowed}:Request)=>{
  if(!allowed)throw new Error("You're offline or your session is not ready.");
  return write.kind==='submit'?api.submitClassGrades(write.period,write.classId,request):api.setGradeVisibility(write.params,request);
 },onSuccess:(_data,{write,key,year})=>{
  const period=write.kind==='submit'?write.period:write.params.gradingPeriodId;
  const classId=write.kind==='submit'?write.classId:write.params.classId;
  void queryClient.invalidateQueries({queryKey:[...key,...(write.kind==='visibility'?advisoryGradeKey(year,period,classId,'visibility'):advisoryGradeKey(year,period,classId,'').slice(0,-1))],refetchType:'none'});
 }});
 const run=(write:Write)=>mutation.mutateAsync({write,key:scope.key,year,allowed:scope.enabled&&scope.online,request:scope.mutationRequest(new AbortController().signal)});
 return <TeacherGradeQueryContext.Provider value={{VisibilityEffects,
  submit:async(period,classId)=>{await run({kind:'submit',period,classId});},
  saveVisibility:async params=>(await run({kind:'visibility',params})) as number,
  fetchLogs:(period,classId)=>queryClient.fetchQuery({...scope.options,queryKey:[...scope.key,...advisoryGradeKey(year,period,classId,'history')],queryFn:({signal})=>api.fetchClassSubmissionLogs(period,classId,scope.request(signal))}),
 }}>{children}</TeacherGradeQueryContext.Provider>;
}

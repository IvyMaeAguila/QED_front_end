import {useAttendanceQueue} from './useAttendanceSaves';
import {confirmAttendance} from './attendanceCache';
import {useEffect,useMemo,type ReactNode} from 'react';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {AttendanceQueryContext,type AttendanceReadScope} from './AttendanceQueryContext';
import {useTeacherReader} from './useTeacherReader';
import {useTeacherQueryScope,type TeacherRequestOptions} from './teacherQueryScope';
import {useTeacherRetryAttempt} from './useTeacherRetryAttempt';
import {fetchAdvisoryAttendance,saveAdvisoryAttendance,markAdvisoryPresent} from '../pages/attendance/services/attendance.service';
type SaveArgs=[classId:string,studentId:string,dateISO:string,status:import('../pages/subjects/detail/types/Grading').AttendanceStatus,termId?:string];
type BulkArgs=Parameters<typeof markAdvisoryPresent>;
type BulkRequest={args:BulkArgs;key:readonly unknown[];request:TeacherRequestOptions;allowed:boolean};
type SaveRequest={args:SaveArgs;key:readonly unknown[];request:TeacherRequestOptions;allowed:boolean};
function Effects({classId,termId,allPeriods,ready,attempt,setAttendance,setLoading,setError,setLoadedFor,errorMessage}:AttendanceReadScope){
 const {jobs}=useAttendanceQueue();
 const reader=useTeacherReader(['attendance',classId,termId??'active',Boolean(allPeriods)],o=>fetchAdvisoryAttendance(classId,{termId,allPeriods},o),errorMessage,30_000,ready&&!!classId,false,true);
 useTeacherRetryAttempt(attempt,reader.retry);
 useEffect(()=>{setLoading(reader.loading);setError(reader.error);if(!reader.loading){const data={...reader.data?.data};for(const job of jobs)if(job.classId===classId&&job.state==='pending')for(const mark of job.marks)data[mark.studentId]={...data[mark.studentId],[mark.date]:mark.status};setAttendance(data);setLoadedFor?.(classId);}},[jobs,reader.data,reader.loading,reader.error,classId,setAttendance,setLoading,setError,setLoadedFor]);
 return null;
}
function invalidate(key:readonly unknown[],classId:string){
 void queryClient.invalidateQueries({queryKey:[...key,'monthly-attendance-report',classId]});
 void queryClient.invalidateQueries({queryKey:[...key,'dropouts',classId]});
 void queryClient.invalidateQueries({queryKey:[...key,'dashboard','attendance'],refetchType:'none'});
}
export function TeacherAttendanceQueries({children}:{children:ReactNode}){
 const scope=useTeacherQueryScope();
 const mutation=useMutation({retry:false,networkMode:'always',
  onMutate:({args,key}:SaveRequest)=>queryClient.cancelQueries({queryKey:[...key,'attendance',args[0]]}),
  mutationFn:async({args,request,allowed}:SaveRequest)=>{
   if(!allowed)throw new Error("You're offline or your session is not ready.");
   await saveAdvisoryAttendance(args[0],args[1],args[2],args[3],args[4],request);
  },
  onSuccess:(_data,{args,key})=>{confirmAttendance(queryClient,key,args[0],[args[1]],args[2],args[3],args[4]);invalidate(key,args[0]);},
 });
 const bulk=useMutation({retry:false,networkMode:'always',onMutate:({args,key}:BulkRequest)=>queryClient.cancelQueries({queryKey:[...key,'attendance',args[0]]}),mutationFn:async({args,request,allowed}:BulkRequest)=>{
  if(!allowed)throw new Error("You're offline or your session is not ready.");
  await markAdvisoryPresent(args[0],args[1],args[2],args[3],request);
 },onSuccess:(_data,{args,key})=>{confirmAttendance(queryClient,key,args[0],args[1],args[2],'P',args[3]);invalidate(key,args[0]);}});
 const {mutateAsync}=mutation;
 const bulkMutate=bulk.mutateAsync;
 const value=useMemo(()=>({Effects,save:((...args:SaveArgs)=>mutateAsync({args,key:scope.key,allowed:scope.enabled&&scope.online,request:scope.mutationRequest(new AbortController().signal)})) as typeof saveAdvisoryAttendance,markPresent:((...args:BulkArgs)=>bulkMutate({args,key:scope.key,allowed:scope.enabled&&scope.online,request:scope.mutationRequest(new AbortController().signal)})) as typeof markAdvisoryPresent}),[mutateAsync,bulkMutate,scope]);
 return <AttendanceQueryContext.Provider value={value}>{children}</AttendanceQueryContext.Provider>;
}

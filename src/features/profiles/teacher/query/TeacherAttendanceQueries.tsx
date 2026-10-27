import {useEffect,useMemo,type ReactNode} from 'react';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {AttendanceQueryContext,type AttendanceReadScope} from './AttendanceQueryContext';
import {useTeacherReader} from './useTeacherReader';
import {useTeacherQueryScope,type TeacherRequestOptions} from './teacherQueryScope';
import {useTeacherRetryAttempt} from './useTeacherRetryAttempt';
import {fetchAdvisoryAttendance,saveAdvisoryAttendance} from '../pages/attendance/services/attendance.service';
type SaveArgs=[classId:string,studentId:string,dateISO:string,status:import('../pages/subjects/detail/types/Grading').AttendanceStatus,termId?:string];
type SaveRequest={args:SaveArgs;key:readonly unknown[];request:TeacherRequestOptions;allowed:boolean};
function Effects({classId,termId,allPeriods,ready,attempt,setAttendance,setLoading,setError,setLoadedFor,errorMessage}:AttendanceReadScope){
 const reader=useTeacherReader(['attendance',classId,termId??'active',Boolean(allPeriods)],o=>fetchAdvisoryAttendance(classId,{termId,allPeriods},o),errorMessage,30_000,ready&&!!classId);
 useTeacherRetryAttempt(attempt,reader.retry);
 useEffect(()=>{setLoading(reader.loading);setError(reader.error);if(!reader.loading){setAttendance(reader.data?.data??{});setLoadedFor?.(classId);}},[reader.data,reader.loading,reader.error,classId,setAttendance,setLoading,setError,setLoadedFor]);
 return null;
}
export function TeacherAttendanceQueries({children}:{children:ReactNode}){
 const scope=useTeacherQueryScope();
 const mutation=useMutation({retry:false,networkMode:'always',
  mutationFn:async({args,request,allowed}:SaveRequest)=>{
   if(!allowed)throw new Error("You're offline or your session is not ready.");
   await saveAdvisoryAttendance(args[0],args[1],args[2],args[3],args[4],request);
  },
  onSuccess:(_data,{args,key})=>{
   // Keep the current optimistic UI; mark every term/history projection stale.
   void queryClient.invalidateQueries({queryKey:[...key,'attendance',args[0]],refetchType:'none'});
   void queryClient.invalidateQueries({queryKey:[...key,'monthly-attendance-report',args[0]]});
   void queryClient.invalidateQueries({queryKey:[...key,'dashboard','attendance'],refetchType:'none'});
  },
 });
 const {mutateAsync}=mutation;
 const value=useMemo(()=>({Effects,save:((...args:SaveArgs)=>mutateAsync({args,key:scope.key,allowed:scope.enabled&&scope.online,request:scope.mutationRequest(new AbortController().signal)})) as typeof saveAdvisoryAttendance}),[mutateAsync,scope]);
 return <AttendanceQueryContext.Provider value={value}>{children}</AttendanceQueryContext.Provider>;
}

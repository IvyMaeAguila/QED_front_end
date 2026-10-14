import {useCallback,useLayoutEffect,useMemo} from 'react';
import {QueryClientProvider,useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useAdminQueryScope} from './adminQueryScope';
import {useAdminReader,useAdminNavigationRefresh} from './useAdminReader';
import * as service from '../pages/classes/services/classes.service';
import {fetchTeachers} from '../pages/subjects/services/teacher.service';
import type {AdminSchoolDriverProps,AdminSchoolBridge} from './AdminSchoolProvider';
const classesKey=['classes','list'] as const,teachersKey=['teachers','list'] as const;
const classesConsumers=/^\/admin(?:\/classes(?:\/|$)|\/?$)/,teacherConsumers=/^\/admin(?:\/classes(?:\/|$)|\/subjects(?:\/|$)|\/users(?:\/|$)|\/?$)/;
const emptyClasses:service.ClassRecord[]=[],emptyTeachers:Awaited<ReturnType<typeof fetchTeachers>>=[];
type Write={kind:'create';payload:Parameters<typeof service.createClass>[0]}|{kind:'update';id:string|number;payload:service.UpdateClassPayload}|{kind:'delete';id:string|number};
function Driver({seeds,publish,isCurrent}:AdminSchoolDriverProps){
 const scope=useAdminQueryScope(),classes=useAdminReader(classesKey,service.fetchClasses,'Failed to load classes.',true,seeds?.classes),teachers=useAdminReader(teachersKey,fetchTeachers,'Failed to load teachers.',true,seeds?.teachers);
 useAdminNavigationRefresh(classesKey,classes.retry,classesConsumers);useAdminNavigationRefresh(teachersKey,teachers.retry,teacherConsumers);
 const {key,enabled,online,mutationRequest}=scope;
 const {mutateAsync}=useMutation({retry:false,networkMode:'always',mutationFn:async(write:Write)=>{if(!enabled||!online||!isCurrent())throw new Error("You're offline or your session is not ready.");const options=mutationRequest();return write.kind==='create'?service.createClass(write.payload,options):write.kind==='update'?service.updateClassApi(write.id,write.payload,options):service.deleteClassApi(write.id,options);},onSuccess:()=>{if(!isCurrent())return;for(const dependency of [['classes'],['class-options'],['student-options','sections'],['students'],['teachers'],['sections'],['subjects'],['dashboard','audit']])void queryClient.invalidateQueries({queryKey:[...key,...dependency],refetchType:'none'});}});
 const run=useCallback(async(write:Write)=>{const result=await mutateAsync(write);if(!isCurrent())throw new Error('Your session changed. Please sign in again.');return result;},[mutateAsync,isCurrent]);
 const {retry:retryTeachers}=teachers;
 const refreshTeachers=useCallback((changed=false)=>{if(!isCurrent())return;if(changed)for(const resource of [['class-options','teachers'],['teachers','profile'],['teachers','list'],['classes']])void queryClient.invalidateQueries({queryKey:[...key,...resource],refetchType:'none'});void retryTeachers();},[isCurrent,key,retryTeachers]);
 const value=useMemo<AdminSchoolBridge>(()=>({classes:{data:classes.data??emptyClasses,loading:classes.loading,error:classes.error,retry:()=>void classes.retry()},teachers:{data:teachers.data??emptyTeachers,loading:teachers.loading,error:teachers.error,retry:refreshTeachers},operations:{createClass:payload=>run({kind:'create',payload}),updateClass:(id,payload)=>run({kind:'update',id,payload}),deleteClass:async id=>{await run({kind:'delete',id});queryClient.setQueryData<service.ClassRecord[]>([...key,...classesKey],old=>(old??[]).filter(row=>String(row.id)!==String(id)));}}}),[classes,teachers,run,key,refreshTeachers]);
 useLayoutEffect(()=>publish(value),[publish,value]);useLayoutEffect(()=>()=>publish(undefined),[publish]);return null;
}
export default function AdminSchoolQueries(props:AdminSchoolDriverProps){return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;}

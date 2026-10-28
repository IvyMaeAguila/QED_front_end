import {useCallback,useLayoutEffect,useMemo} from 'react';
import {QueryClientProvider,useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useAdminQueryScope} from './adminQueryScope';
import {useAdminNavigationRefresh,useAdminReader} from './useAdminReader';
import {useAdminFetch} from './useAdminFetch';
import {studentService} from '../pages/studentrecords/services/student-record.service';
import {fetchGradeLevels,fetchSectionByGrade} from '../pages/studentrecords/services/grade-section.service';
import type {Student} from '../pages/studentrecords/types/Students';
import type {StudentsContextValue} from '../pages/studentrecords/context/StudentsContext';
import type {AdminStudentsDriverProps} from './AdminStudentsProvider';
const resource=['students','list'] as const,consumers=/^\/admin(?:\/students(?:\/|$)|\/classes(?:\/|$)|\/?$)/;
const empty:Student[]=[];
type Write={kind:'create';payload:Record<string,unknown>}|{kind:'update';id:number;payload:Partial<Student>}|{kind:'delete';id:number};
function Driver({seed,publish,isCurrent}:AdminStudentsDriverProps){
 const scope=useAdminQueryScope(),reader=useAdminReader(resource,studentService.getAllStudents,'Failed to load students',true,seed);
 const {key,enabled,online,mutationRequest}=scope,fetch=useAdminFetch();
 useAdminNavigationRefresh(resource,reader.retry,consumers);
 const changed=useCallback(()=>{for(const dependency of [['section-assignments'],['students'],['classes'],['dashboard','students'],['dashboard','audit']])void queryClient.invalidateQueries({queryKey:[...key,...dependency],refetchType:'none'});},[key]);
 const {mutateAsync}=useMutation({retry:false,networkMode:'always',mutationFn:async(write:Write)=>{
  if(!enabled||!online||!isCurrent())throw new Error("You're offline or your session is not ready.");
  const options=mutationRequest();return write.kind==='create'?studentService.addNewStudent(write.payload,options):write.kind==='update'?studentService.updateStudent(write.id,write.payload,options):studentService.softDeleteStudent(write.id,options);
 },onSuccess:()=>{if(isCurrent())changed();}});
 const run=useCallback(async(write:Write)=>{const result=await mutateAsync(write);if(!isCurrent())throw new Error('Your session changed. Please sign in again.');return result;},[mutateAsync,isCurrent]);
 const students=reader.data??empty,{loading,error,retry}=reader;
 const refetch=useCallback(async()=>{await retry();},[retry]);
 const append=useCallback((rows:Student[])=>{if(!isCurrent())return;queryClient.setQueryData<Student[]>([...key,...resource],old=>[...(old??[]),...rows].sort((a,b)=>a.gradeLevelId-b.gradeLevelId||(a.section??'').localeCompare(b.section??'')));changed();},[key,changed,isCurrent]);
 const value=useMemo<StudentsContextValue>(()=>({students,loading,error,serverUpdatedAt:0,activateQueries:()=>{},refetch,getStudent:id=>students.find(s=>s.id===id),
  addStudent:row=>{append([row]);return row;},addStudents:append,
  createRecord:payload=>run({kind:'create',payload}),
  updateStudent:async(id,payload)=>{await run({kind:'update',id,payload});await refetch();},
  deleteStudent:async id=>{await run({kind:'delete',id});await refetch();},
  fetchGrades:()=>fetch(['student-options','grades'],fetchGradeLevels,300_000),
  fetchSections:grade=>fetch(['student-options','sections',String(grade)],o=>fetchSectionByGrade(grade,o)),
 }),[students,loading,error,refetch,append,run,fetch]);
 useLayoutEffect(()=>{publish(value);},[value,publish]);useLayoutEffect(()=>()=>publish(undefined),[publish]);return null;
}
export default function AdminStudentsQueries(props:AdminStudentsDriverProps){return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;}

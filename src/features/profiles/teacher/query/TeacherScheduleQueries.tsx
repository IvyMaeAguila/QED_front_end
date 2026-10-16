import {useEffect,useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useStudents} from '../../admin/pages/studentrecords/context/StudentsContext';
import {fetchClasses,type ClassRecord} from '../../admin/pages/classes/services/classes.service';
import {fetchTeachers,type TeacherRow} from '../../admin/pages/subjects/services/teacher.service';
import {useTeacherReader} from './useTeacherReader';
import type {TeacherScheduleSnapshot} from './TeacherScheduleProviders';
const emptyClasses:ClassRecord[]=[];const emptyTeachers:TeacherRow[]=[];
function Queries({onChange}:{onChange:(data:TeacherScheduleSnapshot|null)=>void}){
 const {pathname}=useLocation(),students=useStudents();
 const profile=pathname.match(/^\/teacher\/students\/([^/]+)\/?$/);
 const student=students.students.find(s=>s.id===profile?.[1]);
 const targets=useMemo(()=>student?[`${student.gradeLevelId}:${student.sectionId??'none'}`]:[],[student]);
 const ready=!!student&&!students.loading&&!students.error;
 const classes=useTeacherReader(['student-context','active-year','classes',targets],async options=>{
  if(!targets.length)return emptyClasses;
  const rows=await fetchClasses(options);
  // Student ownership is enforced by the student endpoint. Retain only the
  // class schedules needed by those authorized students, never a second roster.
  return rows.filter(row=>targets.includes(`${row.gradeLevelId}:${row.sectionId??'none'}`));
 },'Failed to load classes.',30_000,ready);
 const teacherIds=useMemo(()=>[...new Set((classes.data??emptyClasses).flatMap(c=>c.schedule.map(p=>String(p.teacherId))))].sort(),[classes.data]);
 const teachers=useTeacherReader(['student-context','active-year','teachers',teacherIds],async options=>{
  if(!teacherIds.length)return emptyTeachers;
  return (await fetchTeachers(options)).filter(row=>teacherIds.includes(String(row.id)));
 },'Failed to load teachers.',30_000,ready&&!classes.loading&&!classes.error);
 const {data:classData,loading:classLoading,error:classError,retry:retryClasses}=classes;
 const {data:teacherData,loading:teacherLoading,error:teacherError,retry:retryTeachers}=teachers;
 useEffect(()=>{
  onChange({classes:{data:classData??emptyClasses,loading:classLoading,error:classError,retry:retryClasses},teachers:{data:teacherData??emptyTeachers,loading:teacherLoading,error:teacherError,retry:retryTeachers}});
  return()=>onChange(null);
 },[classData,classLoading,classError,retryClasses,teacherData,teacherLoading,teacherError,retryTeachers,onChange]);
 return null;
}
export default function TeacherScheduleQueries(props:{onChange:(data:TeacherScheduleSnapshot|null)=>void}){return <QueryClientProvider client={queryClient}><Queries {...props}/></QueryClientProvider>;}

import {useContext,useState,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '../src/shared/query/queryClient';
import {AuthProvider} from '../src/features/auth/context/authContext';
import {useAuth} from '../src/shared/hooks/useAuth';
import type {UserProfile} from '../src/shared/profile/types/types';
import {TeacherAcademicQueries} from '../src/features/profiles/teacher/query/TeacherAcademicQueries';
import {TeacherAcademicQueryContext} from '../src/features/profiles/teacher/query/TeacherAcademicQueryContext';
import {TeacherAttendanceQueries} from '../src/features/profiles/teacher/query/TeacherAttendanceQueries';
import {AttendanceQueryContext} from '../src/features/profiles/teacher/query/AttendanceQueryContext';
import {TeacherGradeQueries} from '../src/features/profiles/teacher/query/TeacherGradeQueries';
import {TeacherGradeQueryContext} from '../src/features/profiles/teacher/query/TeacherGradeQueryContext';
const kind=new URLSearchParams(location.search).get('kind')??'academic';
export function Writer({onResult}:{onResult:(value:string)=>void}){
 const academic=useContext(TeacherAcademicQueryContext),attendance=useContext(AttendanceQueryContext),grades=useContext(TeacherGradeQueryContext);
 const save=()=>{
  const result=kind==='academic'?academic!.grading.saveScore('1','1','1',17):kind==='attendance'?attendance!.save('1','1','2026-10-09','P','1'):grades!.submit('1','1');
  void result.then(()=>onResult('success'),error=>onResult(`error:${error instanceof Error&&'status'in error?error.status:'unknown'}`));
 };
 return <button onClick={save}>Save synthetic record</button>;
}
export function Module({children}:{children:ReactNode}){return kind==='academic'?<TeacherAcademicQueries>{children}</TeacherAcademicQueries>:kind==='attendance'?<TeacherAttendanceQueries>{children}</TeacherAttendanceQueries>:<TeacherGradeQueries>{children}</TeacherGradeQueries>;}
export function Harness(){
 const auth=useAuth();const [mounted,setMounted]=useState(true),[result,setResult]=useState('pending');
 return <><span data-testid="auth">{auth.isLoading?'pending':auth.user?`${auth.user.role}:${auth.user.id}`:'signed-out'}</span><span data-testid="outcome">{result}</span><button onClick={()=>setMounted(false)}>Leave writer</button><button onClick={()=>auth.setUser({...auth.user,id:'2',role:'TEACHER',name:'Synthetic Two',email:'synthetic2@example.test'} as UserProfile)}>Switch account</button><button onClick={auth.logout}>Logout</button>{mounted&&<Module><Writer onResult={setResult}/></Module>}</>;
}
createRoot(document.getElementById('root')!).render(<AuthProvider><MemoryRouter initialEntries={['/teacher/subjects/1']}><QueryClientProvider client={queryClient}><Harness/></QueryClientProvider></MemoryRouter></AuthProvider>);

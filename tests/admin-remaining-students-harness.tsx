import {StrictMode,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation,useNavigate} from 'react-router-dom';
import {AuthProvider,useAuth} from '../src/features/auth/context/authContext';
import {AdminStudentsProvider} from '../src/features/profiles/admin/query/AdminStudentsProvider';
import {useStudents} from '../src/features/profiles/admin/pages/studentrecords/context/StudentsContext';
import {RoutePreviewContext} from '../src/shared/loading/RoutePreview';
import {queryClient} from '../src/shared/query/queryClient';
import type {UserProfile} from '../src/shared/profile/types/types';
const payload={studentId:'A23-0002',lrn:'123456789013',firstName:'Created',lastName:'Fixture',middleName:'',gender:'Male',gradeLevel:'1',section:'1'};
export function Panel(){
 const u=useStudents(),location=useLocation(),[result,setResult]=useState('');
 const {activateQueries}=u;useEffect(()=>{if(location.pathname==='/admin/students')activateQueries();},[location.pathname,activateQueries]);
 const write=(task:Promise<unknown>)=>{setResult('pending');void task.then(()=>setResult('success'),e=>setResult(e.message));};
 return <><output data-testid="data">{JSON.stringify(u.students)}</output><output data-testid="loading">{String(u.loading)}</output><output data-testid="error">{u.error??''}</output><output data-testid="result">{result}</output>
 <button onClick={()=>void u.refetch()}>Retry</button><button onClick={()=>write(u.createRecord(payload).then(()=>u.refetch()))}>Create</button><button onClick={()=>write(u.updateStudent(1,{firstName:'Changed'}))}>Update</button><button onClick={()=>write(u.deleteStudent(1))}>Delete</button>
 <button onClick={()=>write(u.fetchGrades())}>Grades</button><button onClick={()=>write(u.fetchSections('1'))}>Sections 1</button><button onClick={()=>write(u.fetchSections('2'))}>Sections 2</button></>;
}
export function Harness(){const auth=useAuth(),navigate=useNavigate(),[preview,setPreview]=useState(true),[mounted,setMounted]=useState(true),[cache,setCache]=useState('');return <>
 <output data-testid="auth">{auth.isLoading?'pending':auth.user?.id??'signed-out'}</output><output data-testid="cache">{cache}</output>
 <button onClick={()=>navigate('/admin/students')}>Open</button><button onClick={()=>navigate('/admin/users')}>Leave</button><button onClick={()=>setPreview(v=>!v)}>Preview</button><button onClick={()=>setMounted(v=>!v)}>Mount</button>
 <button onClick={()=>setCache(JSON.stringify(queryClient.getQueryCache().getAll().map(q=>({key:q.queryKey,data:q.state.data,invalidated:q.state.isInvalidated,observers:q.getObserversCount()}))))}>Cache</button>
 <button onClick={()=>{for(const resource of ['users','students','audit','frequency'])queryClient.setQueryData(['session',auth.sessionScope,'ADMIN',String(auth.user?.id),'admin','dashboard',resource],{fixture:true});}}>Seed</button>
 <button onClick={()=>auth.setUser({id:'2',role:'ADMIN',name:'Second',userName:'second'} as UserProfile)}>Switch</button>
 {(['TEACHER','PRINCIPAL','PARENT'] as const).map(role=><button key={role} onClick={()=>auth.setUser({id:'1',role,name:'Fixture',userName:'fixture'} as UserProfile)}>{role}</button>)}
 <button onClick={auth.logout}>Logout</button><button onClick={()=>void auth.login({id:'1',role:'ADMIN'} as UserProfile)}>Login</button>
 <RoutePreviewContext.Provider value={preview}>{mounted&&<AdminStudentsProvider><Panel/></AdminStudentsProvider>}</RoutePreviewContext.Provider></>;}
const app=<AuthProvider><MemoryRouter initialEntries={['/admin/users']}><Harness/></MemoryRouter></AuthProvider>;
createRoot(document.getElementById('root')!).render(new URL(location.href).searchParams.has('strict')?<StrictMode>{app}</StrictMode>:app);

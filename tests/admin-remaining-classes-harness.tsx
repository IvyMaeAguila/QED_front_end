import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation,useNavigate} from 'react-router-dom';
import {AuthProvider,useAuth} from '../src/features/auth/context/authContext';
import {AdminSchoolProvider} from '../src/features/profiles/admin/query/AdminSchoolProvider';
import {useClasses} from '../src/features/profiles/admin/pages/classes/context/ClassesContext';
import {useTeachers} from '../src/features/profiles/admin/pages/classes/context/TeachersContext';
import {RoutePreviewContext} from '../src/shared/loading/RoutePreview';
import {queryClient} from '../src/shared/query/queryClient';
import type {UserProfile} from '../src/shared/profile/types/types';
const payload={gradeLevelId:1,section:' Maroon ',room:' 101 ',subjectName:'Mathematics',adviserId:'7',schedule:[{id:'1',subject:'Mathematics',teacherId:'7',startTime:'08:00',endTime:'09:00',days:['Mon' as const]}]};
export function Panel(){const c=useClasses(),t=useTeachers(),location=useLocation(),[result,setResult]=useState('');const {activateQueries}=c;useEffect(()=>{if(location.pathname==='/admin/classes')activateQueries();},[location.pathname,activateQueries]);const write=(p:Promise<unknown>)=>{setResult('pending');void p.then(()=>setResult('success'),e=>setResult(e.message));};return <>
 <output data-testid="data">{JSON.stringify(c.classes)}</output><output data-testid="teachers">{JSON.stringify(t.teachers)}</output><output data-testid="loading">{String(c.loading||t.loading)}</output><output data-testid="error">{c.error??t.error??''}</output><output data-testid="result">{result}</output>
 <button onClick={()=>{c.refreshClasses();t.refetchTeachers();}}>Retry</button><button onClick={()=>write(c.createClass(payload).then(()=>c.refreshClasses()))}>Create</button><button onClick={()=>write(c.updateClass('1',payload).then(()=>c.refreshClasses()))}>Update</button><button onClick={()=>write(c.deleteClass('1'))}>Delete</button>
 </>;}
export function Harness(){const auth=useAuth(),navigate=useNavigate(),[preview,setPreview]=useState(true),[cache,setCache]=useState(''),[mounted,setMounted]=useState(true);return <>
 <output data-testid="auth">{auth.isLoading?'pending':auth.user?.id??'signed-out'}</output><output data-testid="cache">{cache}</output>
 <button onClick={()=>navigate('/admin/classes')}>Open</button><button onClick={()=>navigate('/admin/users')}>Leave</button><button onClick={()=>setPreview(v=>!v)}>Preview</button><button onClick={()=>setMounted(v=>!v)}>Mount</button>
 <button onClick={()=>setCache(JSON.stringify(queryClient.getQueryCache().getAll().map(q=>({key:q.queryKey,data:q.state.data,invalidated:q.state.isInvalidated}))))}>Cache</button>
 <button onClick={()=>auth.setUser({id:'2',role:'ADMIN',name:'Second',userName:'second'} as UserProfile)}>Switch</button>{(['TEACHER','PRINCIPAL','PARENT'] as const).map(role=><button key={role} onClick={()=>auth.setUser({id:'1',role,name:'Fixture',userName:'fixture'} as UserProfile)}>{role}</button>)}
 <button onClick={auth.logout}>Logout</button><button onClick={()=>void auth.login({id:'1',role:'ADMIN'} as UserProfile)}>Login</button>
 <RoutePreviewContext.Provider value={preview}>{mounted&&<AdminSchoolProvider><Panel/></AdminSchoolProvider>}</RoutePreviewContext.Provider></>;}
createRoot(document.getElementById('root')!).render(<AuthProvider><MemoryRouter initialEntries={['/admin/users']}><Harness/></MemoryRouter></AuthProvider>);

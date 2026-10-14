import {lazy,Suspense,useCallback,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useAuth} from '@shared/hooks/useAuth';
import {useRoutePreview} from '@shared/loading/RoutePreview';
import {StudentsProvider,useStudents,type StudentsContextValue} from '../pages/studentrecords/context/StudentsContext';
import type {Student} from '../pages/studentrecords/types/Students';
const Driver=lazy(()=>import('./AdminStudentsQueries'));
export interface AdminStudentsDriverProps {seed?:{data:Student[];updatedAt:number};publish:(value:StudentsContextValue|undefined)=>void;isCurrent:()=>boolean;}
const pending={students:[],loading:true,error:null,retry:()=>{}};
function BootstrapObserver({publish}:{publish:(seed:{data:Student[];updatedAt:number}|undefined)=>void}){
 const {students,serverUpdatedAt}=useStudents();
 useLayoutEffect(()=>{publish(serverUpdatedAt?{data:students,updatedAt:serverUpdatedAt}:undefined);},[students,serverUpdatedAt,publish]);return null;
}
function Session({children}:{children:ReactNode}){
 const {user,isLoading}=useAuth(),preview=useRoutePreview();
 const [retired,setRetired]=useState(false),[seed,setSeed]=useState<AdminStudentsDriverProps['seed']>(),[bridge,setBridge]=useState<StudentsContextValue>();
 const active=useRef(false);useLayoutEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const isCurrent=useCallback(()=>active.current,[]),publish=useCallback((value:StudentsContextValue|undefined)=>{if(active.current){setBridge(value);if(value)setSeed(undefined);}},[]);
 const activate=useCallback(()=>{if(!preview&&!isLoading&&user?.role==='ADMIN')setRetired(true);},[preview,isLoading,user?.role]);
 return <StudentsProvider bootstrapEnabled={!preview&&!isLoading&&user?.role==='ADMIN'} reader={retired?bridge?{students:bridge.students,loading:bridge.loading,error:bridge.error,retry:()=>void bridge.refetch()}:pending:undefined} operations={bridge} activateQueries={activate}>
  {!retired&&<BootstrapObserver publish={setSeed}/>}
  {retired&&<Suspense fallback={null}><Driver seed={seed} publish={publish} isCurrent={isCurrent}/></Suspense>}
  {children}
 </StudentsProvider>;
}
export function AdminStudentsProvider({children}:{children:ReactNode}){const {sessionScope,user}=useAuth();return <Session key={`${sessionScope}:${user?.role}:${user?.id}`}>{children}</Session>;}

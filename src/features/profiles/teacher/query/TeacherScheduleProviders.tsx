import {lazy,Suspense,useCallback,useState,type ReactNode} from 'react';
import {useAuth} from '@shared/hooks/useAuth';
import {ClassesProvider,type ClassesReader} from '../../admin/pages/classes/context/ClassesContext';
import {TeachersProvider,type TeachersReader} from '../../admin/pages/classes/context/TeachersContext';
const Driver=lazy(()=>import('./TeacherScheduleQueries'));
export interface TeacherScheduleSnapshot {classes:ClassesReader;teachers:TeachersReader;}
const pending:TeacherScheduleSnapshot={classes:{data:[],loading:true,error:null,retry:()=>{}},teachers:{data:[],loading:true,error:null,retry:()=>{}}};
// Keep the role shell/unsaved forms mounted. Only the lazy driver is session-keyed.
export function TeacherScheduleProviders({children}:{children:ReactNode}){
 const {user,sessionScope}=useAuth();const identity=`${sessionScope}:${user?.role}:${user?.id}`;
 const [snapshot,setSnapshot]=useState<{identity:string;data:TeacherScheduleSnapshot|null}|null>(null);
 const publish=useCallback((data:TeacherScheduleSnapshot|null)=>setSnapshot({identity,data}),[identity]);
 const data=snapshot?.identity===identity?snapshot.data??pending:pending;
 return <ClassesProvider reader={data.classes}><TeachersProvider reader={data.teachers}><Suspense fallback={null}><Driver key={identity} onChange={publish}/></Suspense>{children}</TeachersProvider></ClassesProvider>;
}

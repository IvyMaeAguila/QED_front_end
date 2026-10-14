import {lazy,Suspense,useCallback,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useAuth} from '@shared/hooks/useAuth';
import {useRoutePreview} from '@shared/loading/RoutePreview';
import {ClassesProvider,useClasses,type ClassesContextValue,type ClassesReader} from '../pages/classes/context/ClassesContext';
import {TeachersProvider,useTeachers,type TeachersReader} from '../pages/classes/context/TeachersContext';
const Driver=lazy(()=>import('./AdminSchoolQueries'));
type Seed<T>={data:T[];updatedAt:number};
export interface AdminSchoolBridge{classes:ClassesReader;teachers:TeachersReader;operations:Pick<ClassesContextValue,'deleteClass'|'createClass'|'updateClass'>;}
export interface AdminSchoolDriverProps{seeds?:{classes?:Seed<ClassesContextValue['serverRows'][number]>;teachers?:Seed<ReturnType<typeof useTeachers>['serverRows'][number]>};publish:(value:AdminSchoolBridge|undefined)=>void;isCurrent:()=>boolean;}
const pending={data:[],loading:true,error:null,retry:()=>{}};
function Observer({publish}:{publish:(seed:AdminSchoolDriverProps['seeds'])=>void}){const c=useClasses(),t=useTeachers();useLayoutEffect(()=>{publish({classes:c.serverUpdatedAt?{data:c.serverRows,updatedAt:c.serverUpdatedAt}:undefined,teachers:t.serverUpdatedAt?{data:t.serverRows,updatedAt:t.serverUpdatedAt}:undefined});},[c.serverRows,c.serverUpdatedAt,t.serverRows,t.serverUpdatedAt,publish]);return null;}
function Session({children}:{children:ReactNode}){
 const {user,isLoading}=useAuth(),preview=useRoutePreview(),ready=!preview&&!isLoading&&user?.role==='ADMIN';
 const [retired,setRetired]=useState(false),[seeds,setSeeds]=useState<AdminSchoolDriverProps['seeds']>(),[bridge,setBridge]=useState<AdminSchoolBridge>();
 const active=useRef(false),bootstrap=useRef(true);useLayoutEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const isBootstrapCurrent=useCallback(()=>bootstrap.current,[]);
 const isCurrent=useCallback(()=>active.current,[]),activate=useCallback(()=>{if(ready){bootstrap.current=false;setRetired(true);}},[ready]);
 const publish=useCallback((value:AdminSchoolBridge|undefined)=>{if(active.current){setBridge(value);if(value)setSeeds(undefined);}},[]);
 return <TeachersProvider bootstrapEnabled={ready} isBootstrapCurrent={isBootstrapCurrent} reader={retired?bridge?.teachers??pending:undefined} activateQueries={activate}><ClassesProvider bootstrapEnabled={ready} isBootstrapCurrent={isBootstrapCurrent} reader={retired?bridge?.classes??pending:undefined} operations={bridge?.operations} activateQueries={activate}>
 {!retired&&<Observer publish={setSeeds}/>}{retired&&<Suspense fallback={null}><Driver seeds={seeds} publish={publish} isCurrent={isCurrent}/></Suspense>}{children}
 </ClassesProvider></TeachersProvider>;
}
export function AdminSchoolProvider({children}:{children:ReactNode}){const {sessionScope,user}=useAuth();return <Session key={`${sessionScope}:${user?.role}:${user?.id}`}>{children}</Session>;}

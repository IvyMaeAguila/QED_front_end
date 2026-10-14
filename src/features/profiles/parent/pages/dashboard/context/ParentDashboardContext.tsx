import {createContext,lazy,Suspense,useCallback,useContext,useRef,useState,type ReactNode} from 'react';
import {useRouteEffect as useEffect,useRoutePreview} from '@shared/loading/RoutePreview';
import {useAuth} from '@shared/hooks/useAuth';
import {useNotifications} from '@shared/notification/NotificationContext';
import {enrolledChildrenService} from '../../EnrollledStudent/services/enrolledStudent.service';
import {dailyUpdateService} from '../services/dashboard.service';
import type {ReaderValue,DashboardSeeds} from '../../../query/drivers/ParentDashboardQueries';
import type {LinkStudentInput,CardViewMode} from '../types/student';
const Driver=lazy(()=>import('../../../query/drivers/ParentDashboardQueries'));
const Context=createContext<ReaderValue|undefined>(undefined);
// Query-free authenticated bootstrap hands off successful data with its original
// timestamp, then retires its requests/projections. The role shell stays mounted.
export function ParentDashboardProvider({children}:{children:ReactNode}) {
 const {user,isLoading,sessionScope,expireSession}=useAuth(),preview=useRoutePreview();
 const {activateParentQueries}=useNotifications();
 const [active,setActive]=useState(false),[snapshot,setSnapshot]=useState<ReaderValue>();
 const [bootstrap,setBootstrap]=useState<{studentsLoading:boolean;dailyLoading:boolean;studentsError:string|null;dailyError:string|null;done:boolean}>({studentsLoading:true,dailyLoading:true,studentsError:null,dailyError:null,done:false});
 const [seeds,setSeeds]=useState<DashboardSeeds>();
 const [viewMode,setViewMode]=useState<CardViewMode>('grid'),[linkError,setLinkError]=useState<string|null>(null);
 const queue=useRef<{input:LinkStudentInput;resolve:()=>void;reject:(error:Error)=>void}[]>([]);
 const publish=useCallback((value:ReaderValue)=>{setSnapshot(value);setSeeds(previous=>previous?undefined:previous);const waiting=queue.current.splice(0);for(const action of waiting)void value.submitLinkForm(action.input).then(action.resolve,action.reject);},[]);
 useEffect(()=>{
  if(active||isLoading||user?.role!=='PARENT')return;
  let current=true;const controller=new AbortController(),options={signal:controller.signal,onUnauthorized:()=>{if(current&&!controller.signal.aborted)expireSession(sessionScope);}};
  const students=enrolledChildrenService.getEnrolledChildren(options).then(result=>{if(!current)return;if(!result.success)throw new Error(result.message||'Failed to load linked students.');const receivedAt=Date.now();setSeeds(previous=>({...previous,students:{data:result.students,updatedAt:receivedAt}}));}).catch(error=>{if(current){if(navigator.onLine)setSeeds(previous=>({...previous,errors:{...previous?.errors,students:error instanceof Error?error:new Error("Can't connect to server, try again.")}}));setBootstrap(previous=>({...previous,studentsError:error instanceof Error?error.message:"Can't connect to server, try again."}));}}).finally(()=>{if(current)setBootstrap(previous=>({...previous,studentsLoading:false}));});
  const daily=dailyUpdateService.getDailyUpdatesForParent(options).then(result=>{if(!current)return;if(!result.success)throw new Error(result.message||'Failed to load daily updates.');const receivedAt=Date.now();setSeeds(previous=>({...previous,daily:{data:result.dailyUpdates,updatedAt:receivedAt}}));}).catch(error=>{if(current){if(navigator.onLine)setSeeds(previous=>({...previous,errors:{...previous?.errors,daily:error instanceof Error?error:new Error("Can't connect to server, try again.")}}));setBootstrap(previous=>({...previous,dailyError:error instanceof Error?error.message:"Can't connect to server, try again."}));}}).finally(()=>{if(current)setBootstrap(previous=>({...previous,dailyLoading:false}));});
  void Promise.all([students,daily]).then(()=>{if(current){setBootstrap(previous=>({...previous,done:true}));if(navigator.onLine)setActive(true);}});
  return()=>{current=false;controller.abort();};
 },[active,isLoading,user?.role,sessionScope,expireSession]);
 useEffect(()=>{const online=()=>{if(bootstrap.done)setActive(true);};window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[bootstrap.done]);
 useEffect(()=>{if(active)activateParentQueries?.();},[active,activateParentQueries]);
 useEffect(()=>()=>{for(const action of queue.current.splice(0))action.reject(new Error('Your session changed. Please sign in again.'));},[]);
 const value:ReaderValue=snapshot??{
  students:seeds?.students?.data??[],isLoadingStudents:bootstrap.studentsLoading,studentsError:bootstrap.studentsError,refetchStudents:async()=>{if(navigator.onLine)setActive(true);},
  dailyUpdates:seeds?.daily?.data??[],isLoadingDailyUpdates:bootstrap.dailyLoading,dailyUpdatesError:bootstrap.dailyError,refetchDailyUpdates:async()=>{if(navigator.onLine)setActive(true);},
  viewMode,setViewMode,isVerifyModalOpen:false,pendingMatch:null,linkError,isVerifying:false,isConfirming:false,
  submitLinkForm:input=>{if(!navigator.onLine){setLinkError("You're offline. Reconnect and try again.");return Promise.resolve();}setLinkError(null);return new Promise<void>((resolve,reject)=>{queue.current.push({input,resolve,reject});setActive(true);});},confirmMatch:async()=>{},rejectMatch:()=>{},
 };
 return <Context.Provider value={value}>{active&&!preview&&<Suspense fallback={null}><Driver onChange={publish} seeds={seeds} initialViewMode={viewMode}/></Suspense>}{children}</Context.Provider>;
}
export function useParentDashboard(){const value=useContext(Context);if(!value)throw new Error('ParentDashboardProvider is required.');return value;}

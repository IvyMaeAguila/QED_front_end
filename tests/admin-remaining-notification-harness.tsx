import { SettingsProvider } from "../src/features/profiles/admin/pages/settings/context/SettingsContext";
import { ToastProvider } from "../src/shared/context/ToastContext";
import { StrictMode, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthContext } from '../src/features/auth/context/authContext';
import type { UserProfile } from '../src/shared/profile/types/types';
import { NotificationProvider, useNotifications } from '../src/shared/notification/NotificationContext';
import { notificationService, type Notification } from '../src/shared/notification/Notification.service';
import { nextQuerySession } from '../src/shared/query/sessionQueries';
import { queryClient } from '../src/shared/query/queryClient';
const listeners=new Set<(n:Notification)=>void>(),listenerChanges=new Set<()=>void>();
const subscribeListeners=(callback:()=>void)=>{listenerChanges.add(callback);return()=>{listenerChanges.delete(callback);};};
const notifyListeners=()=>{for(const callback of listenerChanges)callback();};
notificationService.subscribe=(_id,callback)=>{listeners.add(callback);notifyListeners();return()=>{listeners.delete(callback);notifyListeners();};};
export function Probe(){const n=useNotifications(),activeListeners=useSyncExternalStore(subscribeListeners,()=>listeners.size),queryActive=useSyncExternalStore(callback=>queryClient.getQueryCache().subscribe(callback),()=>queryClient.getQueryCache().getAll().some(q=>q.queryKey[2]==="ADMIN"&&q.queryKey.at(-1)==="notifications"&&q.getObserversCount()>0));return <><output data-testid="query-ready">{String(activeListeners>0&&queryActive)}</output><output data-testid="rows">{n.notifications.map(n=>n.title).join(',')}</output><output data-testid="unread">{n.unreadCount}</output><button onClick={()=>n.markAllAsRead()}>Mark all</button><button onClick={()=>n.markAsRead(1)}>Mark one</button><button onClick={()=>n.activateAdminQueries?.()}>Activate Query</button><button onClick={()=>{for(const callback of listeners)callback({id:99,title:'Socket fixture',message:'Synthetic',type:'info',studentId:null,studentName:null,refKey:null,isRead:false,createdAt:new Date().toISOString()});}}>Socket event</button></>;}
export function Harness(){
 const [id,setId]=useState('101'),[scope,setScope]=useState(nextQuerySession),[ready,setReady]=useState(false),[expired,setExpired]=useState(0),[mounted,setMounted]=useState(true);
 const current=useRef(scope);useLayoutEffect(()=>{current.current=scope;},[scope]);
 const change=(id:string)=>{const next=nextQuerySession();current.current=next;setId(id);setScope(next);};
 const requestedRole=new URLSearchParams(location.search).get('role');
 const role=requestedRole==='ADMIN'||requestedRole==='TEACHER'?requestedRole:'PRINCIPAL';
 const user={id,role,name:'Synthetic',userName:'synthetic',email:'fixture@example.test'} as UserProfile;
 return <AuthContext.Provider value={{user,isLoading:!ready,sessionScope:scope,mustChangePassword:false,expireSession:expected=>{if(expected===current.current)setExpired(n=>n+1);},login:async()=>{},logout:()=>change('202'),setUser:()=>{},clearMustChangePassword:()=>{}}}>
 <button onClick={()=>setReady(v=>!v)}>Ready</button><button onClick={()=>change(id==='101'?'202':'101')}>Switch account</button><button onClick={()=>setMounted(v=>!v)}>Mount</button><button onClick={()=>{void queryClient.invalidateQueries();}}>Invalidate</button><output data-testid="expired">{expired}</output>
 {mounted&&<NotificationProvider><Probe/></NotificationProvider>}
 </AuthContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><SettingsProvider><ToastProvider><Harness/></ToastProvider></SettingsProvider></StrictMode>);

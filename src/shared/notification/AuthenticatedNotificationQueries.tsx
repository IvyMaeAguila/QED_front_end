import {safeReadOptions} from '@shared/query/safeReadPolicy';
import {NotificationSnapshot} from './notificationSnapshot';
import { useToast } from "@shared/context/ToastContext";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { onlineManager, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@shared/hooks/useAuth';
import { useRoutePreview } from '@shared/loading/RoutePreview';
import { queryClient } from '@shared/query/queryClient';
import type { NotificationContextType } from './NotificationContext';
import { notificationService, type Notification } from './Notification.service';

export type NotificationQueryProps = {onChange: (value: NotificationContextType | null) => void; expectedRole?: "PRINCIPAL" | "TEACHER" | "ADMIN" | "PARENT";seed?:{data:Notification[];updatedAt:number;error?:Error|null}};
const notificationKeys = (session: number, role: string, id: string) => ['session',session,role,id,role.toLowerCase(),'notifications'] as const;
function Driver({onChange,expectedRole='PRINCIPAL',seed}: NotificationQueryProps) {
 const {user,isLoading,sessionScope,expireSession} = useAuth();
 const { showToast } = useToast();
 const preview = useRoutePreview();
 const enabled = !preview && !isLoading && user?.role === expectedRole;
 const active = useRef(false);
 useLayoutEffect(()=>{active.current=true;onlineManager.setOnline(navigator.onLine);return()=>{active.current=false;};},[]);
 const userId=user?.id, role=user?.role??'';
 const key=useMemo(()=>notificationKeys(sessionScope,role,String(userId??'')),[sessionScope,role,userId]);
 const snapshots=useRef(new NotificationSnapshot());
 const [readError,setReadError]=useState<Error|null>(seed?.error??null);
 const errorRef=useRef(readError);errorRef.current=readError;
 const forbidden = () => {
   const error = errorRef.current??queryClient.getQueryState(key)?.error;
   return error instanceof Error && 'status' in error && [401,403].includes(Number(error.status));
 };
 const options=(signal?: AbortSignal)=>({signal,onUnauthorized:()=>{if(active.current&&!signal?.aborted)expireSession(sessionScope);}});
 const query=useQuery({...safeReadOptions,queryKey:key,enabled,staleTime:30_000,gcTime:5*60_000,initialData:seed?.data,initialDataUpdatedAt:seed?.error?0:seed?.updatedAt,
   refetchInterval:enabled?30_000:false,refetchIntervalInBackground:true,refetchOnWindowFocus:false,refetchOnReconnect:true,
   queryFn:async({signal})=>{
     const started=snapshots.current.start();
     try{const items=await notificationService.getAll(user!.id,options(signal));
       if(!signal.aborted&&active.current)setReadError(null);
       return snapshots.current.reconcile(items,started);
     }catch(error){if(!signal.aborted&&active.current)setReadError(error instanceof Error?error:new Error('Notifications unavailable.'));throw error;}
   }});
 const write=useMutation({retry:false,networkMode:'always',mutationFn:async(id: number | null)=>{
   if(!enabled||!active.current||!onlineManager.isOnline())throw new Error('Notifications unavailable.');
   if(id===null)await notificationService.markAllAsRead(user!.id,options());
   else await notificationService.markAsRead(id,options());
   return id;
 },onSuccess:async(id)=>{
   if(!active.current)return;
   if (!forbidden()) queryClient.setQueryData<Notification[]>(key,rows=>rows?.map(n=>id===null||id===n.id?{...n,isRead:true}:n));
   await queryClient.invalidateQueries({queryKey:key});
 }});
 const refetch=query.refetch, mutateAsync=write.mutateAsync;
 useEffect(()=>{
   if(!enabled)return;
   const refresh=()=>{if(active.current&&onlineManager.isOnline())void refetch({cancelRefetch:false});};
   const unsubscribe=notificationService.subscribe(userId!,n=>{
     const error=errorRef.current??queryClient.getQueryState(key)?.error;
     if(!active.current || (error instanceof Error && 'status' in error && [401,403].includes(Number(error.status))))return;
     snapshots.current.push(n);
     queryClient.setQueryData<Notification[]>(key,rows=>[n,...(rows??[]).filter(row=>row.id!==n.id)].sort((a,b)=>b.id-a.id));
   },refresh);
   window.addEventListener('focus',refresh);
   return()=>{window.removeEventListener('focus',refresh);unsubscribe();};
 },[enabled,userId,key,refetch]);
 useEffect(()=>{
   const error=readError??query.error;
   const denied=error instanceof Error&&'status' in error&&[401,403].includes(Number(error.status));
   const notifications=enabled&&!denied?query.data??[]:[];
   onChange({notifications,readError:error,readLoading:query.isFetching&&!query.data,retryRead:()=>{if(enabled&&onlineManager.isOnline())void refetch({cancelRefetch:false});},unreadCount:notifications.filter(n=>!n.isRead).length,
     markAsRead:id=>{void mutateAsync(id).catch(()=>{if(active.current)showToast("Could not mark notification as read. Please try again.","error");});},markAllAsRead:()=>{void mutateAsync(null).catch(()=>{if(active.current)showToast("Could not mark notifications as read. Please try again.","error");});}});
 },[enabled,query.data,query.error,query.isFetching,readError,onChange,mutateAsync,showToast,refetch]);
 return null;
}
export default function AuthenticatedNotificationQueries(props: NotificationQueryProps) {
 return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;
}

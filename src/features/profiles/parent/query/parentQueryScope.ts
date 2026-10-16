import {useCallback,useLayoutEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import {onlineManager} from '@tanstack/react-query';
import {useAuth} from '@shared/hooks/useAuth';
import {useRoutePreview} from '@shared/loading/RoutePreview';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
const subscribe=(notify:()=>void)=>onlineManager.subscribe(notify);
export const parentOfflineMessage="You're offline. Reconnect and try again.";
export function useParentQueryScope(){
 const {user,isLoading,sessionScope,expireSession}=useAuth(),preview=useRoutePreview();
 const enabled=!preview&&!isLoading&&user?.role==='PARENT',active=useRef(false);
 const online=useSyncExternalStore(subscribe,()=>onlineManager.isOnline());
 const key=useMemo(()=>['session',sessionScope,user?.role??'',String(user?.id??''),'parent'] as const,[sessionScope,user?.role,user?.id]);
 useLayoutEffect(()=>{active.current=true;onlineManager.setOnline(navigator.onLine);return()=>{active.current=false;};},[sessionScope,enabled]);
 const request=useCallback((signal:AbortSignal):ApiRequestOptions=>({signal,onUnauthorized:()=>{if(active.current&&!signal.aborted)expireSession(sessionScope);}}),[expireSession,sessionScope]);
 // Uncancelled writes may finish after navigation. Auth checks the captured generation.
 const mutationRequest=useCallback(():ApiRequestOptions=>({onUnauthorized:()=>expireSession(sessionScope)}),[expireSession,sessionScope]);
 const options=useMemo(()=>({enabled,staleTime:30_000,gcTime:300_000,retry:false as const,refetchOnWindowFocus:false,refetchOnReconnect:true}),[enabled]);
 const generation=useRef(sessionScope);
 useLayoutEffect(()=>{generation.current=sessionScope;},[sessionScope]);
 const isCurrent=useCallback(()=>active.current&&generation.current===sessionScope,[sessionScope]);
 return {key,enabled,online,request,mutationRequest,options,isCurrent};
}

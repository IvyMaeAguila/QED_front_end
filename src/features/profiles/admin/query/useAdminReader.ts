import {useQuery} from '@tanstack/react-query';
import {useCallback,useEffect,useMemo,useRef} from 'react';
import {useLocation} from 'react-router-dom';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {adminOfflineMessage,useAdminQueryScope} from './adminQueryScope';
export function useAdminReader<T>(resource:readonly unknown[],fetcher:(options:ApiRequestOptions)=>Promise<T>,message:string,ready=true,seed?:{data?:T;updatedAt?:number},staleTime=30_000){
 const scope=useAdminQueryScope();
 const query=useQuery({...scope.options,enabled:scope.enabled&&ready,staleTime,queryKey:[...scope.key,...resource],queryFn:({signal})=>fetcher(scope.request(signal)),initialData:seed?.data,initialDataUpdatedAt:seed?.updatedAt},queryClient);
 const denied=query.error instanceof Error&&'status'in query.error&&[401,403].includes(Number(query.error.status));
 const data=scope.enabled&&!denied?query.data:undefined,offline=!scope.online||query.isPaused;
 const loading=!scope.enabled||!ready||(!offline&&(query.isFetching||query.isPending));
 const error=!scope.enabled||!ready?null:denied?query.error?.message??message:offline?data===undefined?adminOfflineMessage:null:query.isFetching?null:query.isError?query.error?.message??message:null;
 const {refetch,isFetching,isPaused}=query;
 const retry=useCallback(async()=>{if(scope.enabled&&ready&&scope.online&&!isFetching&&!isPaused)await refetch({cancelRefetch:false});},[scope.enabled,ready,scope.online,isFetching,isPaused,refetch]);
 return useMemo(()=>({data,loading,error,offline,retry}),[data,loading,error,offline,retry]);
}
// Long-lived context readers need explicit navigation revalidation, not polling.
export function useAdminNavigationRefresh(resource:readonly unknown[],retry:()=>Promise<unknown>,consumer:RegExp,staleTime=30_000){
 const {pathname}=useLocation(),scope=useAdminQueryScope(),previous=useRef(pathname);
 useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;if(!scope.enabled||!consumer.test(pathname))return;const state=queryClient.getQueryState([...scope.key,...resource]);if(state&&(state.isInvalidated||Date.now()-state.dataUpdatedAt>=staleTime))void retry();},[pathname,scope.enabled,scope.key,resource,retry,consumer,staleTime]);
}
export function useAdminRetryAttempt(attempt:number,retry:()=>Promise<unknown>){const previous=useRef(attempt);useEffect(()=>{if(previous.current!==attempt){previous.current=attempt;void retry();}},[attempt,retry]);}

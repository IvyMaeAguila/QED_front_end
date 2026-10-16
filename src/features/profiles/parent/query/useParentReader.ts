import {useQuery} from '@tanstack/react-query';
import {useCallback,useEffect,useMemo,useRef} from 'react';
import {useLocation} from 'react-router-dom';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {parentOfflineMessage,useParentQueryScope} from './parentQueryScope';
import {childDenial,hideChildCache} from './parentChildCache';
export function useParentReader<T>(resource:readonly unknown[],fetcher:(options:ApiRequestOptions)=>Promise<T>,message:string,ready=true,seed?:{data?:T;updatedAt?:number},staleTime=30_000,refreshInterval?:number,policy?:{cancellable?:boolean;reconnect?:boolean;retryOnMount?:boolean}){
 const scope=useParentQueryScope();
 const query=useQuery({...scope.options,enabled:scope.enabled&&ready,staleTime,retryOnMount:policy?.retryOnMount??true,refetchOnReconnect:policy?.reconnect??true,refetchInterval:refreshInterval,queryKey:[...scope.key,...resource],queryFn:async context=>{
   const child=resource[0]==='student'?[...scope.key,...resource.slice(0,2)]:null;
   const previous=child?childDenial(child):undefined;
   try{const result=await fetcher(policy?.cancellable===false?scope.mutationRequest():scope.request(context.signal));const latest=child?childDenial(child):undefined;if(latest&&latest!==previous)throw latest;return result;}
   catch(error){if(child&&error instanceof Error&&'status'in error&&(Number(error.status)===403||Number(error.status)===404&&resource.includes('profile')))hideChildCache(child,error);throw error;}
 },initialData:seed?.data,initialDataUpdatedAt:seed?.updatedAt},queryClient);
 const denied=query.error instanceof Error&&'status'in query.error&&[401,403].includes(Number(query.error.status));
 const data=scope.enabled&&ready&&!denied?query.data:undefined,offline=!scope.online||query.isPaused;
 const loading=!scope.enabled||!ready||(!offline&&(query.isPending||query.isFetching&&(!refreshInterval||data===undefined)));
 const error=!scope.enabled||!ready?null:denied?query.error?.message??message:offline?data===undefined?parentOfflineMessage:null:query.isFetching?null:query.isError?query.error?.message??message:null;
 const {refetch,isFetching,isPaused}=query;
 const retry=useCallback(async()=>{if(scope.enabled&&ready&&scope.online&&!isFetching&&!isPaused)await refetch({cancelRefetch:false});},[scope.enabled,ready,scope.online,isFetching,isPaused,refetch]);
 return useMemo(()=>({data,loading,error,offline,retry,denied}),[data,loading,error,offline,retry,denied]);
}
// Long-lived context readers need explicit navigation revalidation, not polling.
export function useParentNavigationRefresh(resource:readonly unknown[],retry:()=>Promise<unknown>,consumer:RegExp,staleTime=30_000){
 const {pathname}=useLocation(),scope=useParentQueryScope(),previous=useRef(pathname);
 useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;if(!scope.enabled||!consumer.test(pathname))return;const state=queryClient.getQueryState([...scope.key,...resource]);if(state&&(state.isInvalidated||Date.now()-state.dataUpdatedAt>=staleTime))void retry();},[pathname,scope.enabled,scope.key,resource,retry,consumer,staleTime]);
}
export function useParentRetryAttempt(attempt:number,retry:()=>Promise<unknown>){const previous=useRef(attempt);useEffect(()=>{if(previous.current!==attempt){previous.current=attempt;void retry();}},[attempt,retry]);}

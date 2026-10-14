import {useCallback} from 'react';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {adminOfflineMessage,useAdminQueryScope} from './adminQueryScope';
// Imperative lookups used by import preflight/modals must not queue a promise
// indefinitely offline. Fresh authorized data can still be used immediately.
export function useAdminFetch(){
 const {enabled,online,isCurrent,key,options,request}=useAdminQueryScope();
 return useCallback(async<T,>(resource:readonly unknown[],fetcher:(options:ApiRequestOptions)=>Promise<T>,staleTime=30_000):Promise<T>=>{
  if(!enabled||!isCurrent())throw new Error('Your session is not ready.');
  const queryKey=[...key,...resource],state=queryClient.getQueryState<T>(queryKey);
  if(!online){if(state?.status==='success'&&!state.isInvalidated&&Date.now()-state.dataUpdatedAt<staleTime)return state.data!;throw new Error(adminOfflineMessage);}
  if(state?.status==='error')await queryClient.invalidateQueries({queryKey,exact:true,refetchType:'none'});
  const result=await queryClient.fetchQuery({...options,queryKey,staleTime,queryFn:({signal})=>fetcher(request(signal))});
  if(!isCurrent())throw new Error('Your session changed. Please sign in again.');return result;
 },[enabled,online,isCurrent,key,options,request]);
}

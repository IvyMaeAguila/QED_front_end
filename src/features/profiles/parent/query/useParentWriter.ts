import {useCallback,useRef} from 'react';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {useParentQueryScope} from './parentQueryScope';
export function useParentWriter<V,T>(write:(variables:V,options:ApiRequestOptions)=>Promise<T>,success?:(data:T,variables:V,key:readonly unknown[])=>void|Promise<void>,resource:readonly unknown[]=['write',write.name]){
 const {enabled,online,isCurrent,mutationRequest,key}=useParentQueryScope();
 const pending=useRef(new Map<string,Promise<T>>());
 const {mutateAsync}=useMutation({mutationKey:[...key,...resource],gcTime:300_000,retry:false,networkMode:'always',mutationFn:async(variables:V)=>{if(!enabled||!isCurrent())throw new Error('Your session is not ready.');if(!online)throw new Error("You're offline. Reconnect and try again.");return write(variables,mutationRequest());},onSuccess:async(data,variables)=>{if(isCurrent())await success?.(data,variables,key);}},queryClient);
 return useCallback((variables:V)=>{const id=JSON.stringify(variables),existing=pending.current.get(id);if(existing)return existing;const promise=(async()=>{try{const result=await mutateAsync(variables);if(!isCurrent())throw new Error('Your session changed. Please sign in again.');return result;}finally{pending.current.delete(id);}})();pending.current.set(id,promise);return promise;},[mutateAsync,isCurrent]);
}

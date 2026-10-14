import {useCallback} from 'react';
import {useMutation} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {useAdminQueryScope} from './adminQueryScope';
export function useAdminWriter<V,T>(write:(variables:V,options:ApiRequestOptions)=>Promise<T>,success?:(data:T,variables:V,key:readonly unknown[])=>void|Promise<void>){
 const {enabled,online,isCurrent,mutationRequest,key}=useAdminQueryScope();
 const {mutateAsync}=useMutation({retry:false,networkMode:'always',mutationFn:async(variables:V)=>{if(!enabled||!isCurrent())throw new Error('Your session is not ready.');if(!online)throw new Error("You're offline. Reconnect and try again.");return write(variables,mutationRequest());},onSuccess:async(data,variables)=>{if(isCurrent())await success?.(data,variables,key);}},queryClient);
 return useCallback(async(variables:V)=>{const result=await mutateAsync(variables);if(!isCurrent())throw new Error('Your session changed. Please sign in again.');return result;},[mutateAsync,isCurrent]);
}

import {useCallback,useSyncExternalStore} from 'react';
import {notifyManager,type QueryKey} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
const subscribe=(notify:()=>void)=>queryClient.getQueryCache().subscribe(notifyManager.batchCalls(notify));
// Cache state is external mutable state. An imperative read in render can be
// memoized by React Compiler and cannot reliably observe invalidate -> success.
export function useTeacherQueryInvalidation(key:QueryKey){
 const snapshot=useCallback(()=>queryClient.getQueryState(key)?.isInvalidated===true,[key]);
 return useSyncExternalStore(subscribe,snapshot,snapshot);
}

import { createContext, lazy, Suspense, useCallback, useContext, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';
import { useAuth } from '@shared/hooks/useAuth';
import { useRoutePreview } from '@shared/loading/RoutePreview';
const subscribe=(notify:()=>void)=>{window.addEventListener('online',notify);window.addEventListener('offline',notify);return()=>{window.removeEventListener('online',notify);window.removeEventListener('offline',notify);};};

// Existing Context remains the UI facade; only its data controller is lazy.
// This file deliberately has no Query imports or server-state cache.
export function createParentContextBridge<T,P extends object>(load:()=>Promise<{default:ComponentType<P&{onChange:(value:T)=>void}>}>,pending:(props:P)=>T) {
  let loaded=false;
  const Context=createContext<T|undefined>(undefined),Driver=lazy(async()=>{const module=await load();loaded=true;return module;});
  function Provider({children,...props}:P&{children:ReactNode}) {
    const {user,sessionScope,isLoading}=useAuth(),preview=useRoutePreview();
    const online=useSyncExternalStore(subscribe,()=>navigator.onLine),[activated,setActivated]=useState(online||loaded);
    if(online&&!activated)setActivated(true);
    const detail=props as Record<string,unknown>,student=detail.student as {id?:unknown}|undefined;
    const identity=JSON.stringify([sessionScope,user?.role,user?.id,detail.studentId,student?.id,detail.termKey]);
    const [snapshot,setSnapshot]=useState<{identity:string;value:T}>();
    const publish=useCallback((value:T)=>setSnapshot({identity,value}),[identity]);
    const fallback=pending(props as P);
    const offlineFallback={...fallback} as Record<string,unknown>;
    if(!online&&!activated){for(const field of ['loading','isLoading','monthsLoading'])if(field in offlineFallback)offlineFallback[field]=false;for(const field of ['error','monthsError'])if(field in offlineFallback)offlineFallback[field]="You're offline. Reconnect and try again.";}
    const value=snapshot?.identity===identity?snapshot.value:!online&&!activated?offlineFallback as T:fallback;
    return <Context.Provider value={value}>
      {activated&&!preview&&!isLoading&&user?.role==='PARENT'&&<Suspense fallback={null}><Driver {...props as P} key={identity} onChange={publish}/></Suspense>}
      {children}
    </Context.Provider>;
  }
  function useValue(){const value=useContext(Context);if(!value)throw new Error('Parent data provider is required.');return value;}
  return {Provider,useValue};
}

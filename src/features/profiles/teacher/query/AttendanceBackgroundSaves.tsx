import {useEffect,useLayoutEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {AttendanceSaveQueue} from './attendanceSaveQueue';
import {AttendanceSaveContext} from './useAttendanceSaves';
export function AttendanceBackgroundSaves({children}:{children:ReactNode}){
 const [queue]=useState(()=>new AttendanceSaveQueue());
 const jobs=useSyncExternalStore(queue.subscribe,queue.snapshot);
 const pending=jobs.filter(j=>j.state==='pending').length,failed=jobs.filter(j=>j.state==='failed');
 useLayoutEffect(()=>{queue.setActive(true);return()=>{queue.setActive(false);};},[queue]);
 useEffect(()=>{if(!jobs.length)return;const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',unload);return()=>window.removeEventListener('beforeunload',unload);},[jobs.length]);
 return <AttendanceSaveContext.Provider value={queue}>{children}{jobs.length>0&&<div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-900 shadow-lg" aria-live="polite">
 {pending>0&&<p role="status">Saving {pending} attendance change{pending===1?'':'s'} in the background…</p>}
 {failed.length>0&&<div role="alert"><p>{failed.length} attendance change{failed.length===1?'':'s'} could not be saved. {failed[0].error}</p><button type="button" className="mt-2 font-bold underline" disabled={pending>0} onClick={()=>queue.retry()}>Retry failed changes</button></div>}
 </div>}</AttendanceSaveContext.Provider>;
}

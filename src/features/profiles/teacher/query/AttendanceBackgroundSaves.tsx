import {useToast} from '@shared/context/ToastContext';
import {useEffect,useLayoutEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {AttendanceSaveQueue} from './attendanceSaveQueue';
import {AttendanceSaveContext} from './useAttendanceSaves';
export function AttendanceBackgroundSaves({children}:{children:ReactNode}){
 const [queue]=useState(()=>new AttendanceSaveQueue());
 const jobs=useSyncExternalStore(queue.subscribe,queue.snapshot);
 const {showToast}=useToast();
 const [showSaving,setShowSaving]=useState(false);
 useEffect(()=>{
  let cycle=false,notice:ReturnType<typeof setTimeout>|undefined,busy:ReturnType<typeof setTimeout>|undefined;
  const update=()=>{
   const current=queue.snapshot(),pending=current.some(job=>job.state==='pending');
   if(notice)clearTimeout(notice);
   if(pending){cycle=true;if(!busy)busy=setTimeout(()=>setShowSaving(true),700);return;}
   if(busy){clearTimeout(busy);busy=undefined;}setShowSaving(false);
   if(!cycle)return;
   notice=setTimeout(()=>{
    if(!queue.active)return;
    cycle=false;
    const failed=queue.snapshot().some(job=>job.state==='failed');
    showToast(failed?'Some attendance changes could not be saved. Retry the failed changes.':'Attendance changes saved.',failed?'error':'success');
   },1000);
  };
  const unsubscribe=queue.subscribe(update);update();
  return()=>{unsubscribe();if(notice)clearTimeout(notice);if(busy)clearTimeout(busy);};
 },[queue,showToast]);
 const pending=jobs.filter(j=>j.state==='pending').length,failed=jobs.filter(j=>j.state==='failed');
 useLayoutEffect(()=>{queue.setActive(true);return()=>{queue.setActive(false);};},[queue]);
 useEffect(()=>{if(!jobs.length)return;const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',unload);return()=>window.removeEventListener('beforeunload',unload);},[jobs.length]);
 return <AttendanceSaveContext.Provider value={queue}>{children}{((showSaving&&pending>0)||failed.length>0)&&<div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-900 shadow-lg" aria-live="polite">
 {showSaving&&pending>0&&<p role="status">Saving {pending} attendance change{pending===1?'':'s'} in the background…</p>}
 {failed.length>0&&<div role="alert"><p>{failed.length} attendance change{failed.length===1?'':'s'} could not be saved. {failed[0].error}</p><button type="button" className="mt-2 font-bold underline" disabled={pending>0} onClick={()=>queue.retry()}>Retry failed changes</button></div>}
 </div>}</AttendanceSaveContext.Provider>;
}

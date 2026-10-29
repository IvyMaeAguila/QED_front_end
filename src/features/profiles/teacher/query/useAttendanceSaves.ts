import {createContext,useContext,useSyncExternalStore} from 'react';
import {useSaveFeedback} from '@shared/components/useSaveFeedback';
import {AttendanceSaveQueue,type PendingMark} from './attendanceSaveQueue';
export const AttendanceSaveContext=createContext<AttendanceSaveQueue|null>(null);
const empty:ReturnType<AttendanceSaveQueue['snapshot']>=[];
const noop=()=>()=>{};
export function useAttendanceQueue(){const queue=useContext(AttendanceSaveContext);const jobs=useSyncExternalStore(queue?.subscribe??noop,queue?.snapshot??(()=>empty));return {queue,jobs};}
export function useAttendanceSaves(classId:string){
 const fallback=useSaveFeedback(classId,{showStatus:false});
 const {queue,jobs}=useAttendanceQueue();
 if(!queue)return {...fallback,background:false};
 const own=jobs.filter(j=>j.classId===classId);
 return {background:true,pending:own.filter(j=>j.state==='pending').length,hasFailures:own.some(j=>j.state==='failed'),saveFeedback:null,
 save:(action:()=>Promise<void>,key='save',marks:PendingMark[]=[])=>queue.enqueue(classId,key,action,marks)};
}

import type {AttendanceStatus} from '../pages/subjects/detail/types/Grading';
export type PendingMark={studentId:string;date:string;status:AttendanceStatus};
type Job={id:number;classId:string;key:string;action:()=>Promise<void>;marks:PendingMark[];state:'pending'|'failed';error?:string};
export class AttendanceSaveQueue {
 active=true;
 setActive(active:boolean){this.active=active;}
 private sequence=0;
 private jobs:Job[]=[];
 private listeners=new Set<()=>void>();
 private chains=new Map<string,Promise<boolean>>();
 private latest=new Map<string,number>();
 private barriers=new Map<string,Promise<boolean>>();
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 snapshot=()=>this.jobs;
 private publish(jobs:Job[]){this.jobs=jobs;for(const fn of this.listeners)fn();}
 enqueue(classId:string,key:string,action:()=>Promise<void>,marks:PendingMark[]=[]):Promise<boolean>{
  const identity=classId+':'+key,id=++this.sequence;
  this.latest.set(identity,id);
  const job:Job={id,classId,key,action,marks,state:'pending'};
  const bulk=key.startsWith('bulk-present:');
  const dependencies=bulk?[...this.chains.entries()].filter(([k])=>k.startsWith(classId+':')).map(([,v])=>v):[this.chains.get(identity),this.barriers.get(classId)].filter((v):v is Promise<boolean>=>!!v);
  this.publish([...this.jobs.filter(j=>!(j.classId===classId&&j.key===key&&j.state==='failed')),job]);
  const task=Promise.all(dependencies).then(async()=>{
   if(!this.active||this.latest.get(identity)!==id){this.publish(this.jobs.filter(j=>j.id!==id));return false;}
   try{await action();this.publish(this.jobs.filter(j=>j.id!==id));return true;}
   catch(error){this.publish(this.jobs.flatMap(j=>j.id!==id?[j]:this.latest.get(identity)===id?[{...j,state:'failed' as const,error:error instanceof Error?error.message:'Attendance could not be saved.'}]:[]));return false;}
  });
  this.chains.set(identity,task);if(bulk)this.barriers.set(classId,task);
  void task.then(()=>{if(this.chains.get(identity)===task)this.chains.delete(identity);if(this.barriers.get(classId)===task)this.barriers.delete(classId);});
  return task;
 }
 retry(){if(!this.active)return;for(const j of this.jobs.filter(j=>j.state==='failed'))void this.enqueue(j.classId,j.key,j.action,j.marks);}
}

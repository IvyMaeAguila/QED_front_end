import type { Notification } from './Notification.service';
/** Full owner-scoped snapshots replace prior rows. Only socket events that
 * arrive during the request can be newer than that snapshot. */
export class NotificationSnapshot {
 private revision=0;
 private arrivals=new Map<number,{revision:number;value:Notification}>();
 start(){return this.revision;}
 push(value:Notification){this.arrivals.set(value.id,{revision:++this.revision,value});}
 reconcile(rows:Notification[],started:number){
  const result=new Map(rows.map(row=>[row.id,row]));
  for(const [id,event] of this.arrivals){if(event.revision>started)result.set(id,event.value);else this.arrivals.delete(id);}
  return [...result.values()].sort((a,b)=>b.id-a.id);
 }
}

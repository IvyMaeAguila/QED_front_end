import type { AttendanceMap } from '../../subjects/detail/types/Grading';
import type { GradingPeriod, StudentHolisticProfile } from '../../holistic/services/holistic.service';

export function progressMonthOptions(terms: Pick<GradingPeriod, 'startDate' | 'endDate'>[]) {
 const months=new Set<string>();
 for(const term of terms){
  let month=term.startDate?.slice(0,7);const end=term.endDate?.slice(0,7);let limit=0;
  while(month&&end&&month<=end&&limit++<120){months.add(month);const[y,m]=month.split('-').map(Number);month=m===12?String(y+1)+'-01':String(y)+'-'+String(m+1).padStart(2,'0');}
 }
 return [...months].sort().map(key=>({key,label:new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(key+'-01T12:00:00Z'))}));
}
/** Match the parent's P/A/L ring semantics. Excused and unmarked remain separate. */
export function studentAttendanceProgress(attendance:AttendanceMap,studentId:string,month:string,terms:Pick<GradingPeriod,'startDate'|'endDate'>[]){
 const dates=new Set<string>();
 for(const marks of Object.values(attendance))for(const [date,status] of Object.entries(marks)){
  if(date.slice(0,7)===month&&['P','A','L','E'].includes(status??'')&&terms.some(t=>date>=t.startDate&&date<=t.endDate))dates.add(date);
 }
 const statusSummary={present:0,absent:0,late:0,excused:0};let unmarked=0;
 for(const date of dates){
  const status=attendance[studentId]?.[date];
  if(status==='P')statusSummary.present++;else if(status==='A')statusSummary.absent++;else if(status==='L')statusSummary.late++;else if(status==='E')statusSummary.excused++;else unmarked++;
 }
 return {schoolDays:dates.size,statusSummary,unmarked};
}
export function studentHolisticSnapshot(profile:StudentHolisticProfile|undefined,termLabel:string){
 if(!profile)return null;
 const domainScores=(['cognitive','emotional','behavioral','social'] as const).map(domain=>({domain,score:profile.overall.domainAverages[domain]}));
 const values=domainScores.map(d=>d.score).filter((v):v is number=>v!==null&&Number.isFinite(v));
 return {termLabel,domainScores,compositeScore:values.length?Math.round(values.reduce((sum,n)=>sum+n,0)/values.length*100)/100:null};
}

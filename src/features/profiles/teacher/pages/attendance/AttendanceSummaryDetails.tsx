import {lazy,Suspense,useId,useState} from 'react';
import {CalendarDays,UserRoundX,Undo2} from 'lucide-react';
import {LoadingRegion} from '@shared/loading/LoadingRegion';
import {SkeletonText} from '@shared/components/SkeletonLoading';
import type {AdminThemeContext} from '../../../admin/pages/AdminLayout';
import type {RosterStudent} from '../subjects/detail/data';
import type {DropoutReader} from './dropoutState';
import type {Dropout} from './services/dropout.service';
const StudentDropoutDialog=lazy(()=>import('./StudentDropoutDialog').then(module=>({default:module.StudentDropoutDialog})));
type View='all'|'absences'|'dropouts'|'transfers';
type Props={classId:string;classLabel:string;month:string;roster:RosterStudent[];absences:{iso:string;students:RosterStudent[]}[];totalAbsent:number;pending:boolean;attendanceError:string|null;dropoutReader:DropoutReader;theme:AdminThemeContext};
function dateLabel(date?:string|null){return date?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date.slice(0,10)+'T12:00:00Z')):'Not recorded';}
export function AttendanceSummaryDetails({classId,classLabel,month,roster,absences,totalAbsent,pending,attendanceError,dropoutReader:reader,theme}:Props){
 const {darkMode,panelBg,panelBorder,textPrimary,textMuted}=theme;
 const [view,setView]=useState<View>('all'),[selected,setSelected]=useState<Dropout|null>(null);const id=useId();
 const matching=reader.data?.classId===classId;
 const dropouts=matching?reader.data!.dropouts.filter(entry=>entry.effectiveDate.slice(0,7)===month):[];
 const transferIns=matching?(reader.data!.transferIns??[]).filter(entry=>entry.joinedDate.slice(0,7)===month):[];
 const dropoutLoading=pending||reader.loading||(!matching&&!reader.error);
 const tabs=[{key:'all',label:'All'},{key:'absences',label:'Absences'},{key:'dropouts',label:'Dropouts'},{key:'transfers',label:'Transfer-ins'}] as const;
 const surface='min-w-0 overflow-hidden rounded-[var(--radius-table)] border '+panelBorder;
 const head='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 '+panelBorder;
 const th='px-4 py-3 text-left text-xs font-semibold '+textMuted;
 const td='px-4 py-3 text-xs leading-relaxed '+textPrimary;
 const stickyHead=darkMode?'bg-panel-dark':'bg-brand-light';
 const tint=darkMode?'bg-white/[0.03]':'bg-brand-light';
 const name=(entry:Dropout)=>entry.studentName?.trim()||roster.find(s=>s.id===entry.studentId)?.name||'Student '+entry.studentId;
 return <div className="min-w-0 space-y-5" data-monthly-attendance-details="">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div><h3 className={'text-sm font-bold '+textPrimary}>Monthly records</h3><p className={'mt-0.5 text-xs '+textMuted}>Review absences, dropouts, and incoming transferees for the selected month.</p></div>
  <div role="tablist" aria-label="Monthly attendance details" className={'qed-segmented-control inline-flex w-full shrink-0 items-center rounded-lg p-0 sm:w-auto '+(darkMode?'bg-white/5':'bg-brand-light')}>
   {tabs.map((tab,index)=><button key={tab.key} id={id+'-'+tab.key} type="button" role="tab" aria-selected={view===tab.key} aria-controls={id+'-panel'} tabIndex={view===tab.key?0:-1} onClick={()=>setView(tab.key)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setView(tabs[target].key);document.getElementById(id+'-'+tabs[target].key)?.focus();}} className={'flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-bold transition-colors sm:px-3 sm:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40 sm:flex-none '+(view===tab.key?'bg-maroon text-white shadow-sm':textMuted)}>{tab.label}</button>)}
  </div>
 </div>
 <div id={id+'-panel'} role="tabpanel" aria-labelledby={id+'-'+view} className="min-w-0 space-y-5">
 {(view==='all'||view==='absences')&&<section className={surface} aria-label="Absences this month">
  <div className={head}><div className="flex items-center gap-2"><CalendarDays size={17} strokeWidth={1.75} style={{color:'var(--brand-ink)'}} aria-hidden="true"/><h3 className={'text-sm font-bold '+textPrimary}>Absences this month</h3></div><span className={'text-xs font-medium '+textMuted}>{pending?<SkeletonText width="12ch"/>:attendanceError?'Unavailable':`${totalAbsent} absence ${totalAbsent===1?'record':'records'}`}</span></div>
  {attendanceError?<p className={'px-4 py-7 text-center text-xs '+textMuted}>Attendance history is unavailable. Use Retry above to load absence records.</p>:<LoadingRegion loading={pending} variable name="monthly-absence-records" skeleton={null} frame={busy=>{
   const rows=busy?Array.from({length:3},(_,i)=>({iso:String(i),students:[]})):absences;
   return <div className="overflow-x-auto"><table className="w-full table-fixed text-left"><colgroup><col style={{width:112}}/><col/><col style={{width:80}}/></colgroup><thead className={tint}><tr><th scope="col" className={th}>Date</th><th scope="col" className={th}>Students</th><th scope="col" className={th+' text-right'}>Absent</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.iso} data-sk-region="attendance-absence-row" className={'border-t '+panelBorder}><td className={td+' whitespace-nowrap align-top'}>{busy?<SkeletonText width="12ch"/>:dateLabel(row.iso)}</td><td className={td}><ul className="space-y-1">{busy?<li><SkeletonText width="22ch"/></li>:row.students.map(student=><li key={student.id} className="break-words font-medium">{student.name}</li>)}</ul></td><td className={td+' text-right align-top font-semibold tabular-nums'} style={{color:'var(--brand-ink)'}}>{busy?<SkeletonText width="2ch"/>:row.students.length}</td></tr>)}
     {!busy&&!rows.length&&<tr><td colSpan={3} className={'px-4 py-8 text-center text-xs '+textMuted}>No absences recorded this month.</td></tr>}
    </tbody><tfoot className={tint}><tr className={'border-t '+panelBorder}><th scope="row" colSpan={2} className={th+' uppercase tracking-wide'}>Total absent</th><td className={td+' text-right font-bold tabular-nums'} style={{color:'var(--brand-ink)'}}>{busy?<SkeletonText width="2ch"/>:totalAbsent}</td></tr></tfoot></table></div>;
  }}>{null}</LoadingRegion>}
 </section>}
 {(view==='all'||view==='dropouts')&&<section className={surface} aria-label="Dropouts this month">
  <div className={head}><div><div className="flex items-center gap-2"><UserRoundX size={17} strokeWidth={1.75} style={{color:'var(--brand-ink)'}} aria-hidden="true"/><h3 className={'text-sm font-bold '+textPrimary}>Dropouts this month</h3></div><p className={'mt-1 text-xs leading-relaxed '+textMuted}>Declarations effective this month. Attendance is locked from the effective date.</p></div><span className={'shrink-0 text-xs font-medium '+textMuted}>{dropoutLoading?<SkeletonText width="10ch"/>:reader.error?'Unavailable':`${dropouts.length} ${dropouts.length===1?'student':'students'}`}</span></div>
  <LoadingRegion loading={dropoutLoading} error={reader.error} retry={reader.retry} variable name="monthly-dropout-records" skeleton={null} frame={busy=>{
   const rows=busy?Array.from({length:2},(_,index)=>({id:String(index),studentId:'',lastAttended:null,effectiveDate:'',reason:'',remarks:''} as Dropout)):dropouts;
   return <div className="overflow-x-auto"><table className="w-full table-fixed text-left" style={{minWidth:1070}}><colgroup>{[160,125,115,115,140,180,140,95].map((width,index)=><col key={index} style={{width}}/>)}</colgroup>
   <thead className={tint}><tr>{['Student','Grade and section','Last day attended','Effective date','Reason','Remarks','Declared by','Actions'].map(label=><th scope="col" key={label} className={th+(label==='Student'?' sticky left-0 z-10 '+stickyHead:label==='Actions'?' sticky right-0 z-10 border-l '+panelBorder+' '+stickyHead:'')}>{label}</th>)}</tr></thead>
   <tbody>{rows.map(entry=><tr key={entry.id} data-sk-region="monthly-dropout-row" className={'border-t '+panelBorder}>
    <td className={td+' sticky left-0 z-10 break-words align-top font-semibold '+panelBg}>{busy?<SkeletonText width="18ch"/>:name(entry)}</td><td className={td+' align-top'}>{busy?<SkeletonText width="13ch"/>:classLabel||'Not recorded'}</td>
    <td className={td+' align-top'}>{busy?<SkeletonText width="10ch"/>:dateLabel(entry.lastAttended)}</td><td className={td+' align-top font-medium'}>{busy?<SkeletonText width="10ch"/>:dateLabel(entry.effectiveDate)}</td>
    <td className={td+' break-words align-top'}>{busy?<SkeletonText width="15ch"/>:entry.reason}</td><td className={td+' break-words align-top '+textMuted}>{busy?<SkeletonText width="20ch"/>:entry.remarks||'No remarks'}</td>
    <td className={td+' break-words align-top'}>{busy?<SkeletonText width="16ch"/>:<><p className="font-medium">{entry.declaredByName?.trim()||'Not recorded'}</p><p className={'mt-0.5 text-xs '+textMuted}>{dateLabel(entry.declaredAt)}</p></>}</td>
    <td className={td+' sticky right-0 z-10 border-l align-top '+panelBorder+' '+panelBg}><button type="button" disabled={busy||!matching||!!reader.error} aria-label={'Reverse dropout declaration for '+(busy?'student':name(entry))} onClick={()=>setSelected(entry)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1.5 text-xs font-semibold transition-colors hover:bg-maroon/5 disabled:opacity-40" style={{color:'var(--brand-ink)'}}><Undo2 size={14} strokeWidth={1.75} aria-hidden="true"/>Reverse</button></td>
   </tr>)}{!busy&&!rows.length&&<tr><td colSpan={8} className={'px-4 py-8 text-center text-xs '+textMuted}>No dropout declarations effective this month.</td></tr>}</tbody></table>{!busy&&rows.length>0&&<p className={'border-t px-4 py-2 text-xs md:hidden '+panelBorder+' '+textMuted}>Scroll horizontally to view all declaration details.</p>}</div>;
  }}>{null}</LoadingRegion>
 </section>}
 {(view==='all'||view==='transfers')&&<section className={surface} aria-label="Transfer-ins this month">
  <div className={head}><div><h3 className={'text-sm font-bold '+textPrimary}>Transfer-ins this month</h3><p className={'mt-1 text-xs leading-relaxed '+textMuted}>Students who joined this school during the selected month.</p></div><span className={'text-xs font-medium '+textMuted}>{dropoutLoading?<SkeletonText width="10ch"/>:reader.error?'Unavailable':`${transferIns.length} ${transferIns.length===1?'student':'students'}`}</span></div>
  <LoadingRegion loading={dropoutLoading} error={reader.error} retry={reader.retry} variable name="monthly-transfer-records" skeleton={null} frame={busy=><div className="overflow-x-auto"><table className="w-full text-left"><thead className={tint}><tr>{['Student','Grade and section','Date joined'].map(label=><th key={label} scope="col" className={th}>{label}</th>)}</tr></thead><tbody>
   {busy?Array.from({length:2},(_,i)=><tr key={i} className={'border-t '+panelBorder}>{[1,2,3].map(n=><td key={n} className={td}><SkeletonText width="12ch"/></td>)}</tr>):transferIns.map(entry=><tr key={entry.studentId} className={'border-t '+panelBorder}><td className={td+' font-semibold'}>{entry.studentName}</td><td className={td}>{classLabel}</td><td className={td+' whitespace-nowrap'}>{dateLabel(entry.joinedDate)}</td></tr>)}
   {!busy&&!transferIns.length&&<tr><td colSpan={3} className={'px-4 py-8 text-center text-xs '+textMuted}>No transfer-ins recorded this month.</td></tr>}
  </tbody></table></div>}>{null}</LoadingRegion>
 </section>}
 </div>
 {selected&&matching&&<Suspense fallback={null}><StudentDropoutDialog classId={classId} student={{id:selected.studentId,name:name(selected)}} state={reader.data!} dropout={selected} theme={theme} onClose={()=>setSelected(null)} onSaved={reader.retry}/></Suspense>}
 </div>;
}


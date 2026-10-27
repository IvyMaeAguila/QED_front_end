import {useState} from 'react';
import {UserRoundX,Undo2} from 'lucide-react';
import {ModalBody,ModalFrame,ModalHeader} from '@shared/components/modal';
import {AccountSelect} from '@shared/components/AccountSelect';
import {queryClient} from '@shared/query/queryClient';
import {useTeacherQueryScope} from '../../query/teacherQueryScope';
import {declareDropout,reverseDropout,DROPOUT_REASONS,type DropoutState,type Dropout} from './services/dropout.service';
import type {AdminThemeContext} from '../../../admin/pages/AdminLayout';
import type {RosterStudent} from '../subjects/detail/data';
export function StudentDropoutDialog({classId,student,state,dropout,theme,onClose,onSaved}:{classId:string;student:Pick<RosterStudent,'id'|'name'>;state:DropoutState;dropout?:Dropout;theme:AdminThemeContext;onClose:()=>void;onSaved:()=>void}){
 const scope=useTeacherQueryScope();const {darkMode,panelBg,panelBorder,textPrimary,textMuted}=theme;
 const [effectiveDate,setDate]=useState(state.today),[reason,setReason]=useState(''),[remarks,setRemarks]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const details=state.students[student.id];const title=dropout?'Reverse dropout declaration':'Declare dropout';
 const control='mt-1.5 h-9 w-full rounded-lg border px-3 text-xs '+panelBg+' '+panelBorder+' '+textPrimary;
 async function submit(e:React.FormEvent){e.preventDefault();if(busy||!scope.enabled||!scope.online)return;setBusy(true);setError(null);
 try{const options=scope.mutationRequest(new AbortController().signal);
 if(dropout)await reverseDropout(classId,student.id,dropout.id,remarks,options);else await declareDropout(classId,student.id,{effectiveDate,reason,remarks},options);
 // Invalidate every class/term projection and role-authorized profile reader.
 await Promise.all(['dropouts','attendance','advisory','monthly-attendance-report','holistic','students','dashboard'].map(key=>queryClient.invalidateQueries({queryKey:[...scope.key,key]})));
 onSaved();onClose();
 }catch(failure){setError(failure instanceof Error?failure.message:'Unable to save this declaration.');setBusy(false);}
 }
 return <ModalFrame onClose={()=>{if(!busy)onClose();}} size="md" shellVariant={darkMode?'dark':'standard'} ariaLabel={title}>
 <ModalHeader title={title} subtitle={student.name} leading={dropout?<Undo2 size={20}/>:<UserRoundX size={20}/>} onClose={()=>{if(!busy)onClose();}} closeDarkMode={darkMode}/>
 <ModalBody className="p-5"><form className={'space-y-4 '+textPrimary} onSubmit={e=>void submit(e)}>
 {dropout?<p className={'text-xs leading-relaxed '+textMuted}>Declared effective {dropout.effectiveDate}: {dropout.reason}. Reversing restores attendance entry under the usual date rules. The declaration and this correction remain in the audit history.</p>:<>
 {details?.risk.count>=5&&<p className={'rounded-lg border px-3 py-2 text-xs '+(darkMode?'border-amber-500/30 bg-amber-500/10 text-amber-200':'border-amber-200 bg-amber-50 text-amber-900')}>{details.risk.count} consecutive school-day absences since {details.risk.since}. Recorded through {state.asOf}.</p>}
 <label className={'block text-xs font-semibold '+textMuted}>Last day attended<input aria-label="Last day attended" readOnly className={control} value={details?.lastAttended??'No recorded present or late attendance'}/></label>
 <label className={'block text-xs font-semibold '+textMuted}>Effective dropout date<input aria-label="Effective dropout date" type="date" required max={state.today} value={effectiveDate} onChange={e=>setDate(e.target.value)} className={control} disabled={busy}/></label>
 <label className={'block text-xs font-semibold '+textMuted}>Reason<AccountSelect aria-label="Dropout reason" required value={reason} onChange={e=>setReason(e.target.value)} className={control} disabled={busy}><option value="">Select a reason</option>{DROPOUT_REASONS.map(r=><option key={r}>{r}</option>)}</AccountSelect></label>
 </>}
 <label className={'block text-xs font-semibold '+textMuted}>{dropout?'Reversal reason':'Remarks'+(reason==='Other'?' (required)':' (optional)')}<textarea aria-label={dropout?'Reversal reason':'Dropout remarks'} required={!!dropout||reason==='Other'} maxLength={1000} value={remarks} onChange={e=>setRemarks(e.target.value)} className={control+' h-24 resize-y py-2'} disabled={busy}/></label>
 {!dropout&&<p className={'text-xs leading-relaxed '+textMuted}>You are finalizing this student&apos;s dropout record. Attendance before the effective date is preserved; entry from that date onward is locked. A declaration can be reversed with a recorded reason.</p>}
 {error&&<p role="alert" className="text-xs text-red-600">{error}</p>}
 {!scope.online&&<p role="alert" className="text-xs text-amber-700">Reconnect before saving. No offline changes will be queued.</p>}
 <div className="flex flex-wrap justify-end gap-2 border-t pt-4" style={{borderColor:'var(--border-subtle)'}}><button type="button" disabled={busy} onClick={onClose} className={'h-9 rounded-lg border px-4 text-xs font-semibold '+panelBorder}>Cancel</button><button type="submit" disabled={busy||!scope.online} className="h-9 rounded-lg bg-maroon px-4 text-xs font-bold text-white disabled:opacity-50">{busy?'Saving...':title}</button></div>
 </form></ModalBody></ModalFrame>;
}

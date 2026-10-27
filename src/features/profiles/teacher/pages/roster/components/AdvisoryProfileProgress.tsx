import {useMemo,useState,type ReactNode} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {AccountSelect} from '@shared/components/AccountSelect';
import {LoadingFormValue} from '@shared/loading/LoadingFormValue';
import {useTeacherReader} from '../../../query/useTeacherReader';
import {fetchAdvisorySections,fetchAdvisoryAttendance} from '../../attendance/services/attendance.service';
import {fetchGradingPeriodsGlobal,fetchStudentHolisticProfile} from '../../holistic/services/holistic.service';
import {AttendanceOverviewView} from '../../../../parent/pages/Student/Overview/components/AttendanceOverview';
import {StudentNarrativeSnapshotView} from '../../../../parent/pages/Student/Overview/components/HolisticAverage';
import type {Student} from '../../../../admin/pages/studentrecords/types/Students';
import type {AdminThemeContext} from '../../../../admin/pages/AdminLayout';
import {progressMonthOptions,studentAttendanceProgress,studentHolisticSnapshot} from './advisoryProgressData';

type Props={student:Student;theme:AdminThemeContext;ready:boolean;information:ReactNode};
function ProgressContent({student,theme,ready,information}:Props){
 const terms=useTeacherReader(['grading-periods','active'],fetchGradingPeriodsGlobal,'Unable to load school-year terms.',30_000,ready);
 const advisories=useTeacherReader(['advisory','sections'],fetchAdvisorySections,'Unable to verify the advisory class.',30_000,ready);
 const year=terms.data?.[0]?.schoolYearId??'active';
 const advisory=advisories.data?.find(c=>c.roster.some(s=>s.id===student.id)&&c.gradeLevel===student.gradeLevel&&(!c.schoolYearId||year==='active'||String(c.schoolYearId)===String(year)));
 const options=useMemo(()=>progressMonthOptions(terms.data??[]),[terms.data]);
 const now=new Date(),today=String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0');
 const defaultMonth=options.find(m=>m.key===today)??[...options].reverse().find(m=>m.key<=today)??options[0];
 const [selection,setSelection]=useState<{year:string;key:string}>();
 const selected=selection?.year===year?options.find(m=>m.key===selection.key):undefined;
 const monthKey=selected?.key??defaultMonth?.key??'';
 const setYear=(value:string)=>setSelection(previous=>({year,key:value+'-'+(previous?.year===year?previous.key.slice(5,7):monthKey.slice(5,7))}));
 const setMonth=(value:string)=>setSelection(previous=>({year,key:(previous?.year===year?previous.key.slice(0,4):monthKey.slice(0,4))+'-'+value}));
 const classId=advisory?.classId??'';
 const marks=useTeacherReader(['attendance',classId,'all','profile',year],o=>fetchAdvisoryAttendance(classId,{allPeriods:true},o),'Unable to load student attendance.',30_000,ready&&!!advisory&&!terms.loading&&!terms.error&&!advisories.loading&&!advisories.error);
 const attendance=useMemo(()=>studentAttendanceProgress(marks.data?.data??{},student.id,monthKey,terms.data??[]),[marks.data,student.id,monthKey,terms.data]);
 const [termSelection,setTermSelection]=useState<{year:string;id:string}>();
 const defaultTerm=terms.data?.find(t=>t.isActive)??[...(terms.data??[])].filter(t=>t.startDate<=today+'-'+String(now.getDate()).padStart(2,'0')).sort((a,b)=>b.startDate.localeCompare(a.startDate))[0]??terms.data?.[0];
 const term=(termSelection?.year===year?terms.data?.find(t=>t.id===termSelection.id):undefined)??defaultTerm;
 const termNumber=term?.termNumber??1;
 const holistic=useTeacherReader(['holistic','profile',year,student.id,termNumber],o=>fetchStudentHolisticProfile(student.id,termNumber,o),'Unable to load the holistic snapshot.',30_000,ready&&!!term&&!terms.loading&&!terms.error);
 const snapshot=useMemo(()=>studentHolisticSnapshot(holistic.data,term?.termLabel??''),[holistic.data,term?.termLabel]);
 const noAdvisory=ready&&!advisories.loading&&!advisories.error&&!!advisories.data&&!advisory;
 const noTerms=ready&&!terms.loading&&!terms.error&&!!terms.data&&!terms.data.length;
 const attendanceError=terms.error||advisories.error||(noAdvisory?'Attendance is available only to this student’s class adviser.':null)||(noTerms?'No grading periods have been configured for the active school year.':null)||marks.error;
 const note=attendance.unmarked||attendance.statusSummary.excused?attendance.statusSummary.excused+' excused; '+attendance.unmarked+' unmarked on recorded class days. Unmarked attendance is not counted as absent.':attendance.schoolDays===0?'No attendance records for this student’s class in the selected month.':undefined;
 const radius='!rounded-none !border-0 !shadow-none';
 return <>
  {information}
  <div className={"grid items-stretch border-t xl:grid-cols-2 "+theme.panelBorder}>
   <section className="min-w-0" aria-label="Attendance Overview">
    <AttendanceOverviewView theme={theme} compact className={radius} year={monthKey.slice(0,4)} month={monthKey.slice(5,7)} setYear={setYear} setMonth={setMonth}
     data={marks.data?attendance:null} loading={!ready||(!attendanceError&&marks.loading)} error={attendanceError} refetch={noAdvisory?advisories.retry:noTerms?terms.retry:marks.retry}
     monthOptions={options} monthsLoading={!ready||terms.loading||advisories.loading} monthsError={terms.error||advisories.error} retryMonths={()=>{terms.retry();advisories.retry();}}
     emptyRateLabel="—" note={note}/>
   </section>
  <section className={"min-w-0 border-t xl:border-l xl:border-t-0 "+theme.panelBorder} aria-label="Term Snapshot">
   {holistic.data&&!holistic.data.isAdvisory&&<p className={'mb-2 text-xs '+theme.textMuted}>Holistic results include only your authorized subjects.</p>}
   <StudentNarrativeSnapshotView student={{firstName:student.firstName}} theme={theme} snapshot={snapshot} loading={!ready||(!terms.error&&!noTerms&&(terms.loading||holistic.loading))} error={terms.error||(noTerms?'No grading periods have been configured for the active school year.':null)||holistic.error}
    retry={()=>{terms.retry();holistic.retry();}} gateOnRelease={false} compact className={radius+' border '+theme.panelBorder}
    action={<LoadingFormValue loading={terms.loading} name="advisory-profile-term" width="7ch"><AccountSelect data-account-select="" aria-label="Select holistic term" value={term?.id??''} disabled={terms.loading||!term} onChange={e=>setTermSelection({year,id:e.target.value})} className={'h-8 max-w-40 rounded-lg border px-3 text-xs font-semibold '+theme.panelBg+' '+theme.panelBorder+' '+theme.textPrimary}>{(terms.data??[]).map(t=><option key={t.id} value={t.id}>{t.termLabel}</option>)}</AccountSelect></LoadingFormValue>} />
  </section>
  </div>
 </>;
}
export default function AdvisoryProfileProgress(props:Props){return <QueryClientProvider client={queryClient}><ProgressContent {...props}/></QueryClientProvider>;}



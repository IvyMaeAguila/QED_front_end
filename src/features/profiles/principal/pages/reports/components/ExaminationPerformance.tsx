import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@shared/hooks/useAuth';
import { useRoutePreview } from '@shared/loading/RoutePreview';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { DeferredChart } from '@shared/loading/DeferredChart';
import { principalAnalyticsKeys, principalStudentKeys } from '@shared/query/queryClient';
import { getRosterAcademicYear } from '../../students/services/students.service';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import { getExaminationAnalytics } from '../services/reports.service';
import { ReportMetricCards } from './ReportMetricCards';
interface Props {
 term: string; grade: string; gradeOptions: string[]; onGradeChange: (value: string) => void;
 panelBg: string; panelBorder: string; textPrimary: string; textMuted: string; darkMode: boolean;
}
export function ExaminationPerformance(p: Props) {
 const [schoolYear, setYear] = useState(''), [examTerm, setTerm] = useState('');
 const [section, setSection] = useState(''), [subject, setSubject] = useState(''), [examination, setExam] = useState('ST1');
 const { user, isLoading, sessionScope, expireSession } = useAuth();
 const preview = useRoutePreview();
 const enabled = !preview && !isLoading && user?.role === 'PRINCIPAL';
 const year = useQuery({
  queryKey: principalStudentKeys.rosterYear(sessionScope, user?.role ?? '', String(user?.id ?? '')),
  enabled, staleTime: 30_000, gcTime: 300_000,
  queryFn: async ({signal}) => {
   try { return await getRosterAcademicYear(signal); }
   catch (error) { if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) expireSession(sessionScope); throw error; }
  },
 });
 const filters = { schoolYear: schoolYear || String(year.data?.id ?? ''), term: examTerm || p.term, grade: p.grade === 'All Grades' ? '' : p.grade, section, subject, examination };
 const query = useQuery({
  queryKey: [...principalAnalyticsKeys.all(sessionScope, user?.role ?? '', String(user?.id ?? '')), 'examination-performance', filters],
  enabled: enabled && !!year.data?.id && !year.isFetching && !year.error, staleTime: 30_000, gcTime: 300_000,
  queryFn: ({ signal }) => getExaminationAnalytics(filters, { signal, onUnauthorized: () => expireSession(sessionScope) }),
 });
 const data = enabled ? query.data : undefined;
 const fmt = (v: number | null | undefined) => v == null ? '—' : v.toFixed(2);
 const select = (label: string, value: string, change: (v: string) => void, options: {id: string; label: string}[]) => <label key={label} className={`flex min-w-0 flex-col gap-1 text-xs ${p.textMuted}`}>{label}<select aria-label={label} value={value} onChange={e => change(e.target.value)} className={`rounded-lg border px-2 py-1.5 ${p.panelBg} ${p.panelBorder} ${p.textPrimary}`}>{options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
 const options = (labels: string[]) => labels.map(label => ({id: label, label}));
 return <section aria-label="Examination performance" className="flex flex-col gap-3">
  <div className={`rounded-xl border p-4 ${p.panelBg} ${p.panelBorder}`}>
   <h2 className={`text-sm font-semibold ${p.textPrimary}`}>Examination Performance</h2>
   <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    {select('School Year', schoolYear, v => {setYear(v); setTerm(''); setSection(''); setSubject('');}, [{id:'',label:'Active school year'}, ...(data?.options.years ?? [])])}
    {select('Examination Term', examTerm || p.term, setTerm, options(data?.options.terms.length ? data.options.terms : [p.term]))}
    {select('Grade Level', p.grade, v => {p.onGradeChange(v); setSection(''); setSubject('');}, options(p.gradeOptions.length ? p.gradeOptions : ['All Grades']))}
    {select('Section', section, v => {setSection(v); setSubject('');}, [{id:'',label:'All Sections'}, ...(data?.options.sections ?? [])])}
    {select('Subject', subject, setSubject, [{id:'',label:'All Subjects'}, ...(data?.options.subjects ?? [])])}
    {select('Examination', examination, setExam, options(['ST1','ST2','TE']))}
   </div>
   <p className={`mt-3 text-xs ${p.textMuted}`}>Raw points normalized to 0–100%. Multiple items use total recorded points ÷ their total HPS per student and subject-section. Missing items are excluded; partial results are included. Student-subject results have equal weight across subjects.</p>
  </div>
  {query.error || year.error || query.isPaused || year.isPaused ? <LoadingRegion loading={false} error={query.error ?? year.error ?? new Error('Examination statistics are unavailable offline. Reconnect and retry.')} retry={() => {if (year.error) void year.refetch(); else void query.refetch();}} skeleton={null}>{null}</LoadingRegion> : <>
   <ReportMetricCards regionPrefix="examination" loading={query.isPending || query.isFetching} panelBg={p.panelBg} panelBorder={p.panelBorder} textPrimary={p.textPrimary} textMuted={p.textMuted} items={[
    {label:'Mean Examination Score',value:fmt(data?.summary.mean),detail:'Percentage points · raw scores / HPS'},
    {label:'Standard Deviation',value:fmt(data?.summary.sd),detail:'Population SD · percentage points'},
    {label:'Students with Valid Scores',value:String(data?.summary.students ?? '—'),detail:`${data?.summary.count ?? 0} student-subject results`},
    {label:'Score Scale',value:'0–100%',detail:'Each item uses its own HPS'},
   ]}/>
   {!query.isPending && !data?.summary.count ? <p className={`py-6 text-center text-sm ${p.textMuted}`}>No valid examination scores for these filters.</p> : data && <div className="grid min-w-0 gap-3 lg:grid-cols-2">
    <div className={`overflow-x-auto rounded-xl border p-4 ${p.panelBg} ${p.panelBorder}`}><table className={`w-full text-left text-xs ${p.textPrimary}`}><caption className="mb-3 text-left font-semibold">Examination results · percentage scale</caption><thead><tr>{['Subject','Examination','Students','Mean (%)','SD (pp)'].map(s => <th key={s} className="px-2 py-2">{s}</th>)}</tr></thead><tbody>{data.rows.map(r => <tr key={`${r.subjectId}:${r.examination}`} className={`border-t ${p.panelBorder}`}><td className="px-2 py-2">{r.subject}</td><td>{r.examination}</td><td>{r.students}</td><td>{fmt(r.mean)}</td><td>{fmt(r.sd)}</td></tr>)}</tbody></table></div>
    <div className={`min-w-0 rounded-xl border p-4 ${p.panelBg} ${p.panelBorder}`}><h3 className={`mb-3 text-xs font-semibold ${p.textPrimary}`}>Score distribution · student-subject results</h3><div className="h-60"><DeferredChart loading={false}>{({ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid}) => <ResponsiveContainer width="100%" height="100%"><BarChart data={data.distribution} margin={{bottom:30,left:-15}}><CartesianGrid vertical={false} stroke={p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}/><XAxis dataKey="interval" tick={{fontSize:10}} angle={-35} textAnchor="end" interval={0}/><YAxis allowDecimals={false} tick={{fontSize:10}}/><Tooltip contentStyle={{background:p.darkMode ? '#111827' : '#fff',fontSize:12}}/><Bar dataKey="count" name="Student-subject results" fill="var(--color-maroon)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>}</DeferredChart></div></div>
   </div>}
  </>}
 </section>;
}



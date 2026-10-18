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
import { ExaminationMetricInfo } from './ExaminationMetricInfo';
import { ExaminationInsights } from './ExaminationInsights';
import { distributionDescription } from '../utils/examinationInsights';
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
 const withUnit = (value: number | null | undefined, unit: string) => value == null ? fmt(value) : `${fmt(value)}${unit}`;
 const distributionNote = distributionDescription(data);
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
   <div className={`mt-3 flex items-center gap-1 text-xs ${p.textMuted}`}><p>Examination scores are presented as percentages (0–100%).</p><ExaminationMetricInfo label="examination score methodology" term="Examination score methodology" explanation="Missing examination items are excluded, never counted as zero. Valid partial results are included using only recorded points and their corresponding Highest Possible Scores (HPS)." calculation="For each student, subject-section, and examination, divide total recorded points by their corresponding total HPS and multiply by 100. Each valid student-subject result contributes equally to the arithmetic mean, population SD, and distribution; a student can contribute results in multiple subjects." darkMode={p.darkMode} /></div>
  </div>
  {query.error || year.error || query.isPaused || year.isPaused ? <LoadingRegion loading={false} error={query.error ?? year.error ?? new Error('Examination statistics are unavailable offline. Reconnect and retry.')} retry={() => {if (year.error) void year.refetch(); else void query.refetch();}} skeleton={null}>{null}</LoadingRegion> : <>
   <ReportMetricCards regionPrefix="examination" loading={query.isPending || query.isFetching} panelBg={p.panelBg} panelBorder={p.panelBorder} textPrimary={p.textPrimary} textMuted={p.textMuted} items={[
    {label:'Average Exam Score',value:withUnit(data?.summary.mean, '%'),detail:'Overall examination performance.',titleInfo:<ExaminationMetricInfo label="Average Exam Score" term="Mean Examination Score" explanation="The arithmetic mean of valid normalized examination percentages. Each student-subject result has equal weight; partial results are included." calculation="For each result: recorded points divided by corresponding highest possible scores (HPS), multiplied by 100. Add these percentages and divide by the number of valid results." darkMode={p.darkMode} />},
    {label:'Score Variation (SD)',value:withUnit(data?.summary.sd, ' pp'),detail:'Shows how much examination scores differ.',titleInfo:<ExaminationMetricInfo label="Score Variation (SD)" term="Standard Deviation" explanation="Measures how spread out examination scores are around the mean, in percentage points. Lower SD means more closely grouped scores; higher SD means greater variation, which alone does not indicate poor performance." calculation="Population SD: square each valid percentage's distance from the mean, average those squared distances, then take the square root." darkMode={p.darkMode} />},
    {label:'Students Assessed',value:String(data?.summary.students ?? '—'),detail:`${data?.summary.count ?? 0} student-subject results`,titleInfo:<ExaminationMetricInfo label="Students Assessed" term="Unique Students with Valid Examination Scores" explanation="Counts unique students, rather than examination records. A student with results in multiple subjects is counted once. Valid partial results are included." calculation="Count distinct student IDs among valid examination results matching the selected filters." darkMode={p.darkMode} />},
    {label:'Results Coverage',value:'Unavailable',detail:'Completeness data is not available.',detailKnown:true,titleInfo:<ExaminationMetricInfo label="Results Coverage" term="Examination Results Completion Rate" explanation="The percentage of expected examination results that are complete. The current examination data does not establish the eligible expected results or verified completeness rules, so coverage cannot yet be calculated reliably. Partial records must not count as complete." calculation="Complete expected results divided by all eligible expected results, multiplied by 100, once the population and completeness rules are verified. No percentage is estimated from recorded results alone." darkMode={p.darkMode} />},
   ]}/>
   <ExaminationInsights data={data} loading={query.isPending || query.isFetching} panelBg={p.panelBg} panelBorder={p.panelBorder} textPrimary={p.textPrimary} textMuted={p.textMuted} />
   {!query.isPending && !data?.summary.count ? <p className={`py-6 text-center text-sm ${p.textMuted}`}>No valid examination scores for these filters.</p> : data && <div className="grid min-w-0 gap-3 lg:grid-cols-2">
    <div className={`self-start overflow-x-auto rounded-xl border p-4 ${p.panelBg} ${p.panelBorder}`}>
      <table className={`w-full min-w-[400px] text-xs ${p.textPrimary}`}>
        <caption className="mb-3 text-left font-semibold">Examination results · percentage scale</caption>
        <thead><tr>{['Subject','Examination','Students','Average (%)','SD (pp)'].map((label, index) => <th key={label} scope="col" className={`px-2 py-2 font-semibold ${index < 2 ? 'text-left' : 'text-right'}`}>{label}</th>)}</tr></thead>
        <tbody>{data.rows.map(row => <tr key={`${row.subjectId}:${row.examination}`} className={`border-t ${p.panelBorder}`}>
          <th scope="row" className="px-2 py-2 text-left font-medium">{row.subject}</th>
          <td className="px-2 py-2">{row.examination}</td>
          <td className="px-2 py-2 text-right tabular-nums">{row.students}</td>
          <td className="px-2 py-2 text-right tabular-nums">{withUnit(row.mean, '%')}</td>
          <td className="px-2 py-2 text-right tabular-nums">{fmt(row.sd)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className={`min-w-0 rounded-xl border p-4 ${p.panelBg} ${p.panelBorder}`}>
      <h3 className={`mb-3 text-xs font-semibold ${p.textPrimary}`}>Score distribution · student-subject results</h3>
      <div className="h-60"><DeferredChart loading={false}>{({ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid}) => <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.distribution} margin={{bottom:30,left:8}}>
          <CartesianGrid vertical={false} stroke={p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}/>
          <XAxis dataKey="interval" tick={{fontSize:10}} angle={-35} textAnchor="end" interval={0}/>
          <YAxis allowDecimals={false} width={40} tick={{fontSize:10}} label={{value:'Examination results',angle:-90,position:'insideLeft',style:{fontSize:10,fill:p.darkMode ? '#d1d5db' : '#4b5563'}}}/>
          <Tooltip itemStyle={{color:p.darkMode ? '#f3f4f6' : '#1f2937'}} cursor={{fill:p.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}} formatter={value => [`${Number(value)} results (${data.summary.count ? (Number(value) / data.summary.count * 100).toFixed(1) : '0.0'}%)`, 'Recorded results']} contentStyle={{background:p.darkMode ? '#111827' : '#fff',color:p.darkMode ? '#f3f4f6' : '#1f2937',border:p.darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',borderRadius:8,fontSize:12}}/>
          <Bar dataKey="count" name="Student-subject results" fill="var(--color-maroon)" radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>}</DeferredChart></div>
      <p className={`mt-2 text-xs leading-relaxed ${p.textMuted}`}>{distributionNote ?? 'Each bar shows the number of recorded examination results within a percentage range.'} One student may contribute results in multiple subjects.</p>
    </div>
   </div>}
  </>}
 </section>;
}



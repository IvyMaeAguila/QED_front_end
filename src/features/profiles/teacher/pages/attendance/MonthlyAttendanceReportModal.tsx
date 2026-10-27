import { useEffect, useRef, useState } from 'react';
import { Download, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { ModalBody, ModalFrame, ModalHeader } from '@shared/components/modal';
import { AccountSelect } from '@shared/components/AccountSelect';
import { useTeacherReader } from '../../query/useTeacherReader';
import type { AdminThemeContext } from '../../../admin/pages/AdminLayout';
import type { AdvisorySection } from './services/attendance.service';
import { fetchMonthlyAttendanceReport, type MonthlyAttendanceReport, type ReportSignatories } from './services/monthlyAttendanceReport.service';
import { createMonthlyAttendancePdf, REPORT_DAY_CAPACITY } from './services/monthlyAttendanceReport.pdf';

function monthsFor(section: AdvisorySection): string[] {
  const months = new Set<string>();
  for (const term of section.terms) {
    let current = term.startDate?.slice(0, 7);
    const end = term.endDate?.slice(0, 7);
    let limit = 0;
    while (current && end && current <= end && limit++ < 120) {
      months.add(current);
      const [y, m] = current.split('-').map(Number);
      current = m === 12 ? String(y + 1) + '-01' : String(y) + '-' + String(m + 1).padStart(2, '0');
    }
  }
  return [...months].sort();
}
const monthLabel = (month: string) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T12:00:00Z'));

type Preview = { url: string; report: MonthlyAttendanceReport; signatories: string };
export default function MonthlyAttendanceReportModal({ section, initialMonth, theme, onClose }: { section: AdvisorySection; initialMonth?: string; theme: AdminThemeContext; onClose: () => void }) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const months = monthsFor(section);
  const today = new Date(), currentMonth = String(today.getFullYear()) + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const [month, setMonth] = useState(() => initialMonth && months.includes(initialMonth) ? initialMonth : months.includes(currentMonth) ? currentMonth : months[months.length - 1] ?? '');
  const [edits, setEdits] = useState<Partial<ReportSignatories>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [generating, setGenerating] = useState(false), [pdfError, setPdfError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const ready = !!section.schoolYearId && !!month;
  const reader = useTeacherReader(['monthly-attendance-report', section.classId, section.schoolYearId ?? '', month],
    options => fetchMonthlyAttendanceReport(section.classId, section.schoolYearId!, month, options),
    error => error instanceof Error ? error.message : 'Unable to load the report.', 0, ready);
  const data = reader.data;
  const signatories: ReportSignatories = {
    adviserName: edits.adviserName ?? data?.adviserName ?? '',
    adviserDesignation: edits.adviserDesignation ?? 'Adviser’s Signature over printed name',
    principalName: edits.principalName ?? data?.principalName ?? '',
    principalDesignation: edits.principalDesignation ?? 'Acting Principal, Elementary Department',
  };
  const signatureKey = JSON.stringify(signatories);
  const shownPreview = preview && preview.report === data && preview.signatories === signatureKey ? preview : null;
  const blocked = !data || reader.loading || reader.offline || !!reader.error || generating;
  const control = 'h-9 w-full rounded-lg border px-3 text-xs ' + panelBg + ' ' + panelBorder + ' ' + textPrimary;
  const secondary = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:opacity-50 ' + panelBorder + ' ' + textPrimary;
  const primary = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-maroon px-3 text-xs font-bold text-white hover:bg-maroon-light disabled:opacity-50';
  async function generate() {
    if (!data || blocked) return;
    setGenerating(true); setPdfError(null);
    try {
      const bytes = await createMonthlyAttendancePdf(data, signatories);
      if (!alive.current) return;
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      setPreview({ url: URL.createObjectURL(blob), report: data, signatories: signatureKey });
    } catch (error) {
      if (alive.current) setPdfError(error instanceof Error ? error.message : 'Unable to generate the report.');
    } finally { if (alive.current) setGenerating(false); }
  }
  function download() {
    if (!shownPreview || blocked) return;
    const link = document.createElement('a');
    link.href = shownPreview.url;
    link.download = 'Monthly-Attendance-' + shownPreview.report.gradeSection.replace(/[^a-z0-9-]+/gi, '-') + '-' + month + '.pdf';
    document.body.appendChild(link); link.click(); link.remove();
  }
  return <ModalFrame onClose={onClose} size="xl" shellVariant={darkMode ? 'dark' : 'standard'} ariaLabel="Monthly Attendance Report">
    <ModalHeader title="Monthly Attendance Report" subtitle={section.gradeLevel + ' · ' + section.sectionName} onClose={onClose} closeDarkMode={darkMode} leading={<FileText size={20} />} />
    <ModalBody className={'space-y-5 px-5 py-5 ' + textPrimary}>
      <div className="flex flex-wrap items-end gap-3">
        <label className={'min-w-44 flex-1 text-xs font-semibold ' + textMuted}>School year
          <input aria-label="Report school year" readOnly value={section.schoolYearLabel ?? 'Unavailable'} className={'mt-1.5 ' + control} />
        </label>
        <label className={'min-w-44 flex-1 text-xs font-semibold ' + textMuted}>Month
          <AccountSelect aria-label="Report month" value={month} disabled={generating} onChange={e => { setMonth(e.target.value); setPdfError(null); }} className={'mt-1.5 ' + control}>
            {months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>)}
          </AccountSelect>
        </label>
        <button type="button" className={secondary} disabled={!ready || reader.loading || reader.offline || generating} onClick={() => { setPreview(null); void reader.refresh(); }}><RefreshCw size={13} />Refresh data</button>
      </div>
      <p className={'text-xs leading-relaxed ' + textMuted}>Uses the current advisory roster and recorded weekdays. P/L count as present; A/E count as absent. Morning and afternoon repeat the same daily count; averages count it once. Historical school years are not available.</p>
      {!ready && <p role="alert" className="text-xs text-red-600">The class’s school year or grading-period dates are unavailable. Close this report and refresh Attendance after configuring the school year.</p>}
      {ready && reader.loading && <p role="status" className={'text-xs ' + textMuted}>Loading report data…</p>}
      {reader.error && <p role="alert" className="text-xs text-red-600">{reader.error}</p>}
      {reader.offline && <p role="alert" className="text-xs text-amber-700">Reconnect and refresh data before previewing or downloading.</p>}
      {data && !reader.loading && !reader.error && <>
        {data.unknownGender.length > 0 && <p role="alert" className={'rounded-lg border p-3 text-xs leading-relaxed ' + panelBorder}>Gender information is missing or invalid for: {data.unknownGender.map(s => s.name || s.id).join(', ')}. These students are not classified as male or female and are excluded from gender counts. Enrollment total is male + female ({data.enrollment.total}), compared with {data.rosterCount} students on the roster. Correct their student records separately.</p>}
        {data.days.some(day => day.unmarked > 0) && <div role="alert" className={'rounded-lg border p-3 text-xs leading-relaxed ' + panelBorder}><strong>Incomplete attendance.</strong> Unmarked students remain unknown and are not counted as absent. Counts and ADA reflect recorded marks only.
          <p className="mt-1">{data.days.filter(day => day.unmarked > 0).map(day => day.date + ': ' + day.unmarked + ' unmarked').join('; ')}</p>
        </div>}
        {!data.numberOfDays && <p role="status" className={'rounded-lg border p-3 text-xs leading-relaxed ' + panelBorder}>No recorded weekdays for this month. The report will show zero reporting days, blank ADA, and blank daily rows.</p>}
        {data.days.length > REPORT_DAY_CAPACITY && <p role="alert" className="text-xs text-red-600">The official template supports {REPORT_DAY_CAPACITY} daily rows. This report exceeds capacity; no records will be clipped or exported.</p>}
        {shownPreview ? <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className={secondary} onClick={() => setPreview(null)}><ArrowLeft size={13} />Edit report details</button>
            <button type="button" className={primary} disabled={blocked} onClick={download}><Download size={13} />Download PDF</button>
          </div>
          <p className={'text-xs ' + textMuted}>Preview and download use the same completed PDF. Temporary report details are discarded when this dialog closes.</p>
          <iframe title="Monthly attendance PDF preview" src={shownPreview.url + '#toolbar=0&navpanes=0'} className={'h-[65vh] min-h-96 w-full rounded-lg border bg-white ' + panelBorder} />
        </> : <>
          <div className={'overflow-x-auto rounded-lg border ' + panelBorder}>
            <table className="w-full min-w-[420px] text-xs"><thead><tr className={darkMode ? 'bg-white/5' : 'bg-brand-light'}>{['Report summary', 'Male', 'Female', 'Total'].map(label => <th key={label} className="px-4 py-3 text-left font-bold">{label}</th>)}</tr></thead>
              <tbody>{[
                ['Annual / monthly enrollment', data.enrollment.male, data.enrollment.female, data.enrollment.total],
                ['Attendance sum (counted once)', data.sums.male, data.sums.female, data.sums.male + data.sums.female],
                ['Average daily attendance', data.ada?.male ?? '—', data.ada?.female ?? '—', data.ada?.total ?? '—'],
              ].map(([label, ...values]) => <tr key={label} className={'border-t ' + panelBorder}><th className="px-4 py-3 text-left font-medium">{label}</th>{values.map((value, index) => <td key={index} className="px-4 py-3 tabular-nums">{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className={'text-xs ' + textMuted}>{data.numberOfDays} reporting day{data.numberOfDays === 1 ? '' : 's'} · Dropout, transfer-out, and entered-student fields remain blank.</p>
          <div>
            <h3 className="text-sm font-bold">Report details</h3>
            <p className={'mt-1 text-xs leading-relaxed ' + textMuted}>Names and designations apply to this report session only. {data.principalSource === 'system' ? 'Principal details come from the single active principal profile; verify the designation.' : 'A unique active principal could not be resolved. Enter the approved signatory below.'}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {([['adviserName', 'Adviser name'], ['adviserDesignation', 'Adviser designation / signature caption'], ['principalName', 'Principal name'], ['principalDesignation', 'Principal designation']] as const).map(([key, label]) => <label key={key} className={'text-xs font-semibold ' + textMuted}>{label}<input aria-label={label} value={signatories[key]} maxLength={160} onChange={e => { setEdits(old => ({ ...old, [key]: e.target.value })); setPdfError(null); }} className={'mt-1.5 ' + control} /></label>)}
            </div>
          </div>
          <div className="flex justify-end"><button type="button" className={primary} disabled={blocked || data.days.length > REPORT_DAY_CAPACITY} onClick={() => void generate()}><FileText size={13} />{generating ? 'Preparing PDF…' : 'Preview report'}</button></div>
        </>}
      </>}
      {pdfError && <p role="alert" className="text-xs text-red-600">{pdfError}</p>}
    </ModalBody>
  </ModalFrame>;
}

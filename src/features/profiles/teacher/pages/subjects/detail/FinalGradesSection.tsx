import { useContext, useRef, useState } from 'react';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { SkeletonText } from '@shared/components/SkeletonLoading';
import { FinalGradesTable, type FinalGradeRow } from './components/FinalGradesTable';
import { Download } from 'lucide-react';
import { ClassRecordExportModal } from './ClassRecordExportModal';
import { TeacherAcademicQueryContext } from '../../../query/TeacherAcademicQueryContext';
import { useTeacherReader } from '../../../query/useTeacherReader';
import { subjectKey } from '../../../query/teacherSubjectKeys';
import { fetchItems, fetchScores } from '../services/subjectGrading.service';
import { getEffectiveWeightsSafe } from '../services/subjectGradeTemplate.service';
import { finalDescriptor, finalGrade, groupLearners, transmutedTermGrade } from './utils/finalGrades';
import type { AdminThemeContext } from '../../../../admin/pages/AdminLayout';

function useTerm(subject: string, year: string, period: string | undefined, ready: boolean) {
  const items = useTeacherReader(subjectKey(year, subject, 'items', { term: period }),
    request => fetchItems(subject, { term: period }, request), 'Could not load term assessments.', 30_000, ready && !!period);
  const weights = useTeacherReader(subjectKey(year, subject, 'weights', period ?? 'active'),
    request => getEffectiveWeightsSafe(Number(subject), period, request),
    'Could not load pinned term rules.', 300_000, ready && !!period);
  return { period, items, weights };
}

export function FinalGradesSection({ subjectSectionId, selectedPeriod, ...theme }: Pick<AdminThemeContext, 'darkMode' | 'panelBg' | 'panelBorder' | 'textPrimary' | 'textMuted'> & { subjectSectionId: string; selectedPeriod: string }) {
  const academic = useContext(TeacherAcademicQueryContext);
  const periods = academic?.periods.data ?? [];
  const year = periods[0]?.schoolYearId ?? 'active';
  const ready = !!academic && !academic.info.loading && !academic.info.error && !academic.periods.loading && !academic.periods.error;
  const periodFor = (number: number) => {
    const matches = periods.filter(period => period.termNumber === number && (period.schoolYearId ?? 'active') === year);
    return matches.length === 1 ? matches[0].id : undefined;
  };
  const first = useTerm(subjectSectionId, year, periodFor(1), ready);
  const second = useTerm(subjectSectionId, year, periodFor(2), ready);
  const third = useTerm(subjectSectionId, year, periodFor(3), ready);
  const terms = [first, second, third];
  const scores = useTeacherReader(subjectKey(year, subjectSectionId, 'scores'),
    request => fetchScores(subjectSectionId, request), 'Could not load student scores.', 30_000, ready);
  const error = academic?.info.error ?? academic?.periods.error ?? scores.error ?? terms.find(term => term.items.error || term.weights.error)?.items.error
    ?? terms.find(term => term.weights.error)?.weights.error;
  const loading = !ready || scores.loading || terms.some(term => term.period && (term.items.loading || term.weights.loading));
  const roster = ready ? academic?.info.data?.roster ?? [] : [];
  const selected = terms.find(term => term.period === selectedPeriod)?.weights.data;
  const missingRules = terms.some(term => term.period && term.weights.data === null);
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [exportError, setExportError] = useState('');
  const exporting = useRef(false);
  const rows: FinalGradeRow[] = roster.map(student => {
    const grades = loading ? [null, null, null] : terms.map(term => term.period && term.weights.data && term.items.data
      ? transmutedTermGrade(student.id, term.period, term.items.data, scores.data ?? {}, term.weights.data) : null);
    const final = finalGrade(grades);
    return { ...student, grades: [...grades, final], descriptor: finalDescriptor(final, selected) };
  });
  async function exportFinalGrades() {
    if (exporting.current || loading || error || missingRules) return;
    exporting.current = true;
    setExportError('');
    setExportState('loading');
    try {
      const { Workbook } = await import('exceljs');
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet('FINAL GRADES');
      sheet.columns = [{ width: 8 }, { width: 40 }, ...Array.from({ length: 4 }, () => ({ width: 14 })), { width: 28 }, { width: 18 }];
      sheet.addRow(['QED · Final Grades']);
      sheet.mergeCells('A1:H1');
      sheet.addRow(['No.', "Learner's Name", 'Term 1', 'Term 2', 'Term 3', 'Final Grade', 'Descriptor', 'Remark']);
      for (const group of groupLearners(roster)) {
        const header = sheet.addRow([group.label]);
        sheet.mergeCells(header.number, 1, header.number, 8);
        header.font = { bold: true };
        group.students.forEach((student, index) => {
          const grades = terms.map(term => term.period && term.weights.data && term.items.data
            ? transmutedTermGrade(student.id, term.period, term.items.data, scores.data ?? {}, term.weights.data) : null);
          const final = finalGrade(grades);
          sheet.addRow([index + 1, student.name, ...grades, final, finalDescriptor(final, selected), '']);
        });
      }
      for (const number of [1, 2]) {
        const row = sheet.getRow(number);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800000' } };
        row.height = 26;
      }
      sheet.views = [{ state: 'frozen', ySplit: 2 }];
      sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `QED-FINAL-GRADES-${subjectSectionId}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setExportState('success');
    } catch (err) {
      setExportState('idle');
      setExportError(err instanceof Error ? err.message : 'Could not export final grades. Please try again.');
    } finally {
      exporting.current = false;
    }
  }
  return <section aria-label="Final Grades" className={`qed-assessment-records min-w-0 overflow-hidden rounded-[12px] border shadow-sm ${theme.panelBg} ${theme.panelBorder}`}>
    <ClassRecordExportModal state={exportState} darkMode={theme.darkMode} label="final grades" onClose={() => setExportState('idle')} />
    <div className={`flex flex-wrap items-center gap-3 border-b px-5 py-4 ${theme.panelBorder}`}>
      <h2 className={`qed-type-card-title font-semibold ${theme.textPrimary}`}>Final Grades</h2>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold qed-record-count`}>
        {ready ? <>{roster.length} student{roster.length === 1 ? '' : 's'}</> : <SkeletonText width="10ch" />}
      </span>
      <button type="button" onClick={() => void exportFinalGrades()} disabled={loading || !!error || missingRules || !roster.length || exportState === 'loading'}
        className={`ml-auto inline-flex h-8 min-h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:opacity-50 ${theme.panelBorder} ${theme.textPrimary}`}>
        <Download size={14} /> Export Final Grades
      </button>
    </div>
    {!loading && !error && missingRules && <p role="status" className={`px-4 py-3 text-sm ${theme.textMuted}`}>No grading rules are configured for one or more terms. Ask an admin to upload the approved grade template.</p>}
    {exportError && <p role="alert" className="px-4 py-3 text-sm text-red-600">{exportError}</p>}
    {error ? <p role="alert" className={`px-4 py-4 text-sm ${theme.textMuted}`}>{error} <button type="button" className="underline" onClick={() => {
      academic?.info.retry(); academic?.periods.retry(); scores.retry(); terms.forEach(term => { term.items.retry(); term.weights.retry(); });
    }}>Retry</button></p> : <LoadingRegion name="subject-final-grades" loading={loading} delay={150} minDuration={200}
      skeleton={null} retainPrevious hasContent={rows.length > 0}
      frame={pending => <FinalGradesTable {...theme} rows={rows} loading={pending} />}>{null}</LoadingRegion>}
  </section>;
}

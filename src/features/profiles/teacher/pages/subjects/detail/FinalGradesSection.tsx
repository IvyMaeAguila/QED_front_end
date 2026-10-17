import { Fragment, useContext } from 'react';
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
    async request => (await getEffectiveWeightsSafe(Number(subject), period, request)) ?? null,
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
  return <section aria-label="Final Grades" className={`min-w-0 overflow-hidden rounded-2xl border shadow-sm ${theme.panelBg} ${theme.panelBorder}`}>
    <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${theme.panelBorder}`}>
      <h2 className={`text-sm font-bold ${theme.textPrimary}`}>Final Grades</h2>
      {ready && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme.darkMode ? 'bg-white/5' : 'bg-black/[0.035]'} ${theme.textMuted}`}>
        {roster.length} student{roster.length === 1 ? '' : 's'}
      </span>}
    </div>
    {error ? <p role="alert" className={`px-4 py-4 text-sm ${theme.textMuted}`}>{error} <button type="button" className="underline" onClick={() => {
      academic?.info.retry(); academic?.periods.retry(); scores.retry(); terms.forEach(term => { term.items.retry(); term.weights.retry(); });
    }}>Retry</button></p> : loading ? <p role="status" className={`px-4 py-4 text-sm ${theme.textMuted}`}>Loading final grades…</p> : <>
      <div className="max-w-full overflow-x-auto">
        <table className={`teacher-user-table w-full min-w-[760px] border-collapse border text-xs [&_th]:border [&_td]:border [&_th]:border-inherit [&_td]:border-inherit ${theme.panelBorder} ${theme.textPrimary}`}>
          <colgroup><col className="w-px" /><col span={7} /></colgroup>
          <thead className={theme.textMuted}>
            <tr className={`border-b ${theme.panelBorder}`}>
              {['No.', "Learner's Name"].map(label => <th key={label} scope="col" rowSpan={2} className="px-2 py-3 text-left font-bold">{label}</th>)}
              <th scope="colgroup" colSpan={3} className={`border-b px-2 py-2 text-center font-bold ${theme.panelBorder}`}>Term Grades</th>
              {['Final Grade', 'Descriptor', 'Remark'].map(label => <th key={label} scope="col" rowSpan={2} className="px-2 py-3 text-left font-bold">{label}</th>)}
            </tr>
            <tr className={`border-b ${theme.panelBorder}`}>
              {[1, 2, 3].map(number => <th key={number} scope="col" className="px-2 py-2 text-center font-bold">Term {number}</th>)}
            </tr>
          </thead>
          <tbody>{groupLearners(roster).map(group => <Fragment key={group.label}>
            <tr className={`border-b ${theme.panelBorder}`}><th scope="rowgroup" colSpan={8} className={`px-2 py-2 text-left font-bold ${theme.darkMode ? 'bg-white/10' : 'bg-brand-light'}`}>{group.label}</th></tr>
            {group.students.map((student, index) => {
              const grades = terms.map(term => term.period && term.weights.data && term.items.data
                ? transmutedTermGrade(student.id, term.period, term.items.data, scores.data ?? {}, term.weights.data) : null);
              const final = finalGrade(grades);
              return <tr key={student.id} data-student-id={student.id} className={`border-b ${theme.panelBorder}`}>
                <td data-learner-number className="w-px whitespace-nowrap px-2 py-2 tabular-nums">{index + 1}</td><td data-learner-name className="px-2 py-2 text-left text-sm font-bold">
                  {student.name}
                </td>
                {[...grades, final].map((grade, i) => <td key={i} className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: 'var(--brand-ink)' }}>{grade ?? ''}</td>)}
                <td className="px-3 py-2.5 text-center text-sm font-semibold">{finalDescriptor(final, selected)}</td><td className="px-3 py-2.5 text-center text-sm font-semibold" />
              </tr>;
            })}
          </Fragment>)}</tbody>
        </table>
      </div>
      {!roster.length && <p className={`px-4 py-4 text-sm ${theme.textMuted}`}>No students enrolled yet.</p>}
    </>}
  </section>;
}

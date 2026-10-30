import '../AssessmentRecordsPage.css';
import { Fragment } from 'react';
import { SkeletonText } from '@shared/components/SkeletonLoading';
import { groupLearners } from '../utils/finalGrades';
import type { AdminThemeContext } from '../../../../../admin/pages/AdminLayout';

export type FinalGradeRow = { id: string; name: string; gender?: 'M' | 'F'; grades: (number | null)[]; descriptor: string };
type Theme = Pick<AdminThemeContext, 'darkMode' | 'panelBg' | 'panelBorder' | 'textPrimary' | 'textMuted'>;

/** Same columns and row geometry while the module or its grade data loads. */
export function FinalGradesTable({ rows = [], loading = false, ...theme }: Theme & { rows?: FinalGradeRow[]; loading?: boolean }) {
  const identityPending = loading && !rows.length;
  const visibleRows: FinalGradeRow[] = identityPending ? Array.from({ length: 6 }, (_, i) => ({
    id: `pending-${i}`, name: '', gender: i < 3 ? 'M' : 'F', grades: [null, null, null, null], descriptor: '',
  })) : rows;
  return <div className="max-w-full overflow-x-auto" aria-busy={loading}>
    <table className={`qed-assessment-table teacher-user-table w-full min-w-[760px] border-collapse text-xs ${theme.panelBorder} ${theme.textPrimary}`}>
      <colgroup><col className="w-12" /><col className="min-w-60" /><col span={4} className="min-w-20" /><col className="min-w-36" /><col className="min-w-24" /></colgroup>
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
      <tbody>{groupLearners(visibleRows).filter(group => group.students.length).map(group => <Fragment key={group.label}>
        <tr className={`qed-record-group border-b ${theme.panelBorder}`}><th scope="rowgroup" colSpan={8} className={`px-2 py-2 text-left font-bold ${theme.darkMode ? 'bg-white/10' : 'bg-brand-light'}`}>{group.label}</th></tr>
        {group.students.map((student, index) => <tr key={student.id} data-student-id={identityPending ? undefined : student.id} className={`qed-record-row border-b ${theme.panelBorder}`}>
          <td data-learner-number className="w-px whitespace-nowrap px-2 py-2 tabular-nums">{index + 1}</td>
          <td data-learner-name className="px-2 py-2 text-left text-sm font-bold">{identityPending ? <SkeletonText width={index % 2 ? '13ch' : '17ch'} /> : student.name}</td>
          {student.grades.map((grade, i) => <td key={i} className={`${i === 3 ? "qed-record-ws " : ""}px-3 py-2.5 text-center text-sm font-black tabular-nums`} style={{ color: 'var(--brand-ink)' }}>{loading ? <SkeletonText width="3ch" className="mx-auto" /> : grade ?? ''}</td>)}
          <td className="whitespace-nowrap px-3 py-2.5 text-center text-sm font-semibold">{loading ? <SkeletonText width="10ch" className="mx-auto" /> : student.descriptor}</td>
          <td className="px-3 py-2.5 text-center text-sm font-semibold" />
        </tr>)}
      </Fragment>)}</tbody>
    </table>
    {!loading && !rows.length && <p className={`px-4 py-4 text-sm ${theme.textMuted}`}>No students enrolled yet.</p>}
  </div>;
}

export function FinalGradesLoading({ roster = [], ...theme }: Theme & { roster?: Pick<FinalGradeRow, 'id' | 'name' | 'gender'>[] }) {
  return <section aria-label="Final Grades" className={`qed-assessment-records min-w-0 overflow-hidden rounded-[12px] border shadow-sm ${theme.panelBg} ${theme.panelBorder}`}>
    <div className={`flex min-h-16 items-center justify-between border-b px-5 py-4 ${theme.panelBorder}`}>
      <h2 className={`qed-type-card-title font-semibold ${theme.textPrimary}`}>Final Grades</h2><span role="status" className="sr-only">Loading final grades…</span>
      <SkeletonText width="15ch" />
    </div>
    <FinalGradesTable {...theme} rows={roster.map(student => ({ ...student, grades: [null, null, null, null], descriptor: '' }))} loading />
  </section>;
}

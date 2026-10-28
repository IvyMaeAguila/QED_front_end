import { CalendarDays, UserRoundMinus, UserRoundCheck, ClipboardList } from 'lucide-react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@shared/query/queryClient';
import { AccountSelect } from '@shared/components/AccountSelect';
import { ConfirmationModal } from '@shared/components/ConfirmationModal';
import { StudentAvatar } from '@shared/components/StudentAvatar';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { useToast } from '@shared/context/ToastContext';
import { useLoadingOutletContext } from '@shared/loading/RoutePreview';
import type { AdminThemeContext } from '../AdminLayout';
import { AdminSessionBoundary } from '../../query/AdminSessionBoundary';
import { useAdminReader } from '../../query/useAdminReader';
import { useAdminWriter } from '../../query/useAdminWriter';
import { StudentSearchInput } from '../studentrecords/components/StudentSearchInput';
import { assignSections, fetchSectionAssignments, type AssignmentData, type AssignmentInput } from './services/sectionAssignment.service';

import { SectionAssignmentPageComposition } from './SectionAssignmentPage.loading-view';

const PAGE_SIZE = 50;

function AssignmentQueries() {
  const reader = useAdminReader(['section-assignments'], fetchSectionAssignments, 'Unable to load section assignments.', true, undefined, 0);
  const changed = useCallback(async (_result: unknown, _input: AssignmentInput, key: readonly unknown[]) => {
    await Promise.all(['section-assignments', 'students', 'classes', 'dashboard'].map(resource =>
      queryClient.invalidateQueries({ queryKey: [...key, resource], refetchType: 'active' })));
  }, []);
  const write = useAdminWriter(assignSections, changed);
  const theme = useLoadingOutletContext<AdminThemeContext>();
  return <SectionAssignmentPageComposition>
    <LoadingRegion loading={reader.loading && !reader.data} error={reader.error} retry={() => void reader.retry()} skeleton={<p className={theme.textMuted}>Loading section assignments…</p>}>
      {reader.offline && reader.data && <p role="status" className={theme.textMuted}>You're offline. Reconnect before assigning students.</p>}
      {reader.data && <AssignmentDirectory key={reader.data.schoolYear.id} data={reader.data} busy={reader.loading || reader.offline} write={write} refresh={reader.retry} />}
    </LoadingRegion>
  </SectionAssignmentPageComposition>;
}

function AssignmentDirectory({ data, busy, write, refresh }: {
  data: AssignmentData; busy: boolean; write: typeof assignSections; refresh: () => Promise<void>;
}) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useLoadingOutletContext<AdminThemeContext>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(''), [target, setTarget] = useState('');
  const [search, setSearch] = useState(''), [status, setStatus] = useState('Unassigned');
  const [page, setPage] = useState(0), [selected, setSelected] = useState<number[]>([]);
  const [confirmation, setConfirmation] = useState<AssignmentInput | null>(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const reset = () => { setSelected([]); setPage(0); };
  const query = search.trim().toLocaleLowerCase();
  const sections = data.sections.filter(s => s.grade_level_id === Number(grade));
  const filtered = data.students.filter(s => (!grade || s.grade_level_id === Number(grade)) &&
    (status === 'All Students' || s.assignment_status === status) &&
    (!query || `${s.student_number} ${s.last_name} ${s.first_name} ${s.middle_name ?? ''}`.toLocaleLowerCase().includes(query)));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const eligible = visible.filter(s => s.assignment_status === 'Unassigned' && s.section_id === null && s.grade_level_id === Number(grade));
  const validSelected = selected.filter(id => eligible.some(s => s.id === id));
  const blocked = busy || saving;
  const canAssign = !blocked && !!grade && sections.some(s => s.id === Number(target)) && selected.length > 0 && validSelected.length === selected.length;
  const all = eligible.length > 0 && eligible.every(s => selected.includes(s.id));
  const mixed = !all && eligible.some(s => selected.includes(s.id));
  const control = `h-8 max-w-full rounded-lg border px-2.5 text-xs font-semibold ${panelBg} ${panelBorder} ${textPrimary}`;
  const button = `h-8 rounded-lg border px-3 text-xs font-bold disabled:opacity-50 ${panelBorder} ${textPrimary}`;
  const name = (s: AssignmentData['students'][number]) => `${s.last_name}, ${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ''}`;
  async function confirmAssignment() {
    if (!confirmation || submitting.current) return;
    submitting.current = true; setSaving(true);
    try {
      const result = await write(confirmation);
      setSelected([]); setPage(0); setConfirmation(null);
      showToast(`${result.assignedCount} students assigned to ${result.section.label}.`, 'success');
    } catch (error) {
      setSelected([]); setPage(0);
      showToast(error instanceof Error ? error.message : 'Assignment failed. Refresh before retrying.', 'error');
      await refresh();
      throw error;
    } finally { submitting.current = false; setSaving(false); }
  }
  return <div className="space-y-4">
    <div className={`overflow-hidden rounded-xl border ${panelBg} ${panelBorder} ${textPrimary}`} aria-label="Assignment summary">
      <dl className="grid grid-cols-2 gap-y-5 px-5 py-4 sm:grid-cols-4">
        {[
          { label: 'School Year', value: data.schoolYear.label, icon: CalendarDays },
          { label: 'Unassigned', value: data.counts.unassigned, icon: UserRoundMinus },
          { label: 'Assigned', value: data.counts.assigned, icon: UserRoundCheck },
          { label: 'Needs review', value: data.counts.needsReview, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }, index) => <div key={label} className={`min-w-0 ${index > 0 ? `sm:border-l sm:pl-5 ${panelBorder}` : ''} ${index % 2 === 1 ? 'pl-5' : ''}`}>
          <dt className={`flex items-center gap-2 text-xs font-medium ${textMuted}`}><Icon size={18} strokeWidth={1.75} className="shrink-0" style={{ color: "var(--color-maroon)" }} aria-hidden="true" />{label}</dt>{' '}
          <dd className="mt-1 text-lg font-bold leading-tight tabular-nums">{value}</dd>
        </div>)}
      </dl>
      {data.counts.needsReview > 0 && <p role="status" className={`border-t px-5 py-3 text-xs leading-relaxed ${panelBorder} ${textMuted}`}>Students needing review have invalid placements and are excluded from assignment.</p>}
    </div>
    <StudentSearchInput value={search} onChange={value => { setSearch(value); reset(); }} darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder}>
      <label className={`text-xs ${textMuted}`}>Grade Level <AccountSelect aria-label="Grade Level" className={control} value={grade} disabled={blocked} onChange={e => { setGrade(e.target.value); setTarget(''); reset(); }}>
        <option value="">Select grade</option>{data.grades.map(g => <option key={g.id} value={g.id}>{g.grade_level}</option>)}
      </AccountSelect></label>
      <label className={`text-xs ${textMuted}`}>Assignment Status <AccountSelect aria-label="Assignment Status" className={control} value={status} disabled={blocked} onChange={e => { setStatus(e.target.value); reset(); }}>
        {['Unassigned', 'Assigned', 'All Students'].map(value => <option key={value}>{value}</option>)}
      </AccountSelect></label>
    </StudentSearchInput>
    <section className={`overflow-hidden rounded-xl border ${panelBg} ${panelBorder}`}>
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className={`flex w-full flex-col gap-2 text-xs font-semibold sm:w-48 ${textMuted}`}>Target Section <AccountSelect aria-label="Target Section" className={`${control} w-full`} value={target} disabled={!grade || blocked || !sections.length} onChange={e => setTarget(e.target.value)}>
            <option value="">Select section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
          </AccountSelect></label>
          <span className={`flex h-8 items-center text-sm tabular-nums ${textMuted}`} aria-live="polite">{validSelected.length} {validSelected.length === 1 ? 'student' : 'students'} selected</span>
        </div>
        <div className="grid gap-2 sm:flex sm:items-center sm:justify-end">
          <button type="button" className={`${button} min-h-8 whitespace-nowrap`} disabled={!selected.length || saving} onClick={() => setSelected([])}>Clear selection</button>
          <button type="button" disabled={!canAssign} onClick={() => setConfirmation({ schoolYearId: data.schoolYear.id, gradeLevelId: Number(grade), sectionId: Number(target), studentIds: [...selected] })} className="h-8 min-h-8 whitespace-nowrap rounded-lg bg-maroon px-3 text-xs font-bold text-white disabled:opacity-50">Assign Selected Students</button>
        </div>
      </div>
      {!grade && <p className={`border-t px-5 py-3 text-xs leading-relaxed ${panelBorder} ${textMuted}`}>Select a grade level before selecting students and a target section.</p>}
      {grade && !sections.length && <p className={`border-t px-5 py-3 text-xs leading-relaxed ${panelBorder} ${textMuted}`}>No sections with an active class are configured for this grade and school year. <button type="button" className="underline" onClick={() => navigate('/admin/classes/new')}>Create or configure a class first</button>.</p>}
    </section>
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-label="Student section directory" aria-busy={busy}>
      <p className={`border-b px-4 py-3 text-xs font-bold ${panelBorder} ${textMuted}`}>{filtered.length} students · Select all applies only to eligible students displayed on this page (up to {PAGE_SIZE}).</p>
      <div className="overflow-x-auto">
        <table className={`teacher-user-table w-full min-w-208 text-sm ${textPrimary}`}>
          <thead className={darkMode ? 'bg-white/5' : 'bg-brand-light'}><tr>
            <th className="px-4 py-3"><input type="checkbox" className="accent-[var(--color-maroon)]" aria-label="Select all eligible students on this page" aria-checked={mixed ? 'mixed' : all} ref={el => { if (el) el.indeterminate = mixed; }} checked={all} disabled={blocked || !grade || !eligible.length} onChange={e => setSelected(e.target.checked ? eligible.map(s => s.id) : [])} /></th>
            {['Student ID', 'Full Name', 'Gender', 'Grade Level', 'Current Section', 'Status'].map(label => <th scope="col" key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold">{label}</th>)}
          </tr></thead>
          <tbody>{(['Male', 'Female', 'Other'] as const).map(group => {
            const students = visible.filter(s => group === 'Other' ? !['Male','Female'].includes(s.gender) : s.gender === group);
            return students.length ? <Fragment key={group}>
              <tr className={darkMode ? 'bg-white/5' : 'bg-brand-light'}><th scope="rowgroup" colSpan={7} className={`px-4 py-2 text-left text-xs font-bold ${textMuted}`}>{group === 'Other' ? 'Gender not specified' : group}</th></tr>
              {students.map(s => <tr key={s.id} className={`border-t ${panelBorder} ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/[0.02]'}`}>
                <td className="px-4 py-3"><input type="checkbox" className="accent-[var(--color-maroon)]" aria-label={`Select ${name(s)}`} checked={validSelected.includes(s.id)} disabled={blocked || !grade || !eligible.some(row => row.id === s.id)} onChange={e => setSelected(old => e.target.checked ? [...old, s.id] : old.filter(id => id !== s.id))} /></td>
                <td className="px-4 py-3 text-xs tabular-nums">{s.student_number}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-2"><StudentAvatar gender={s.gender === 'Male' || s.gender === 'Female' ? s.gender : undefined} name={name(s)} className="h-8 w-8" /><span className="font-semibold">{name(s)}</span></span></td>
                <td className="px-4 py-3">{s.gender}</td><td className="whitespace-nowrap px-4 py-3">{s.grade_level}</td>
                <td className="px-4 py-3">{s.section_name ?? (s.section_id === null ? 'Unassigned' : 'Invalid section')}</td><td className="whitespace-nowrap px-4 py-3">{s.assignment_status}</td>
              </tr>)}
            </Fragment> : null;
          })}{!visible.length && <tr><td colSpan={7} className={`px-4 py-10 text-center ${textMuted}`}>{search ? 'No students match your search.' : status === 'Unassigned' ? 'No students awaiting section assignment.' : 'No students match these filters.'}</td></tr>}</tbody>
        </table>
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${panelBorder}`}>
        <span className={`text-xs ${textMuted}`}>Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}</span>
        <div className="flex gap-2"><button type="button" className={button} disabled={blocked || page === 0} onClick={() => { setPage(p => p - 1); setSelected([]); }}>Previous</button><button type="button" className={button} disabled={blocked || (page + 1) * PAGE_SIZE >= filtered.length} onClick={() => { setPage(p => p + 1); setSelected([]); }}>Next</button></div>
      </div>
    </section>
    {confirmation && <ConfirmationModal title="Confirm Section Assignment" darkMode={darkMode} confirmLabel="Confirm Assignment" onClose={() => { if (!saving) setConfirmation(null); }} onConfirm={confirmAssignment}
      description={<>You are about to assign {confirmation.studentIds.length} {data.grades.find(g => g.id === confirmation.gradeLevelId)?.grade_level} students to Section {data.sections.find(s => s.id === confirmation.sectionId)?.section_name} for School Year {data.schoolYear.label}.</>} />}
  </div>;
}

export function SectionAssignmentPage() {
  return <AdminSessionBoundary resource="section-assignment"><QueryClientProvider client={queryClient}><AssignmentQueries /></QueryClientProvider></AdminSessionBoundary>;
}

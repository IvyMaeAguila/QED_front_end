import { useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { AttendanceMap, AttendanceStatus } from '../subjects/detail/types/Grading';

type Edit = { studentId: string; date: string; status: AttendanceStatus; revision: number };
type Save = (action: () => Promise<void>, key?: string) => Promise<boolean>;

/** Show a click immediately while the existing save queue preserves server ordering.
 * A failed last edit reveals the last confirmed value and remains retryable.
 * Older responses never replace a newer optimistic edit or another class/term.
 */
export function useAttendanceCellEdits(scope: string, stored: AttendanceMap, setStored: Dispatch<SetStateAction<AttendanceMap>>, save: Save,
  persist: (studentId: string, date: string, status: AttendanceStatus) => Promise<void>) {
  const [state, setState] = useState<{ scope: string; edits: Record<string, Edit> }>({ scope, edits: {} });
  if (state.scope !== scope) setState({ scope, edits: {} });
  const edits = state.edits;
  const setEdits = (next: Record<string, Edit>) => setState({ scope, edits: next });

  const liveEdits = useRef<Record<string, Edit>>({});
  const revisions = useRef<Record<string, number>>({});
  const resource = useRef({ scope, active: false });
  useLayoutEffect(() => {
    const lifetime = { scope, active: true };
    resource.current = lifetime;
    liveEdits.current = {}; revisions.current = {};
    return () => { lifetime.active = false; };
  }, [scope]);
  const attendance = useMemo(() => {
    const merged = { ...stored };
    for (const edit of Object.values(edits)) merged[edit.studentId] = { ...merged[edit.studentId], [edit.date]: edit.status };
    return merged;
  }, [stored, edits]);
  function getStatus(studentId: string, date: string): AttendanceStatus {
    const edit = liveEdits.current[studentId + ':' + date];
    return edit ? edit.status : stored[studentId]?.[date] ?? null;
  }
  function saveMark(studentId: string, date: string, status: AttendanceStatus) {
    const key = studentId + ':' + date;
    const lifetime = resource.current;
    const isCurrent = () => lifetime.active && resource.current === lifetime;
    const revision = (revisions.current[key] ?? 0) + 1;
    revisions.current[key] = revision;
    const entry = { studentId, date, status, revision };
    const isLatest = () => isCurrent() && revisions.current[key] === revision;
    const show = () => {
      if (!isLatest()) return;
      liveEdits.current = { ...liveEdits.current, [key]: entry }; setEdits(liveEdits.current);
    };
    const clear = () => {
      if (!isLatest()) return;
      const next = { ...liveEdits.current }; delete next[key]; liveEdits.current = next; setEdits(next);
    };
    show();
    let attempted = false;
    void save(async () => {
      // A retained failure must not retry an obsolete value after a newer click.
      if (!isCurrent() || (attempted && !isLatest())) return;
      attempted = true; show();
      try {
        await persist(studentId, date, status);
        if (isCurrent()) setStored(previous => ({ ...previous, [studentId]: { ...previous[studentId], [date]: status } }));
        clear();
      } catch (error) { clear(); throw error; }
    }, key);
  }
  return { attendance, getStatus, saveMark, isPending: (studentId: string, date: string) => !!edits[studentId + ':' + date] };
}

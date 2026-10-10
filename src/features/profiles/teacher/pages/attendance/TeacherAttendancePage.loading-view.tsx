import { SkeletonAvatar,SkeletonText } from "@shared/components/SkeletonLoading";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberColumns,rememberRows,skeletonRows,useColumnReservation } from "@shared/loading/reservations";
import {
CheckCheck,
ClipboardList,
Search,
} from "lucide-react";
import { Fragment,useRef,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
ATTENDANCE_CYCLE,
ATTENDANCE_META,
todayISO,
type AttendanceMap,
} from "../subjects/detail/types/Grading";
import { AdvisorySectionTabs } from "./components/AdvisorySectionTabs.tsx";
import {
fetchAdvisoryAttendance,
saveAdvisoryAttendance,
type AdvisorySection,
} from "./services/attendance.service.ts";
import { useSelectedAdvisorySection } from "./services/useSelectedAdvisorySection.service";

const PRESENT = "P" as keyof typeof ATTENDANCE_META;

type RosterEntry = AdvisorySection["roster"][number];

function useTeacherAttendancePageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const {
    sections,
    section,
    error: sectionError,
    selectSection,
    retry: retrySections,
    requestedClassId,
  } = useSelectedAdvisorySection();

  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceLoadedFor, setAttendanceLoadedFor] = useState<string | null>(null);
  const [attendanceAttempt, setAttendanceAttempt] = useState(0);
  const table = useRef<HTMLTableElement>(null);
  const loading = !sectionError && (sections === undefined || Boolean(section && (attendanceLoading || attendanceLoadedFor !== section.classId)));
  const view = `teacher-today-attendance:${requestedClassId ?? "default"}:${searchQuery}`;
  const columns = [{ label: "No.", cls: "w-16 text-left", reservedWidth: 64 }, { label: "Student", cls: "text-left", typical: "Maria Alexandra Santos" }, { label: "Status", cls: "w-44 text-center", reservedWidth: 176 }];
  const widths = useColumnReservation(view, columns, loading);

  const iso = todayISO();
  const activeTerm = section?.terms.find((term) => term.isActive);
  const canMarkToday = Boolean(
    activeTerm && iso >= activeTerm.startDate && iso <= activeTerm.endDate,
  );

  function cycle(studentId: string) {
    if (!section || !activeTerm || !canMarkToday) return;
    const current = attendance[studentId]?.[iso] ?? null;
    const idx = ATTENDANCE_CYCLE.indexOf(current);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];

    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [iso]: next },
    }));

    saveAdvisoryAttendance(section.classId, studentId, iso, next, activeTerm.id).catch(
      (err) => {
        console.error("Failed to save attendance:", err);
        setAttendance((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], [iso]: current },
        }));
      },
    );
  }

  function markAllPresent() {
    if (!section || !activeTerm || !canMarkToday) return;
    const targets = filteredRoster.length > 0 ? filteredRoster : section.roster;

    for (const student of targets) {
      const current = attendance[student.id]?.[iso] ?? null;
      if (current === PRESENT) continue;

      setAttendance((prev) => ({
        ...prev,
        [student.id]: { ...prev[student.id], [iso]: PRESENT },
      }));

      saveAdvisoryAttendance(section.classId, student.id, iso, PRESENT, activeTerm.id).catch(
        (err) => {
          console.error("Failed to save attendance:", err);
          setAttendance((prev) => ({
            ...prev,
            [student.id]: { ...prev[student.id], [iso]: current },
          }));
        },
      );
    }
  }

  const markedCount = section
    ? section.roster.filter((s) => attendance[s.id]?.[iso]).length
    : 0;

  const filteredRoster: RosterEntry[] = section
    ? section.roster.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const allMarkedPresent =
    filteredRoster.length > 0 &&
    filteredRoster.every((s) => attendance[s.id]?.[iso] === PRESENT);

  function isFemale(student: RosterEntry): boolean {
    const g = String(student.gender ?? "")
      .trim()
      .toUpperCase();
    return g === "F" || g === "FEMALE";
  }

  const cardClasses = `overflow-hidden rounded-[12px] border shadow-card ${panelBg} ${panelBorder}`;
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const displaySectionName = section
    ? section.sectionName?.trim() || `Advisory (${section.gradeLevel})`
    : "";

  // `index` is the 0-based position inside its Male / Female group, so the
  // numbering restarts at 1 for each group.
  function renderStudentRow(student: RosterEntry, index: number, pending: boolean) {
    const status = attendance[student.id]?.[iso] ?? null;
    const meta = status ? ATTENDANCE_META[status] : null;
    return (
      <tr
        key={student.id}
        data-sk-region="attendance-student-row" data-sk-item=""
        className={`border-t transition-colors ${
          darkMode
            ? "border-white/10 hover:bg-white/5"
            : "border-black/10 hover:bg-black/5"
        }`}
      >
        <td
          className={`whitespace-nowrap px-4 py-2 text-xs font-bold tabular-nums ${textMuted}`} data-sk-region="teacherattendancepage-td-field-1"
        >
          {pending ? <SkeletonText width="2ch" /> : index + 1}
        </td>
        <td className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5" data-sk-region="teacherattendancepage-div-field-2">
            {pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={student.gender} name={student.name} />}
            <span className={`truncate text-xs font-bold ${textPrimary}`} data-sk-region="teacherattendancepage-span-field-3">
              {pending ? <SkeletonText width={`${14 + index % 3 * 2}ch`} /> : student.name}
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-2 text-center">
          <button
            onClick={() => cycle(student.id)}
            disabled={pending || !canMarkToday}
            title={canMarkToday ? "Change today's attendance" : "Attendance entry is unavailable outside an open term"}
            className="inline-flex h-7 min-w-13 items-center justify-center rounded-lg px-2.5 text-xs font-black tabular-nums transition-transform enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            style={
              meta
                ? {
                    backgroundColor: darkMode ? `color-mix(in srgb, ${meta.color} 14.51%, transparent)` : meta.bg,
                    color: meta.color,
                  }
                : {
                    backgroundColor: darkMode ? "#ffffff10" : "var(--surface-page)",
                    color: "#9CA3AF",
                  }
            } data-sk-region="teacherattendancepage-button-field-4"
          >
            {pending ? <SkeletonText width="3ch" /> : status ?? "Mark"}
          </button>
        </td>
      </tr>
    );
  }

  // Full-width divider row, same style as the Holistic Overview table.
  function renderGroupHeader(label: string) {
    return (
      <tr>
        <th
          data-sk-static="" data-sk-region={`attendance-group-${label}`}
          colSpan={3}
          className={`px-4 py-1.5 text-left text-xs font-black uppercase tracking-wider ${
            darkMode ? "bg-white/10" : "bg-brand-light"
          } ${textPrimary}`}
        >
          {label}
        </th>
      </tr>
    );
  }

  function renderRoster(pending: boolean) {
    const rows: RosterEntry[] = pending ? Array.from({ length: skeletonRows(view) }, (_, index) => ({ id: String(index), name: "", gender: index % 2 ? "F" : "M" })) : filteredRoster;
    const groups = [{ label: "Male", rows: rows.filter(student => !isFemale(student)) }, { label: "Female", rows: rows.filter(isFemale) }];
    return <div className="overflow-x-auto"><table ref={pending ? undefined : table} className="teacher-user-table w-full text-sm">
      {pending && <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
      <thead data-sk-region="attendance-table-header"><tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>{columns.map(column => <th key={column.label} data-sk-static="" data-sk-region={`attendance-column-${column.label}`} className={`whitespace-nowrap px-4 py-2 text-xs font-black uppercase tracking-wider ${column.cls} ${textMuted}`}>{column.label}</th>)}</tr></thead>
      <tbody>{rows.length === 0 ? <tr><td colSpan={3} className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>No students found matching "{searchQuery}".</td></tr> : groups.filter(group => group.rows.length > 0).map(group => <Fragment key={group.label}>{renderGroupHeader(group.label)}{group.rows.map((student, index) => renderStudentRow(student, index, pending))}</Fragment>)}</tbody>
    </table></div>;
  }

  if (sectionError) {
    return { content: ((
      <div className="w-full min-h-full pb-12">
        <div className="w-full">
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="teacherattendancepage-attendance" data-sk-static="">Attendance</h1><LoadingRegion loading={false} error={sectionError} retry={retrySections} skeleton={null}>{null}</LoadingRegion>
          </div>
        </div>
      </div>
    )), scope: { section, setAttendanceLoading, setAttendanceError, fetchAdvisoryAttendance, setAttendance, setAttendanceLoadedFor, attendanceAttempt } };
  }

  // sections === null -> confirmed zero advisory classes
  if (!loading && !section) {
    return { content: ((
      <div className="w-full min-h-full pb-12">
        <div className="w-full">
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className={`text-sm font-bold ${textPrimary}`} data-sk-region="teacherattendancepage-no-advisory-class-assigned" data-sk-static="">
              No advisory class assigned
            </p>
            <p className={`mt-1 text-xs ${textMuted}`} data-sk-region="teacherattendancepage-you-re-not-currently-set-as-the-adviser-for-a" data-sk-static="">
              You're not currently set as the adviser for a section, so there's
              nothing to take attendance for.
            </p>
          </div>
        </div>
      </div>
    )), scope: { section, setAttendanceLoading, setAttendanceError, fetchAdvisoryAttendance, setAttendance, setAttendanceLoadedFor, attendanceAttempt } };
  }

  return { content: ((
    <div className="w-full min-h-full pb-0">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1
                className={`qed-type-page-title ${textPrimary}`} data-sk-region="teacherattendancepage-attendance-" data-sk-static=""
              >
                Attendance — <LoadingRegion as="span" name="attendance-section-name" loading={loading} variable skeleton={<SkeletonParagraph field="attendance-section-name" typical={2} />}><span data-sk-field="attendance-section-name">{displaySectionName}</span></LoadingRegion>
              </h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {todayLabel} · <LoadingRegion as="span" name="attendance-marked-count" loading={loading} variable skeleton={<SkeletonText width="12ch" />}>{markedCount}/{section?.roster.length ?? 0} marked</LoadingRegion>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdvisorySectionTabs
              sections={sections ?? []}
              activeClassId={section?.classId ?? ""}
              onSelect={selectSection}
              darkMode={darkMode}
              panelBorder={panelBorder}
              textMuted={textMuted}
            />
            <button
              disabled={!section}
              onClick={() =>
                navigate(
                  `/teacher/attendance/records?classId=${section?.classId ?? ""}`,
                )
              }
              className={`flex h-8 items-center gap-1.5 rounded-lg border bg-maroon text-white px-3 text-xs font-extrabold transition-colors hover:bg-maroon-light ${
                darkMode ? "border-white/10" : "border-black/10"
              }`} data-sk-region="teacherattendancepage-full-records" data-sk-static=""
            >
              <ClipboardList size={12} />
              Full Records
            </button>
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-[12px] border px-3 py-2 ${panelBg} ${panelBorder}`}
        >
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className={`relative w-full h-8 pl-8 pr-2.5 rounded-lg border text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(
              Object.keys(ATTENDANCE_META) as (keyof typeof ATTENDANCE_META)[]
            ).map((key) => {
              const meta = ATTENDANCE_META[key];
              return (
                <span
                  key={key}
                  data-sk-static="" data-sk-region={`attendance-legend-${key}`}
                  className="flex items-center gap-1 text-xs font-bold"
                  style={{ color: meta.color }}
                >
                  <i
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {key} — {meta.label}
                </span>
              );
            })}
          </div>
        </div>

        <LoadingRegion name="attendance-term-notice" loading={loading} variable skeleton={<div className={`rounded-lg border px-3 py-2 text-xs font-medium ${panelBg} ${panelBorder} ${textMuted}`}><SkeletonParagraph field="attendance-term-notice" typical={3} width="100%" /></div>}>
        {!canMarkToday && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${panelBg} ${panelBorder} ${textMuted}`}
            data-sk-field="attendance-term-notice"
          >
            Attendance entry is closed because today is outside an open term. You can still review and edit attendance already recorded for earlier dates in Full Records.
          </div>
        )}
        </LoadingRegion>

        <section className={cardClasses} aria-label="Today's attendance roster">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <p
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="teacherattendancepage-today-s-roster" data-sk-static=""
              >
                Today's Roster
              </p>
              <p className={`truncate text-xs font-medium ${textMuted}`}>
                <LoadingRegion as="span" name="attendance-roster-count" loading={loading} variable skeleton={<SkeletonText width="12ch" />}>· {filteredRoster.length} student{filteredRoster.length === 1 ? "" : "s"}</LoadingRegion>
              </p>
            </div>

            <button
              onClick={markAllPresent}
              disabled={loading || !canMarkToday || allMarkedPresent}
              className={`flex h-7 w-36 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
              }`} data-sk-region="teacherattendancepage-mark-all-present" data-sk-static=""
            >
              <CheckCheck size={12} style={{ color: "var(--brand-ink)" }} />
              Mark All Present
            </button>
          </div>

          <LoadingRegion name="today-attendance-roster" loading={loading} variable autoColumns error={attendanceError} retry={() => setAttendanceAttempt(value => value + 1)} frame={renderRoster} skeleton={null} retainPrevious hasContent={filteredRoster.length > 0} onSettled={() => { rememberRows(view, filteredRoster.length); rememberColumns(view, table.current); }}>{null}</LoadingRegion>
        </section>
      </div>
    </div>
  )), scope: { section, setAttendanceLoading, setAttendanceError, fetchAdvisoryAttendance, setAttendance, setAttendanceLoadedFor, attendanceAttempt } };
}


export type TeacherAttendancePageEffectScope = ReturnType<typeof useTeacherAttendancePageState>["scope"];
export type TeacherAttendancePageRouteProps = Record<string, never>;
export function TeacherAttendancePageComposition(props: object & { effects?: (scope: TeacherAttendancePageEffectScope) => import("react").ReactNode }) {
 const state = useTeacherAttendancePageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

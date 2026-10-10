import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonControl } from "@shared/components/SkeletonLoading";
import { rememberColumns, useColumnReservation } from "@shared/loading/reservations";
import { Fragment, useMemo, useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Check, Pencil, Sparkles } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { RosterStudent } from "./data";
import { HOLISTIC_COLUMNS, HOLISTIC_LEVELS, type HolisticAxisKey } from "./types/Grading";
import {
  fetchGradingPeriodsGlobal,
  fetchHolisticWeekly,
  saveHolistic,
  type GradingPeriod,
  type HolisticWeeklyMap,
  type StudentWeeklyHolisticRecord,
  type WeeklyAxisScores,
} from "../../holistic/services/holistic.service";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

const ACCENT = "var(--color-maroon)";

const EMPTY_TREND: StudentWeeklyHolisticRecord["trend"] = {
  weeksCount: 0,
  weeklyScores: [],
  pastAverage: null,
  recentAverage: null,
  currentWeekAverage: null,
  trend: "No Data",
};

interface HolisticRecordsSectionProps {
  subjectSectionId: string;
  roster: GenderedStudent[];
  // Optional hints for which grading period is "active" for this view.
  // Either can be omitted: the component fetches the full grading-period
  // list itself (fetchGradingPeriodsGlobal) and resolves the matching
  // period's startDate/endDate/schoolYearId from the DB. gradingPeriodId
  // (an exact period id) takes priority over termNumber (a quarter number,
  // which can be ambiguous across school years) if both are given.
  gradingPeriodId?: string;
  termNumber?: number;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

interface MonthGroup {
  key: string;
  label: string;
  weekStartDates: string[];
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatWeekRange(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 4); // Mon -> Fri, a school week
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel =
    end.getMonth() === start.getMonth()
      ? String(end.getDate())
      : end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel}-${endLabel}`;
}

function currentMonthKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

// Clamp a candidate month (e.g. "today") into the term's [start, end] range.
// If the term has no bounds, the candidate passes through unchanged.
function clampMonthToTerm(candidate: string, termStartDate?: string, termEndDate?: string): string {
  const start = termStartDate ? monthKeyOf(termStartDate) : null;
  const end = termEndDate ? monthKeyOf(termEndDate) : null;
  if (start && candidate < start) return start;
  if (end && candidate > end) return end;
  return candidate;
}

// Every month key that falls within [termStartDate, termEndDate], inclusive.
function monthsInTerm(termStartDate?: string, termEndDate?: string): string[] {
  if (!termStartDate || !termEndDate) return [];
  const start = new Date(termStartDate + "T00:00:00");
  const end = new Date(termEndDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function mondaysInMonth(monthKey: string): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  const dates: string[] = [];
  const cursor = new Date(year, month - 1, 1);
  while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1);
  while (cursor.getMonth() === month - 1) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

function upsertAxisValue(
  data: HolisticWeeklyMap,
  studentId: string,
  weekStartDate: string,
  axis: HolisticAxisKey,
  value: number
): HolisticWeeklyMap {
  const existing = data[studentId] ?? { weeks: [], trend: EMPTY_TREND };
  const weeks = [...existing.weeks];
  const idx = weeks.findIndex((w) => w.weekStartDate === weekStartDate);
  if (idx === -1) {
    const fresh: WeeklyAxisScores = {
      weekStartDate,
      cognitive: null,
      emotional: null,
      social: null,
      behavioral: null,
      average: null,
      [axis]: value,
    };
    weeks.push(fresh);
    weeks.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  } else {
    weeks[idx] = { ...weeks[idx], [axis]: value };
  }
  return { ...data, [studentId]: { ...existing, weeks } };
}

export function HolisticRecordsSection({
  subjectSectionId,
  roster,
  gradingPeriodId,
  termNumber,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: HolisticRecordsSectionProps) {
  const [attempt, setAttempt] = useState(0);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const table = useRef<HTMLTableElement>(null);
  const [weeklyData, setWeeklyData] = useState<HolisticWeeklyMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const hasInitializedMonth = useRef(false);
  const latestRequestId = useRef(0);

  // Grading periods, fetched straight from the DB (same endpoint the term
  // picker elsewhere uses). This is where the term's date range and school
  // year actually come from now, rather than being passed down as props.
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [periodsLoaded, setPeriodsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false; setPeriodsLoaded(false); setPeriodError(null);
    fetchGradingPeriodsGlobal().then(value => { if (!cancelled) setGradingPeriods(value); })
      .catch(err => { if (!cancelled) setPeriodError(err instanceof Error ? err.message : "Couldn't load grading periods."); })
      .finally(() => { if (!cancelled) setPeriodsLoaded(true); });
    return () => { cancelled = true; };
  }, [attempt]);

  // Resolve which period is "active" for this view: an explicit
  // gradingPeriodId wins, then a matching termNumber, then whichever period
  // the backend marks isActive, then just the first one returned.
  const activePeriod: GradingPeriod | null = useMemo(() => {
    if (gradingPeriods.length === 0) return null;
    if (gradingPeriodId) {
      const found = gradingPeriods.find((p) => p.id === gradingPeriodId);
      if (found) return found;
    }
    if (termNumber !== undefined) {
      const found = gradingPeriods.find((p) => p.termNumber === termNumber);
      if (found) return found;
    }
    return gradingPeriods.find((p) => p.isActive) ?? gradingPeriods[0] ?? null;
  }, [gradingPeriods, gradingPeriodId, termNumber]);

  // The termNumber actually sent to the API: explicit prop wins, otherwise
  // whatever the resolved DB period says.
  const resolvedTermNumber = termNumber ?? activePeriod?.termNumber;

  useEffect(() => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);
    hasInitializedMonth.current = false;
    setSelectedMonthKey(null);
    fetchHolisticWeekly(subjectSectionId, resolvedTermNumber)
      .then(({ data }) => {
        if (latestRequestId.current === requestId) setWeeklyData(data);
      })
      .catch((err) => {
        console.error("Failed to load holistic records:", err);
        if (latestRequestId.current === requestId) setError("Couldn't load holistic records. Try refreshing.");
      })
      .finally(() => {
        if (latestRequestId.current === requestId) setLoading(false);
      });
  }, [subjectSectionId, resolvedTermNumber, attempt]);

  function handleCellChange(studentId: string, axis: HolisticAxisKey, weekStartDate: string, raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") return;
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 1 || value > 5) return;

    setWeeklyData((prev) => upsertAxisValue(prev, studentId, weekStartDate, axis, value));

    saveHolistic(subjectSectionId, studentId, axis, value, { weekStartDate, termNumber: resolvedTermNumber }).catch(
      (err) => {
        console.error("Failed to save holistic rating:", err);
      }
    );
  }

  const monthGroups: MonthGroup[] = useMemo(() => {
    const weeksByMonth = new Map<string, Set<string>>();
    for (const record of Object.values(weeklyData)) {
      for (const week of record.weeks) {
        const monthKey = week.weekStartDate.slice(0, 7);
        if (!weeksByMonth.has(monthKey)) weeksByMonth.set(monthKey, new Set());
        weeksByMonth.get(monthKey)!.add(week.weekStartDate);
      }
    }
    return Array.from(weeksByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, set]) => ({
        key,
        label: formatMonthLabel(key),
        weekStartDates: Array.from(set).sort(),
      }));
  }, [weeklyData]);

  // Every month the dropdown should offer: any recorded month, plus every
  // month that falls inside the active period's date range (fetched from
  // the DB above), so you can jump to a term month that has no entries yet.
  // If the period's bounds aren't available for some reason, fall back to
  // just offering the current calendar month like before.
  const availableMonthKeys = useMemo(() => {
    const keys = new Set(monthGroups.map((g) => g.key));
    const termMonths = monthsInTerm(activePeriod?.startDate, activePeriod?.endDate);
    if (termMonths.length > 0) {
      termMonths.forEach((m) => keys.add(m));
    } else {
      keys.add(currentMonthKey());
    }
    return Array.from(keys).sort();
  }, [monthGroups, activePeriod]);

  // Default month once both the weekly data and the grading periods have
  // loaded: today's month, clamped inside the active period's range.
  // Viewing a term that already ended lands on that term's last month;
  // viewing one that hasn't started yet lands on its first month; viewing
  // the currently-active term just shows today.
  useEffect(() => {
    if (hasInitializedMonth.current || loading || !periodsLoaded) return;
    hasInitializedMonth.current = true;
    setSelectedMonthKey(clampMonthToTerm(currentMonthKey(), activePeriod?.startDate, activePeriod?.endDate));
  }, [loading, periodsLoaded, activePeriod]);

  const displayGroup: MonthGroup | null = useMemo(() => {
    if (!selectedMonthKey) return null;
    const recorded = monthGroups.find((g) => g.key === selectedMonthKey);
    if (recorded) return recorded;
    return {
      key: selectedMonthKey,
      label: formatMonthLabel(selectedMonthKey),
      weekStartDates: mondaysInMonth(selectedMonthKey),
    };
  }, [selectedMonthKey, monthGroups]);

  function isFemale(student: GenderedStudent): boolean {
    const g = String(student.gender ?? "").trim().toUpperCase();
    return g === "F" || g === "FEMALE";
  }

  const grouped = useMemo(() => {
    const female = roster.filter((s) => isFemale(s));
    const male = roster.filter((s) => !isFemale(s));
    return { male, female };
  }, [roster]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const cellInputClasses = `h-7 w-10 rounded-lg border text-center text-xs font-black tabular-nums outline-none ${panelBorder} ${
    darkMode ? "bg-panel-dark text-white" : "bg-white text-[#111827]"
  }`;
  const stickyCell = darkMode ? "bg-panel-dark" : "bg-white";
  const groupBand = `px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-brand-light"
  } ${textPrimary}`;
  const domainCount = HOLISTIC_COLUMNS.length;

  function renderStudentRow(student: GenderedStudent, weekStartDates: string[], pending: boolean) {
    const record = weeklyData[student.id];
    const weekByDate = new Map(record?.weeks.map((w) => [w.weekStartDate, w]) ?? []);

    return (
      <tr key={student.id} className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
        <td className={`sticky left-0 z-10 px-4 py-2 ${stickyCell}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <StudentAvatar gender={student.gender} name={student.name} />
            <span className={`truncate text-xs font-bold ${textPrimary}`}>{student.name}</span>
          </div>
        </td>
        {weekStartDates.map((week) => (
          <Fragment key={week}>
            {HOLISTIC_COLUMNS.map((column) => {
              const axis = column.key as HolisticAxisKey;
              const value = weekByDate.get(week)?.[axis] ?? null;
              const level = value !== null ? HOLISTIC_LEVELS.find((l) => l.value === value) : undefined;
              return (
                <td key={`${week}-${column.key}`} className={`border px-1.5 py-2 text-center ${panelBorder}`}>
                  {pending ? <SkeletonControl className="mx-auto h-7 w-7 rounded-lg" /> : isEditing ? (
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step="1"
                      inputMode="numeric"
                      value={value ?? ""}
                      aria-label={`${student.name} ${column.label} rating for week of ${week}`}
                      onChange={(e) => handleCellChange(student.id, axis, week, e.target.value)}
                      className={cellInputClasses}
                    />
                  ) : (
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                        level ? "text-white" : textMuted
                      }`}
                      style={level ? { backgroundColor: level.color } : undefined}
                    >
                      {value ?? "—"}
                    </span>
                  )}
                </td>
              );
            })}
          </Fragment>
        ))}
      </tr>
    );
  }

  const view = `subject-holistic-records:${subjectSectionId}:${resolvedTermNumber ?? "pending"}:${selectedMonthKey ?? currentMonthKey()}`;
  const reservedWeeks = displayGroup?.weekStartDates ?? mondaysInMonth(currentMonthKey());
  const columnWidths = useColumnReservation(view, [{label:"Learner's Name",typical:"Maria Alexandra Delos Santos"}, ...reservedWeeks.flatMap(() => HOLISTIC_COLUMNS.map(column => ({label:column.label,typical:"5"})))], loading || !periodsLoaded);
  function renderWeeklyTable(pending: boolean) {
    if (!roster.length) return <p className={`px-5 py-16 text-center text-sm font-semibold ${textMuted}`}>No students enrolled yet.</p>; 
          const group = displayGroup ?? { key: currentMonthKey(), label: formatMonthLabel(currentMonthKey()), weekStartDates: mondaysInMonth(currentMonthKey()) };
          const columnCount = 1 + group.weekStartDates.length * domainCount;
          return (
            <div className="overflow-x-auto">
              <table ref={table} className="teacher-user-table w-full min-w-max border-collapse text-xs">
                {pending && <colgroup>{columnWidths.map((width,index) => <col key={index} style={{width}} />)}</colgroup>}
                <thead>
                  {/* Row 1: Week N, spanning that week's domain columns */}
                  <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                    <th
                      rowSpan={3}
                      className={`sticky left-0 z-10 min-w-56 border px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${
                        darkMode ? "bg-panel-dark" : "bg-brand-light"
                      } ${panelBorder} ${textMuted}`}
                    >
                      Learner's Name
                    </th>
                    {group.weekStartDates.map((week, i) => (
                      <th
                        key={week}
                        colSpan={domainCount}
                        className={`border px-2 py-2 text-center text-xs font-black uppercase tracking-wider ${panelBorder} ${textPrimary}`}
                      >
                        Week {i + 1}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2: the date range for that week */}
                  <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                    {group.weekStartDates.map((week) => (
                      <th
                        key={week}
                        colSpan={domainCount}
                        className={`border px-2 py-1.5 text-center text-xs font-bold normal-case ${panelBorder} ${textMuted}`}
                      >
                        {formatWeekRange(week)}
                      </th>
                    ))}
                  </tr>
                  {/* Row 3: the domain sub-columns, repeated per week */}
                  <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                    {group.weekStartDates.map((week) => (
                      <Fragment key={week}>
                        {HOLISTIC_COLUMNS.map((column) => (
                          <th
                            key={`${week}-${column.key}`}
                            className={`min-w-16 border px-1.5 py-1.5 text-center text-xs font-bold ${panelBorder} ${textMuted}`}
                          >
                            {column.label}
                          </th>
                        ))}
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.male.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={columnCount} className={groupBand}>
                          Male
                        </td>
                      </tr>
                      {grouped.male.map((student) => renderStudentRow(student, group.weekStartDates, pending))}
                    </>
                  )}

                  {grouped.female.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={columnCount} className={groupBand}>
                          Female
                        </td>
                      </tr>
                      {grouped.female.map((student) => renderStudentRow(student, group.weekStartDates, pending))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
 }

  return (
    <section className={cardClasses} aria-label="Weekly holistic ratings">
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}
      >
        <div>
          <h2 className={`flex items-center gap-1.5 font-extrabold ${textPrimary}`}>
            <Sparkles size={15} style={{ color: "var(--brand-ink)" }} />
            Weekly Holistic Ratings
          </h2>
          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
            {isEditing ? "Changes save as you type" : `${roster.length} student${roster.length === 1 ? "" : "s"}`}
            {activePeriod && (
              <>
                {" "}
                · {activePeriod.termLabel}
                {/* schoolYearId is the raw DB id (e.g. a UUID), not a
                    "2025-2026"-style label. Swap this for a real label field
                    (e.g. activePeriod.schoolYearLabel) once one exists on
                    the GradingPeriod type / API response. */}
                {activePeriod.schoolYearId ? ` · SY ${activePeriod.schoolYearId}` : ""}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(displayGroup || (loading || !periodsLoaded)) && (
            <LoadingFormValue name="subject-holistic-month" loading={(loading || !periodsLoaded) && !displayGroup} width="16ch" intrinsic><select
              value={displayGroup?.key ?? ""}
              disabled={(loading || !periodsLoaded)}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className={`h-10 rounded-lg border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
              aria-label="Month"
            >
              {!displayGroup && <option value="" hidden />}
              {availableMonthKeys.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select></LoadingFormValue>
          )}
          <button
            onClick={() => setIsEditing((v) => !v)}
            className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold transition-colors ${
              isEditing
                ? "border-transparent text-white"
                : darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
            }`}
            style={isEditing ? { background: ACCENT } : undefined}
          >
            {isEditing ? <Check size={13} /> : <Pencil size={13} style={{ color: "var(--brand-ink)" }} />}
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <LoadingRegion name="subject-holistic-records" loading={loading || !periodsLoaded} error={error || periodError} retry={() => setAttempt(value => value + 1)} variable autoColumns skeleton={null} frame={renderWeeklyTable} retainPrevious hasContent={Object.keys(weeklyData).length > 0} onSettled={() => rememberColumns(view, table.current)}>{null}</LoadingRegion>
    </section>
  );
}

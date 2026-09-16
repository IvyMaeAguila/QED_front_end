import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Sparkles, User } from "lucide-react";
import type { RosterStudent } from "./data";
import { HOLISTIC_COLUMNS, HOLISTIC_LEVELS, type HolisticAxisKey } from "./types/Grading";
import {
  fetchHolisticWeekly,
  saveHolistic,
  type HolisticWeeklyMap,
  type StudentWeeklyHolisticRecord,
  type WeeklyAxisScores,
} from "../../holistic/services/holistic.service";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

const ACCENT = "#6B0000";

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
  termNumber?: number;
  termStartDate?: string;
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

function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
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
  termNumber,
  termStartDate,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: HolisticRecordsSectionProps) {
  const [weeklyData, setWeeklyData] = useState<HolisticWeeklyMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const hasInitializedMonth = useRef(false);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);
    hasInitializedMonth.current = false;
    setSelectedMonthKey(null);
    fetchHolisticWeekly(subjectSectionId, termNumber)
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
  }, [subjectSectionId, termNumber]);

  function handleCellChange(studentId: string, axis: HolisticAxisKey, weekStartDate: string, raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") return;
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 1 || value > 5) return;

    setWeeklyData((prev) => upsertAxisValue(prev, studentId, weekStartDate, axis, value));

    saveHolistic(subjectSectionId, studentId, axis, value, { weekStartDate, termNumber }).catch((err) => {
      console.error("Failed to save holistic rating:", err);
    });
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

  useEffect(() => {
    if (hasInitializedMonth.current || loading) return;
    hasInitializedMonth.current = true;
    if (monthGroups.length > 0) {
      setSelectedMonthKey(monthGroups[monthGroups.length - 1].key);
    } else if (termStartDate) {
      setSelectedMonthKey(termStartDate.slice(0, 7));
    } else {
      const today = new Date();
      setSelectedMonthKey(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
    }
  }, [loading, monthGroups, termStartDate]);

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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const cellInputClasses = `h-7 w-10 rounded-lg border text-center text-[11px] font-black tabular-nums outline-none ${panelBorder} ${
    darkMode ? "bg-[#0B1120] text-white" : "bg-white text-[#111827]"
  }`;
  const stickyCell = darkMode ? "bg-[#111827]" : "bg-white";
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;
  const domainCount = HOLISTIC_COLUMNS.length;

  function renderStudentRow(student: GenderedStudent, weekStartDates: string[]) {
    const record = weeklyData[student.id];
    const weekByDate = new Map(record?.weeks.map((w) => [w.weekStartDate, w]) ?? []);

    return (
      <tr key={student.id} className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
        <td className={`sticky left-0 z-10 px-4 py-2 ${stickyCell}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                darkMode ? "bg-white/10" : "bg-black/5"
              } ${textMuted}`}
            >
              <User size={13} />
            </span>
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
                  {isEditing ? (
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
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black tabular-nums ${
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

  return (
    <section className={cardClasses}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}>
        <div className="flex min-w-0 items-center gap-2">
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
            <Sparkles size={13} style={{ color: ACCENT }} />
            Weekly Holistic Ratings
          </p>
          <p className={`truncate text-[11px] font-medium ${textMuted}`}>
            {isEditing ? "· Changes save as you type" : `· ${roster.length} student${roster.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {displayGroup && (
            <div
              role="group"
              aria-label="Month"
              className={`inline-flex h-7 items-center overflow-hidden rounded-md border ${
                darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"
              }`}
            >
              <button
                onClick={() => setSelectedMonthKey((key) => (key ? shiftMonthKey(key, -1) : key))}
                aria-label="Previous month"
                className={`flex h-full items-center px-1.5 transition-colors ${
                  darkMode ? "text-white/70 hover:bg-white/10" : "text-[#374151] hover:bg-black/5"
                }`}
              >
                <ChevronLeft size={13} />
              </button>
              <span className={`px-1.5 text-[11px] font-extrabold ${textPrimary}`}>{displayGroup.label}</span>
              <button
                onClick={() => setSelectedMonthKey((key) => (key ? shiftMonthKey(key, 1) : key))}
                aria-label="Next month"
                className={`flex h-full items-center px-1.5 transition-colors ${
                  darkMode ? "text-white/70 hover:bg-white/10" : "text-[#374151] hover:bg-black/5"
                }`}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
          <button
            onClick={() => setIsEditing((v) => !v)}
            className={`flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-extrabold transition-colors ${
              isEditing
                ? "border-transparent text-white"
                : darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
            }`}
            style={isEditing ? { background: ACCENT } : undefined}
          >
            {isEditing ? <Check size={12} /> : <Pencil size={12} style={{ color: ACCENT }} />}
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className={`px-4 py-12 text-center text-xs font-medium ${textMuted}`}>Loading records…</p>
      ) : error ? (
        <p className="px-4 py-12 text-center text-xs font-bold text-[#DC2626]">{error}</p>
      ) : roster.length === 0 ? (
        <p className={`px-4 py-12 text-center text-xs font-medium ${textMuted}`}>No students enrolled yet.</p>
      ) : !displayGroup ? (
        <p className={`px-4 py-12 text-center text-xs font-medium ${textMuted}`}>Loading records…</p>
      ) : (
        (() => {
          const group = displayGroup;
          const columnCount = 1 + group.weekStartDates.length * domainCount;
          return (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-xs">
                <thead>
                  {/* Row 1: Week N, spanning that week's domain columns */}
                  <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                    <th
                      rowSpan={3}
                      className={`sticky left-0 z-10 min-w-56 border px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${
                        darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                      } ${panelBorder} ${textMuted}`}
                    >
                      Learner's Name
                    </th>
                    {group.weekStartDates.map((week, i) => (
                      <th
                        key={week}
                        colSpan={domainCount}
                        className={`border px-2 py-2 text-center text-[11px] font-black uppercase tracking-wider ${panelBorder} ${textPrimary}`}
                      >
                        Week {i + 1}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2: the date range for that week */}
                  <tr className={darkMode ? "bg-white/5" : "bg-[#FAFBFC]"}>
                    {group.weekStartDates.map((week) => (
                      <th
                        key={week}
                        colSpan={domainCount}
                        className={`border px-2 py-1.5 text-center text-[11px] font-bold normal-case ${panelBorder} ${textMuted}`}
                      >
                        {formatWeekRange(week)}
                      </th>
                    ))}
                  </tr>
                  {/* Row 3: the domain sub-columns, repeated per week */}
                  <tr className={darkMode ? "bg-white/5" : "bg-[#FAFBFC]"}>
                    {group.weekStartDates.map((week) => (
                      <Fragment key={week}>
                        {HOLISTIC_COLUMNS.map((column) => (
                          <th
                            key={`${week}-${column.key}`}
                            className={`min-w-16 border px-1.5 py-1.5 text-center text-[11px] font-bold ${panelBorder} ${textMuted}`}
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
                      {grouped.male.map((student) => renderStudentRow(student, group.weekStartDates))}
                    </>
                  )}

                  {grouped.female.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={columnCount} className={groupBand}>
                          Female
                        </td>
                      </tr>
                      {grouped.female.map((student) => renderStudentRow(student, group.weekStartDates))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()
      )}
    </section>
  );
}
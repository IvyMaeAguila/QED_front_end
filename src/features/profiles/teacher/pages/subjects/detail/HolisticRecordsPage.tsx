import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { RosterStudent } from "./data";
import { HOLISTIC_COLUMNS, HOLISTIC_LEVELS, type HolisticAxisKey } from "./types/Grading";
import {
  fetchHolisticWeekly,
  saveHolistic,
  type HolisticWeeklyMap,
  type StudentWeeklyHolisticRecord,
  type WeeklyAxisScores,
} from "../../holistic/services/holistic.service";

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
  roster: RosterStudent[];
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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const cellInputClasses = `w-10 rounded-md border px-1 py-0.5 text-center text-xs font-black outline-none ${panelBorder} ${
    darkMode ? "bg-[#0B1120] text-white" : "bg-white text-[#111827]"
  }`;
  const domainCount = HOLISTIC_COLUMNS.length;

  return (
    <section className={cardClasses}>
      <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
        <div>
          <span className={`text-xs font-extrabold uppercase tracking-wider ${textPrimary}`}>Holistic ratings — weekly</span>
          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
            {isEditing ? "Edit mode — changes save immediately. Click Done when finished." : "Weekly ratings for each domain."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {displayGroup && (
            <div
              role="group"
              aria-label="Month"
              className={`inline-flex h-9 items-center overflow-hidden rounded-xl border ${panelBorder}`}
            >
              <button
                onClick={() => setSelectedMonthKey((key) => (key ? shiftMonthKey(key, -1) : key))}
                aria-label="Previous month"
                className={`flex h-full items-center px-2 transition-colors ${darkMode ? "text-white/70 hover:bg-white/10" : "text-[#374151] hover:bg-black/5"}`}
              >
                <ChevronLeft size={15} />
              </button>
              <span className={`px-2 text-xs font-extrabold ${textPrimary}`}>{displayGroup.label}</span>
              <button
                onClick={() => setSelectedMonthKey((key) => (key ? shiftMonthKey(key, 1) : key))}
                aria-label="Next month"
                className={`flex h-full items-center px-2 transition-colors ${darkMode ? "text-white/70 hover:bg-white/10" : "text-[#374151] hover:bg-black/5"}`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
          <button
            onClick={() => setIsEditing((v) => !v)}
            className={`flex h-9 w-fit items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold transition-colors ${
              isEditing
                ? "text-white"
                : darkMode
                  ? "border border-white/10 text-white/80 hover:bg-white/5"
                  : "border border-black/10 text-[#111827] hover:bg-black/5"
            }`}
            style={isEditing ? { background: ACCENT } : undefined}
          >
            {isEditing ? <Check size={14} /> : <Pencil size={14} />}
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className={`px-5 py-12 text-center text-sm font-semibold ${textMuted}`}>Loading records…</p>
      ) : error ? (
        <p className="px-5 py-12 text-center text-sm font-semibold text-[#DC2626]">{error}</p>
      ) : roster.length === 0 ? (
        <p className={`px-5 py-12 text-center text-sm font-semibold ${textMuted}`}>No students enrolled yet.</p>
      ) : !displayGroup ? (
        <p className={`px-5 py-12 text-center text-sm font-semibold ${textMuted}`}>Loading records…</p>
      ) : (
        (() => {
          const group = displayGroup;
          return (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-xs border-collapse">
                  <thead>
                    {/* Row 1: Week N, spanning that week's 4 domain columns */}
                    <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                      <th
                        rowSpan={3}
                        className={`sticky left-0 z-10 min-w-52 border px-4 py-3 text-left text-sm font-black uppercase ${darkMode ? "bg-[#111827]" : "bg-white"} ${panelBorder} ${textPrimary}`}
                      >
                        Learner's Name
                      </th>
                      {group.weekStartDates.map((week, i) => (
                        <th
                          key={week}
                          colSpan={domainCount}
                          className={`border px-2 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}
                        >
                          Week {i + 1}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: the date for that week, spanning the same 4 columns */}
                    <tr className={darkMode ? "bg-white/4" : "bg-[#FAFBFC]"}>
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
                    {/* Row 3: the 4 domain sub-columns, repeated per week */}
                    <tr className={darkMode ? "bg-white/3" : "bg-[#FAFBFC]"}>
                      {group.weekStartDates.map((week) => (
                        <Fragment key={week}>
                          {HOLISTIC_COLUMNS.map((column) => (
                            <th key={`${week}-${column.key}`} className={`min-w-16 border px-1.5 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                              {column.label}
                            </th>
                          ))}
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student, index) => {
                      const record = weeklyData[student.id];
                      const weekByDate = new Map(record?.weeks.map((w) => [w.weekStartDate, w]) ?? []);

                      return (
                        <tr key={student.id} className={`border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
                          <td className={`sticky left-0 z-10 px-4 py-2.5 text-sm font-bold ${darkMode ? "bg-[#111827]" : "bg-white"} ${textPrimary}`}>
                            {student.name}
                          </td>
                          {group.weekStartDates.map((week) => (
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
                                        onChange={(e) => handleCellChange(student.id, axis, week, e.target.value)}
                                        className={cellInputClasses}
                                      />
                                    ) : (
                                      <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black tabular-nums ${level ? "text-white" : textMuted}`}
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}
    </section>
  );
}
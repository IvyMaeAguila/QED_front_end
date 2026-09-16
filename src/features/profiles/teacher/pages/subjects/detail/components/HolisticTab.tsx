import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search, Sparkles, User } from "lucide-react";
import type { RosterStudent } from "../data";
import {
  HOLISTIC_COLUMNS,
  HOLISTIC_LEVELS,
  type HolisticAxisKey,
  type HolisticMap,
} from "../types/Grading";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

const ACCENT = "#6B0000";

interface HolisticTabProps {
  roster: GenderedStudent[];
  ratings: HolisticMap;
  weekStartDate: string;
  termNumber: number;
  locked: boolean;
  onRate: (studentId: string, axis: HolisticAxisKey, value: number) => void;
  onOpenRecords: () => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function formatWeekRange(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 4);

  const startLabel = start.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function HolisticTab({
  roster,
  ratings,
  weekStartDate,
  locked,
  onRate,
  onOpenRecords,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: HolisticTabProps) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () =>
      roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [roster, search],
  );

  function isFemale(student: GenderedStudent): boolean {
    const g = String(student.gender ?? "").trim().toUpperCase();
    return g === "F" || g === "FEMALE";
  }

  const grouped = useMemo(() => {
    const female = filtered.filter((s) => isFemale(s));
    const male = filtered.filter((s) => !isFemale(s));
    return { male, female };
  }, [filtered]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;
  const columnCount = 1 + HOLISTIC_COLUMNS.length;

  function renderStudentRow(student: GenderedStudent) {
    return (
      <tr
        key={student.id}
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
      >
        <td
          className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                darkMode ? "bg-white/10" : "bg-black/5"
              } ${textMuted}`}
            >
              <User size={13} />
            </span>
            <span className={`truncate text-xs font-bold ${textPrimary}`}>
              {student.name}
            </span>
          </div>
        </td>
        {HOLISTIC_COLUMNS.map((col) => {
          const current = ratings[student.id]?.[col.key] ?? null;
          return (
            <td key={col.key} className="px-3 py-2">
              <div className="flex items-center justify-center gap-1">
                {HOLISTIC_LEVELS.slice()
                  .reverse()
                  .map((level) => {
                    const selected = current === level.value;
                    return (
                      <button
                        key={level.value}
                        type="button"
                        disabled={locked}
                        aria-disabled={locked}
                        aria-pressed={selected}
                        aria-label={`Rate ${student.name} ${level.label} for ${col.label}`}
                        onClick={() => {
                          onRate(student.id, col.key, level.value);
                          setToast("Weekly holistic records saved.");
                        }}
                        className={`h-7 w-7 rounded-lg text-[11px] font-black tabular-nums transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                          selected
                            ? "text-white"
                            : darkMode
                              ? "bg-white/10 text-[#9CA3AF] hover:bg-white/15"
                              : "bg-[#F3F4F6] text-[#9CA3AF] hover:bg-black/10"
                        }`}
                        style={
                          selected ? { backgroundColor: level.color } : undefined
                        }
                      >
                        {level.value}
                      </button>
                    );
                  })}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search + rating legend + Full Records */}
      <div
        className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}
      >
        <div className="relative w-full lg:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            aria-label="Search student by name"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-[11px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {HOLISTIC_LEVELS.slice()
            .reverse()
            .map((level) => (
              <span
                key={level.value}
                className="flex items-center gap-1 text-[11px] font-bold"
                style={{ color: level.color }}
              >
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                {level.value} — {level.label}
              </span>
            ))}

          <span
            className={`hidden h-5 w-px lg:block ${darkMode ? "bg-white/10" : "bg-black/10"}`}
          />

          <button
            onClick={onOpenRecords}
            className={`flex h-8 items-center gap-1.5 rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            <ClipboardList size={12} />
            Full Records
          </button>
        </div>
      </div>

      <section className={cardClasses} aria-label="Holistic assessment">
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}
            >
              <Sparkles size={13} style={{ color: ACCENT }} />
              This Week's Ratings
            </p>
            <p className={`truncate text-[11px] font-medium ${textMuted}`}>
              · {formatWeekRange(weekStartDate)} · {filtered.length} student
              {filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {locked && (
            <p className={`text-[11px] font-bold ${textMuted}`}>
              Locked — this week is closed for rating
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>
            No students found matching "{search}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-56 px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {HOLISTIC_COLUMNS.map((col) => (
                    <th key={col.key} className="min-w-32 px-3 py-2 text-center">
                      <p className={`text-[11px] font-black ${textPrimary}`}>
                        {col.label}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] font-semibold ${textMuted}`}
                      >
                        {col.description}
                      </p>
                    </th>
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
                    {grouped.male.map((student) => renderStudentRow(student))}
                  </>
                )}

                {grouped.female.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={columnCount} className={groupBand}>
                        Female
                      </td>
                    </tr>
                    {grouped.female.map((student) => renderStudentRow(student))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
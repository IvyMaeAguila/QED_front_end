import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText, SkeletonAvatar } from "@shared/components/SkeletonLoading";
import { skeletonRows, rememberRows, rememberColumns, useColumnReservation } from "@shared/loading/reservations";
import { useMemo, useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { ClipboardList, Search, Sparkles } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { RosterStudent } from "../data";
import {
  HOLISTIC_COLUMNS,
  HOLISTIC_LEVELS,
  type HolisticAxisKey,
  type HolisticMap,
} from "../types/Grading";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };


interface HolisticTabProps {
  loading?: boolean;
  view?: string;
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
  loading = false,
  view = "holistic-working",
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

const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const groupBand = `px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-brand-light"
  } ${textPrimary}`;

  const columnCount = 1 + HOLISTIC_COLUMNS.length;
  const tableRoot = useRef<HTMLDivElement>(null);
  const rowCount = skeletonRows(view, undefined, 44);
  const pendingRoster: GenderedStudent[] = Array.from({ length: rowCount }, (_, index) => ({ id: `pending-${index}`, name: "", gender: index < Math.ceil(rowCount / 2) ? "M" : "F" }));
  const columnLabels = [{ label: "Student", typical: "Student full name" }, ...HOLISTIC_COLUMNS.map(column => ({ label: column.label, typical: column.description }))];
  const columnWidths = useColumnReservation(view, columnLabels, loading);
  function renderStudentRow(student: GenderedStudent, pending = false) {
    return (
      <tr
        key={student.id}
        data-sk-region="holistic-student-row" data-sk-variable=""
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
      >
        <td
          className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-panel-dark" : "bg-white"}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span data-sk-region="student-avatar" className="inline-flex h-7 w-7 shrink-0">{pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={student.gender} name={student.name} />}</span>
            <span className={`truncate text-xs font-bold ${textPrimary}`}>
              {pending ? <SkeletonText className={Number(student.id.split("-").at(-1)) % 2 === 0 ? "w-[14ch]" : "w-[11ch]"} /> : student.name}
            </span>
          </div>
        </td>
        {HOLISTIC_COLUMNS.map((col) => {
          const current = pending ? null : ratings[student.id]?.[col.key] ?? null;
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
                        disabled={locked || pending}
                        aria-disabled={locked || pending}
                        aria-pressed={selected}
                        aria-label={`Rate ${student.name} ${level.label} for ${col.label}`}
                        onClick={() => {
                          onRate(student.id, col.key, level.value);
                          setToast("Weekly holistic records saved.");
                        }}
                        className={`h-7 w-7 rounded-lg text-xs font-black tabular-nums transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                          selected
                            ? "text-white"
                            : darkMode
                              ? "bg-white/10 text-[#9CA3AF] hover:bg-white/15"
                              : "bg-surface text-[#9CA3AF] hover:bg-black/10"
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

  function renderTable(pending: boolean) {
    const visibleRoster = pending ? pendingRoster : filtered;
    const grouped = { male: visibleRoster.filter(student => !isFemale(student)), female: visibleRoster.filter(isFemale) };
    return (!pending && filtered.length === 0 ? (
          <p className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>
            No students found matching "{search}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table data-sk-region="holistic-table" className="teacher-user-table w-full min-w-max text-sm">
              {pending && <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
              <thead>
                <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                  <th
                    className={`sticky left-0 z-10 min-w-56 px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${
                      darkMode ? "bg-panel-dark" : "bg-brand-light"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {HOLISTIC_COLUMNS.map((col) => (
                    <th key={col.key} className="min-w-32 px-3 py-2 text-center">
                      <p className={`text-xs font-black ${textPrimary}`}>
                        {col.label}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-semibold ${textMuted}`}
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
                    {grouped.male.map((student) => renderStudentRow(student, pending))}
                  </>
                )}

                {grouped.female.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={columnCount} className={groupBand}>
                        Female
                      </td>
                    </tr>
                    {grouped.female.map((student) => renderStudentRow(student, pending))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ));
  }

  return (
    <div className="w-full space-y-4">
      {/* Search + rating legend + Full Records */}
      <div
        className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}
      >
        <div className="relative w-full lg:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            aria-label="Search student by name"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {HOLISTIC_LEVELS.slice()
            .reverse()
            .map((level) => (
              <span
                key={level.value}
                className="flex items-center gap-1 text-xs font-bold"
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
            disabled={loading} onClick={onOpenRecords}
            className={`flex h-8 items-center gap-1.5 rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light ${
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
              <Sparkles size={13} style={{ color: "var(--brand-ink)" }} />
              This Week's Ratings
            </p>
            <p className={`truncate text-xs font-medium ${textMuted}`}>
              <LoadingRegion as="span" loading={loading} name="holistic-metadata" skeleton={<SkeletonText className="w-[24ch]" />}>{<>· {formatWeekRange(weekStartDate)} · {filtered.length} student{filtered.length === 1 ? "" : "s"}</>}</LoadingRegion>
            </p>
          </div>

          {locked && (
            <p className={`text-xs font-bold ${textMuted}`}>
              Locked — this week is closed for rating
            </p>
          )}
        </div>

        <div ref={tableRoot}><LoadingRegion loading={loading} variable autoColumns name="holistic-roster" retainPrevious hasContent={filtered.length > 0} skeleton={null} frame={renderTable} onSettled={() => { rememberRows(view, filtered.length); rememberColumns(view, tableRoot.current?.querySelector("table") ?? null); }}>{null}</LoadingRegion></div>
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

import { useMemo, useState, type CSSProperties } from "react";
import { CheckCheck, Search, Trash2, User } from "lucide-react";
import type { RosterStudent } from "../data";
import { ATTENDANCE_CYCLE, ATTENDANCE_META, formatDisplayDate, todayISO, type AttendanceMap } from "../types/Grading";

const ACCENT = "#6B0000";

interface AttendanceTabProps {
  roster: RosterStudent[];
  attendance: AttendanceMap;
  onChange: (studentId: string, dateISO: string, status: AttendanceMap[string][string]) => void;
  onOpenRecords: () => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function AttendanceTab({
  roster,
  attendance,
  onChange,
  onOpenRecords,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: AttendanceTabProps) {
  const [search, setSearch] = useState("");
  const date = todayISO();

  const filtered = useMemo(
    () => roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [roster, search]
  );

  function cycle(studentId: string) {
    const current = attendance[studentId]?.[date] ?? null;
    const idx = ATTENDANCE_CYCLE.indexOf(current);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];
    onChange(studentId, date, next);
  }

  function clearColumn() {
    roster.forEach((s) => onChange(s.id, date, null));
  }

  function markAllPresent() {
    roster.forEach((s) => onChange(s.id, date, "P"));
  }

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            {(Object.keys(ATTENDANCE_META) as (keyof typeof ATTENDANCE_META)[]).map((key) => {
              const meta = ATTENDANCE_META[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {key}
                  </span>
                  <span className={`text-sm font-semibold ${textMuted}`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
          <p className={`mt-2 text-xs font-medium ${textMuted}`}>Click cells to cycle</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={markAllPresent}
            className={`inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-colors ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <CheckCheck size={14} />
            Mark All Present
          </button>
          <button
            onClick={onOpenRecords}
            className="h-11 shrink-0 rounded-xl px-6 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Records
          </button>
        </div>
      </div>

      <section className={cardClasses} aria-label="Attendance">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}>
              <User size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Attendance</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {formatDisplayDate(date)} · {filtered.length} student{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student"
                className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none transition focus:ring-2 sm:w-44 ${panelBg} ${panelBorder} ${textPrimary}`}
                style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
              />
            </div>

            <button
              onClick={clearColumn}
              title="Clear today's attendance"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try a different search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-60 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  <th className={`min-w-28 px-3 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => {
                  const status = attendance[student.id]?.[date] ?? null;
                  const meta = status ? ATTENDANCE_META[status] : null;
                  return (
                    <tr
                      key={student.id}
                      className={`border-t transition-colors ${panelBorder} ${
                        index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""
                      } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                    >
                      <td className={`sticky left-0 z-10 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                            <User size={16} style={{ color: ACCENT }} />
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate font-extrabold ${textPrimary}`}>{student.name}</p>
                            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Student ID: {student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => cycle(student.id)}
                          className="inline-flex min-w-11 justify-center rounded-lg px-2.5 py-1.5 text-xs font-black tabular-nums transition-transform hover:scale-105"
                          style={
                            meta
                              ? { backgroundColor: darkMode ? `${meta.color}25` : meta.bg, color: meta.color }
                              : { backgroundColor: darkMode ? "#ffffff10" : "#F3F4F6", color: "#6B7280" }
                          }
                        >
                          {status ?? "—"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ListChecks,
  ClipboardList,
  Loader2,
  User,
  Search,
  CheckCheck,
} from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  ATTENDANCE_CYCLE,
  ATTENDANCE_META,
  todayISO,
  type AttendanceMap,
} from "../subjects/detail/types/Grading";
import {
  fetchAdvisoryAttendance,
  saveAdvisoryAttendance,
  type AdvisorySection,
} from "./services/attendance.service.ts";
import { useSelectedAdvisorySection } from "./services/useSelectedAdvisorySection.service";
import { AdvisorySectionTabs } from "./components/AdvisorySectionTabs.tsx";

const ACCENT = "#6B0000";
const PRESENT = "P" as keyof typeof ATTENDANCE_META;

type RosterEntry = AdvisorySection["roster"][number];

export function TeacherAttendancePage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const {
    sections,
    section,
    error: sectionError,
    selectSection,
  } = useSelectedAdvisorySection();

  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const iso = todayISO();

  // Loads/reloads attendance whenever the selected class changes (including
  // when the teacher switches tabs between two advisory sections).
  useEffect(() => {
    if (!section) {
      setAttendanceLoading(false);
      return;
    }

    let cancelled = false;
    setAttendanceLoading(true);
    setAttendanceError(null);

    fetchAdvisoryAttendance(section.classId)
      .then((att) => {
        if (cancelled) return;
        setAttendance(att.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load advisory attendance:", err);
        setAttendanceError(
          "Couldn't load attendance for this class. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [section?.classId]);

  function cycle(studentId: string) {
    if (!section) return;
    const current = attendance[studentId]?.[iso] ?? null;
    const idx = ATTENDANCE_CYCLE.indexOf(current);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];

    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [iso]: next },
    }));

    saveAdvisoryAttendance(section.classId, studentId, iso, next).catch(
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
    if (!section) return;
    const targets = filteredRoster.length > 0 ? filteredRoster : section.roster;

    for (const student of targets) {
      const current = attendance[student.id]?.[iso] ?? null;
      if (current === PRESENT) continue;

      setAttendance((prev) => ({
        ...prev,
        [student.id]: { ...prev[student.id], [iso]: PRESENT },
      }));

      saveAdvisoryAttendance(section.classId, student.id, iso, PRESENT).catch(
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

  const groupedRoster = useMemo(() => {
    const female = filteredRoster.filter((s) => isFemale(s));
    const male = filteredRoster.filter((s) => !isFemale(s));
    return { male, female };
  }, [filteredRoster]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
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
  function renderStudentRow(student: RosterEntry, index: number) {
    const status = attendance[student.id]?.[iso] ?? null;
    const meta = status ? ATTENDANCE_META[status] : null;
    return (
      <tr
        key={student.id}
        className={`border-t transition-colors ${
          darkMode
            ? "border-white/10 hover:bg-white/5"
            : "border-black/10 hover:bg-black/5"
        }`}
      >
        <td
          className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold tabular-nums ${textMuted}`}
        >
          {index + 1}
        </td>
        <td className="px-4 py-2">
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
        <td className="whitespace-nowrap px-4 py-2 text-center">
          <button
            onClick={() => cycle(student.id)}
            className="inline-flex h-7 min-w-13 items-center justify-center rounded-lg px-2.5 text-[11px] font-black tabular-nums transition-transform hover:scale-105"
            style={
              meta
                ? {
                    backgroundColor: darkMode ? `${meta.color}25` : meta.bg,
                    color: meta.color,
                  }
                : {
                    backgroundColor: darkMode ? "#ffffff10" : "#F3F4F6",
                    color: "#9CA3AF",
                  }
            }
          >
            {status ?? "Mark"}
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
          colSpan={3}
          className={`px-4 py-1.5 text-left text-[11px] font-black uppercase tracking-wider ${
            darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
          } ${textPrimary}`}
        >
          {label}
        </th>
      </tr>
    );
  }

  // sections === undefined -> still loading which classes the teacher has
  if (sections === undefined) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full px-6 lg:px-8 pt-6">
          <div
            className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}
          >
            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
            <p className={`text-xs font-semibold ${textMuted}`}>
              Loading your advisory class...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sectionError) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full px-6 lg:px-8 pt-6">
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className="text-xs font-semibold text-red-500">{sectionError}</p>
          </div>
        </div>
      </div>
    );
  }

  // sections === null -> confirmed zero advisory classes
  if (!section) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full px-6 lg:px-8 pt-6">
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className={`text-sm font-bold ${textPrimary}`}>
              No advisory class assigned
            </p>
            <p className={`mt-1 text-xs ${textMuted}`}>
              You're not currently set as the adviser for a section, so there's
              nothing to take attendance for.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <ListChecks size={28} />
            </span>
            <div>
              <h1
                className={`text-lg font-black tracking-tight ${textPrimary}`}
              >
                Attendance — {displaySectionName}
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {todayLabel} · {markedCount}/{section.roster.length} marked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdvisorySectionTabs
              sections={sections ?? []}
              activeClassId={section.classId}
              onSelect={selectSection}
              darkMode={darkMode}
              panelBorder={panelBorder}
              textMuted={textMuted}
            />
            <button
              onClick={() =>
                navigate(
                  `/teacher/attendance/records?classId=${section.classId}`,
                )
              }
              className={`flex h-8 items-center gap-1.5 rounded-lg border bg-[#800000] text-white px-3 text-[11px] font-extrabold transition-colors hover:bg-[#650000] ${
                darkMode ? "border-white/10" : "border-black/10"
              }`}
            >
              <ClipboardList size={12} />
              Full Records
            </button>
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
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
              className={`relative w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
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
                  className="flex items-center gap-1 text-[11px] font-bold"
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

        <section className={cardClasses} aria-label="Today's attendance roster">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <p
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}
              >
                <User size={13} style={{ color: ACCENT }} />
                Today's Roster
              </p>
              <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                · {filteredRoster.length} student
                {filteredRoster.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={markAllPresent}
              disabled={allMarkedPresent}
              className={`flex h-7 w-36 items-center justify-center gap-1 rounded-md border px-2.5 text-[11px] font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
              }`}
            >
              <CheckCheck size={12} style={{ color: ACCENT }} />
              Mark All Present
            </button>
          </div>

          {attendanceLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14">
              <Loader2 size={15} className={`animate-spin ${textMuted}`} />
              <p className={`text-xs font-semibold ${textMuted}`}>
                Loading attendance...
              </p>
            </div>
          ) : attendanceError ? (
            <p className="px-4 py-5 text-center text-xs font-semibold text-red-500">
              {attendanceError}
            </p>
          ) : filteredRoster.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                    {[
                      { label: "No.", cls: "w-16 text-left" },
                      { label: "Student", cls: "text-left" },
                      { label: "Status", cls: "w-44 text-center" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`whitespace-nowrap px-4 py-2 text-[11px] font-black uppercase tracking-wider ${h.cls} ${textMuted}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedRoster.male.length > 0 && (
                    <>
                      {renderGroupHeader("Male")}
                      {groupedRoster.male.map((student, i) =>
                        renderStudentRow(student, i),
                      )}
                    </>
                  )}
                  {groupedRoster.female.length > 0 && (
                    <>
                      {renderGroupHeader("Female")}
                      {groupedRoster.female.map((student, i) =>
                        renderStudentRow(student, i),
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}
            >
              No students found matching "{searchQuery}".
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

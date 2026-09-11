import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ListChecks, ClipboardList, Loader2, User, Search, CheckCheck } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { SectionCard } from "../../../shared/components/DashboardUI";
import {
  ATTENDANCE_CYCLE,
  ATTENDANCE_META,
  todayISO,
  type AttendanceMap,
} from "../subjects/detail/types/Grading";
import {
  fetchAdvisorySection,
  fetchAdvisoryAttendance,
  saveAdvisoryAttendance,
  type AdvisorySection,
} from "./services/attendance.service.ts";

const ACCENT = "#6B0000";
const PRESENT = "P" as keyof typeof ATTENDANCE_META;

type RosterEntry = AdvisorySection["roster"][number];

export function TeacherAttendancePage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [section, setSection] = useState<AdvisorySection | null | undefined>(
    undefined,
  );
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const iso = todayISO();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAdvisorySection()
      .then(async (sec) => {
        if (cancelled) return;
        setSection(sec);
        if (!sec) return;
        const att = await fetchAdvisoryAttendance(sec.sectionId);
        if (cancelled) return;
        setAttendance(att.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load advisory attendance:", err);
        setError("Couldn't load your advisory class. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function cycle(studentId: string) {
    if (!section) return;
    const current = attendance[studentId]?.[iso] ?? null;
    const idx = ATTENDANCE_CYCLE.indexOf(current);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];

    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [iso]: next },
    }));

    saveAdvisoryAttendance(section.sectionId, studentId, iso, next).catch(
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

      saveAdvisoryAttendance(section.sectionId, student.id, iso, PRESENT).catch(
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
    const g = String(student.gender ?? "").trim().toUpperCase();
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


  function renderStudentRow(student: RosterEntry) {
    const status = attendance[student.id]?.[iso] ?? null;
    const meta = status ? ATTENDANCE_META[status] : null;
    return (
      <li
        key={student.id}
        className="flex items-center justify-between gap-3 px-4 py-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
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

        <button
          onClick={() => cycle(student.id)}
          className="inline-flex h-7 min-w-13 shrink-0 items-center justify-center rounded-lg px-2.5 text-[11px] font-black tabular-nums transition-transform hover:scale-105"
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
      </li>
    );
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full px-6 lg:px-8 pt-6">
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className="text-xs font-semibold text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
                Attendance — {section.sectionName}
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {todayLabel} · {markedCount}/{section.roster.length} marked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/teacher/attendance/records")}
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
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className={`w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
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

        <SectionCard
          title="Today's Roster"
          icon={User}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          darkMode={darkMode}
          action={
            <button
              onClick={markAllPresent}
              disabled={allMarkedPresent}
              className={`flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
              }`}
            >
              <CheckCheck size={12} style={{ color: ACCENT }} />
              Mark All Present
            </button>
          }
        >
          {filteredRoster.length > 0 ? (
            <>
              {groupedRoster.male.length > 0 && (
                <>
                  <p
                    className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                      darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                    } ${textPrimary}`}
                  >
                    Male
                  </p>
                  <ul
                    className={`divide-y ${
                      darkMode ? "divide-white/10" : "divide-black/10"
                    }`}
                  >
                    {groupedRoster.male.map((student) => renderStudentRow(student))}
                  </ul>
                </>
              )}

              {groupedRoster.female.length > 0 && (
                <>
                  <p
                    className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                      darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                    } ${textPrimary}`}
                  >
                    Female
                  </p>
                  <ul
                    className={`divide-y ${
                      darkMode ? "divide-white/10" : "divide-black/10"
                    }`}
                  >
                    {groupedRoster.female.map((student) => renderStudentRow(student))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>
              No students found matching "{searchQuery}".
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
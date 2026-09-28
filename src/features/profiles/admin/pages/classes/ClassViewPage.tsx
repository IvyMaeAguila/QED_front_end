import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Mail, Phone, UserRound, School } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext"; // adjust to your real hook name
import { useStudents } from "../studentrecords/context/StudentsContext";
import { DAYS_OF_WEEK, type DayOfWeek, formatTimeRange } from "./types/Class";
import { formatFullName } from "../studentrecords/types/Students";
import type { AdminThemeContext } from "../AdminLayout";
import { getTeacherAvatar } from "../../../../../shared/profile/utils/teacherAvatar";

// Same accent as UserViewPage
const ACCENT = "#8B0D0D";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface RosterStudent {
  id: string;
  studentId: string;
  gender?: string;
  [key: string]: unknown;
}

function StudentTable({
  label,
  roster,
  panelBorder,
  headerBg,
  darkMode,
  textPrimary,
  textMuted,
  onSelect,
}: {
  label: string;
  roster: RosterStudent[];
  panelBorder: string;
  headerBg: string;
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${textMuted}`}>
        {label} ({roster.length})
      </p>
      {roster.length === 0 ? (
        <div className={`rounded-xl border px-4 py-6 text-center ${panelBorder}`}>
          <p className={`text-xs font-semibold ${textMuted}`}>None assigned.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-xl border ${panelBorder}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: headerBg }}>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] text-white/90">
                  Student ID
                </th>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] text-white/90">
                  Name
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`cursor-pointer transition-colors ${
                    i > 0 ? `border-t ${panelBorder}` : ""
                  } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#F6F7FB]"}`}
                >
                  <td className={`px-4 py-2.5 font-bold tabular-nums ${textMuted}`}>
                    {s.studentId}
                  </td>
                  <td className={`px-4 py-2.5 font-semibold ${textPrimary}`}>
                    {formatFullName(s as never)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ClassViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass } = useClasses();
  const { teachers } = useTeachers(); // hooks must stay above any early return
  const { students } = useStudents();

  const schoolClass = classId ? getClass(classId) : undefined;

  // Same card/header/title classes as UserViewPage
  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  if (!schoolClass) {
    return (
      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 pb-12">
        <section
          className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`}>
            No class found with ID <span className="font-bold">{classId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/classes")}
            className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            <ArrowLeft size={14} />
            Back to Classes
          </button>
        </section>
      </div>
    );
  }

  const hasAdviser =
    schoolClass.adviserName && schoolClass.adviserName !== "Unassigned";
  const initials = hasAdviser
    ? schoolClass.adviserName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "?";

  // Look up the adviser's teacher record to get their real avatar + gender.
  const adviser = hasAdviser
    ? teachers.find((t) => String(t.id) === String(schoolClass.adviserId))
    : undefined;
  const adviserAvatarSrc = getTeacherAvatar(adviser);

  const roster = students.filter(
    (s) =>
      s.gradeLevel === schoolClass.gradeLevel &&
      s.section === schoolClass.section,
  );
  const maleRoster = roster.filter(
    (s) => (s as unknown as RosterStudent).gender?.toLowerCase() === "male",
  );
  const femaleRoster = roster.filter(
    (s) => (s as unknown as RosterStudent).gender?.toLowerCase() === "female",
  );

  // Build timetable rows: one row per distinct time range, sorted chronologically,
  // with a cell per weekday showing the subject scheduled at that time (if any).
  const timeSlots = Array.from(
    new Map(
      schoolClass.schedule.map((p) => [
        `${p.startTime}-${p.endTime}`,
        { startTime: p.startTime, endTime: p.endTime },
      ]),
    ).values(),
  ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const cellFor = (day: DayOfWeek, startTime: string, endTime: string) =>
    schoolClass.schedule.find(
      (p) =>
        p.startTime === startTime &&
        p.endTime === endTime &&
        p.days.includes(day),
    );

  // Maroon table headers (schedule header row, Time column, student table headers)
  const rowHeaderBg = darkMode ? "rgba(139,13,13,0.35)" : "#8B0D0D";
  const headerBg = darkMode ? "#6B0000" : "#8B0D0D";

  return (
    <div className="max-w-7xl mx-auto mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/classes")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h2 className={sectionTitleClasses}>
                <School size={15} style={{ color: ACCENT }} />
                {schoolClass.section
                  ? `${schoolClass.gradeLevel} - ${schoolClass.section}`
                  : schoolClass.gradeLevel}
              </h2>
              <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>
                {roster.length} students enrolled
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/classes/${schoolClass.id}/edit`)}
            className="h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000] shrink-0"
            style={{ background: ACCENT }}
          >
            <Pencil size={14} />
            Edit Class
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            className={`rounded-2xl border p-5 flex items-center gap-4 ${panelBorder}`}
            style={{
              background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(85,0,0,0.025)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden"
              style={{
                background: adviserAvatarSrc
                  ? undefined
                  : "linear-gradient(135deg, #1D70D6 0%, #1550A0 100%)",
                boxShadow: "0 4px 10px -2px rgba(29,112,214,0.45)",
                border: `2px solid ${darkMode ? "rgba(255,255,255,0.15)" : "#FFFFFF"}`,
              }}
            >
              {adviserAvatarSrc ? (
                <img
                  src={adviserAvatarSrc}
                  alt={`${schoolClass.adviserName}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : hasAdviser ? (
                initials
              ) : (
                <UserRound size={20} className="text-white/80" aria-label="No adviser assigned" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}
              >
                Class Adviser
              </p>
              <p className={`text-base font-extrabold leading-snug ${textPrimary}`}>
                {schoolClass.adviserName || "Unassigned"}
              </p>
              {hasAdviser &&
                (schoolClass.adviserEmail || schoolClass.adviserContact) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {schoolClass.adviserEmail && (
                      <a
                        href={`mailto:${schoolClass.adviserEmail}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${panelBorder} ${textMuted} ${
                          darkMode ? "hover:bg-white/5" : "hover:bg-white"
                        }`}
                      >
                        <Mail size={12} /> {schoolClass.adviserEmail}
                      </a>
                    )}
                    {schoolClass.adviserContact && (
                      <a
                        href={`tel:${schoolClass.adviserContact}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${panelBorder} ${textMuted} ${
                          darkMode ? "hover:bg-white/5" : "hover:bg-white"
                        }`}
                      >
                        <Phone size={12} /> {schoolClass.adviserContact}
                      </a>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Class Schedule — rendered as an actual weekly timetable grid */}
          <div>
            <h4 className={`text-sm font-extrabold mb-3 ${textPrimary}`}>
              Class Schedule
            </h4>
            {timeSlots.length === 0 ? (
              <p className={`text-xs font-semibold ${textMuted}`}>
                No schedule set yet.
              </p>
            ) : (
              <div className={`overflow-x-auto rounded-xl border ${panelBorder}`}>
                <table className="w-full border-collapse text-xs min-w-160">
                  <thead>
                    <tr style={{ background: headerBg }}>
                      <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap text-white/90">
                        Time
                      </th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day}
                          className="px-3 py-2.5 text-center font-bold uppercase tracking-wide text-white/90 border-l border-white/10"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot, i) => (
                      <tr
                        key={`${slot.startTime}-${slot.endTime}`}
                        className={i > 0 ? `border-t ${panelBorder}` : undefined}
                      >
                        <td
                          className="px-3 py-3 font-bold whitespace-nowrap align-top text-white"
                          style={{ background: rowHeaderBg }}
                        >
                          {formatTimeRange(slot.startTime, slot.endTime)}
                        </td>
                        {DAYS_OF_WEEK.map((day) => {
                          const period = cellFor(day, slot.startTime, slot.endTime);
                          return (
                            <td
                              key={day}
                              className={`px-3 py-3 text-center align-top border-l ${panelBorder}`}
                            >
                              {period ? (
                                <div>
                                  <p className={`font-bold ${textPrimary}`}>
                                    {period.subject}
                                  </p>
                                  <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>
                                    {period.teacherName || "Unassigned"}
                                  </p>
                                </div>
                              ) : (
                                <span className={textMuted}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Students — split into two tables, one per gender */}
          <div>
            <h4 className={`text-sm font-extrabold mb-3 ${textPrimary}`}>
              Students
            </h4>
            {roster.length === 0 ? (
              <p className={`text-xs font-semibold ${textMuted}`}>
                No students assigned to this section yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <StudentTable
                  label="Male"
                  roster={maleRoster as unknown as RosterStudent[]}
                  panelBorder={panelBorder}
                  headerBg={headerBg}
                  darkMode={darkMode}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  onSelect={(id) => navigate(`/admin/students/${id}`)}
                />
                <StudentTable
                  label="Female"
                  roster={femaleRoster as unknown as RosterStudent[]}
                  panelBorder={panelBorder}
                  headerBg={headerBg}
                  darkMode={darkMode}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  onSelect={(id) => navigate(`/admin/students/${id}`)}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
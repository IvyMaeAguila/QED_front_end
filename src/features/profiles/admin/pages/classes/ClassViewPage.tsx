import { useState } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Phone, Mail, UserRound } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { DAYS_OF_WEEK, type DayOfWeek, formatTimeRange } from "./types/Class";
import { formatFullName } from "../studentrecords/types/Students";
import type { AdminThemeContext } from "../AdminLayout";
import { getTeacherAvatar, getTeacherAvatarBorderColor } from "../../../../../shared/profile/utils/teacherAvatar";
import { BackButton } from "../../../shared/components/DashboardUI";
import { ProfileOverviewCard } from "../../../../../shared/components/ProfileOverviewCard";
import { StudentDirectory } from "../../../../../shared/components/StudentDirectory";

const ACCENT = "#8B0D0D";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function ClassViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass } = useClasses();
  const { teachers } = useTeachers();
  const { students } = useStudents();
  const [activeTab, setActiveTab] = useState<"schedule" | "class-list">("schedule");
  const schoolClass = classId ? getClass(classId) : undefined;

  if (!schoolClass) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <section className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>No class found with ID <span className="font-bold">{classId}</span>.</p>
          <button onClick={() => navigate("/admin/classes")} className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2" style={{ background: ACCENT }}>
            <ArrowLeft size={14} /> Back to Classes
          </button>
        </section>
      </div>
    );
  }

  const hasAdviser = Boolean(schoolClass.adviserName && schoolClass.adviserName !== "Unassigned");
  const initials = hasAdviser ? schoolClass.adviserName.split(" ").map((n) => n[0]).slice(0, 2).join("") : "?";
  const adviser = hasAdviser ? teachers.find((teacher) => String(teacher.id) === String(schoolClass.adviserId)) : undefined;
  const adviserAvatarSrc = getTeacherAvatar(adviser);
  const adviserAvatarBorderColor = getTeacherAvatarBorderColor(adviser?.gender);
  const roster = students.filter((student) => student.gradeLevel === schoolClass.gradeLevel && student.section === schoolClass.section);
  const totalSubjects = new Set(schoolClass.schedule.map((period) => period.subject.trim()).filter(Boolean)).size;
  const timeSlots = Array.from(
    new Map(schoolClass.schedule.map((period) => [`${period.startTime}-${period.endTime}`, { startTime: period.startTime, endTime: period.endTime }])).values(),
  ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const cellFor = (day: DayOfWeek, startTime: string, endTime: string) => schoolClass.schedule.find((period) => period.startTime === startTime && period.endTime === endTime && period.days.includes(day));
  const rowHeaderBg = darkMode ? "rgba(139,13,13,0.35)" : ACCENT;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12 font-sans">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/admin/classes")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Class Details</h1>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
              {schoolClass.gradeLevel}{schoolClass.section ? ` · Section ${schoolClass.section}` : ""}
            </p>
          </div>
          <button onClick={() => navigate(`/admin/classes/${schoolClass.id}/edit`)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition-colors hover:bg-[#6B0000]" style={{ background: ACCENT }}>
            <Pencil size={14} /> Edit Class
          </button>
        </div>
      </div>

      <ProfileOverviewCard
        label={`${schoolClass.adviserName || "Class adviser"} teacher profile`}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        avatarBorderColor={adviserAvatarBorderColor}
        avatar={adviserAvatarSrc ? <img src={adviserAvatarSrc} alt={`${schoolClass.adviserName} profile`} className="h-full w-full object-cover" /> : initials || <UserRound className="h-9 w-9" />}
        name={schoolClass.adviserName || "Unassigned"}
        subtitle={`Teacher · ${schoolClass.gradeLevel}${schoolClass.section ? ` · ${schoolClass.section}` : ""}`}
        identityDetails={hasAdviser && (schoolClass.adviserEmail || schoolClass.adviserContact) ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {schoolClass.adviserEmail && (
              <a href={`mailto:${schoolClass.adviserEmail}`} className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}>
                <Mail size={12} className="shrink-0" /> <span className="truncate">{schoolClass.adviserEmail}</span>
              </a>
            )}
            {schoolClass.adviserContact && (
              <a href={`tel:${schoolClass.adviserContact}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}>
                <Phone size={12} className="shrink-0" /> {schoolClass.adviserContact}
              </a>
            )}
          </div>
        ) : undefined}
        stats={[
          { label: "Advisory", value: schoolClass.section ? `${schoolClass.gradeLevel} · ${schoolClass.section}` : schoolClass.gradeLevel },
          { label: "Room", value: schoolClass.room || "Not assigned" },
          { label: "Total subjects", value: totalSubjects },
        ]}
        tabs={[
          { id: "schedule", label: "Class schedule" },
          { id: "class-list", label: "Class list", count: roster.length },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "schedule" | "class-list")}
      />

      {activeTab === "schedule" ? (
        <section id="class-schedule-panel" role="tabpanel" aria-label="Class schedule" className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
          <div className={`border-b px-4 py-3 ${panelBorder}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Class schedule</h2>
          </div>
          {timeSlots.length === 0 ? (
            <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No schedule set yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="teacher-user-table w-full min-w-160 border-collapse text-xs">
                <thead>
                  <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                    <th className={`px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>Time</th>
                    {DAYS_OF_WEEK.map((day) => <th key={day} className={`border-l px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-wider ${panelBorder} ${textMuted}`}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={`${slot.startTime}-${slot.endTime}`} className={`border-t ${panelBorder}`}>
                      <td className="whitespace-nowrap px-4 py-3 align-top font-bold text-white" style={{ background: rowHeaderBg }}>{formatTimeRange(slot.startTime, slot.endTime)}</td>
                      {DAYS_OF_WEEK.map((day) => {
                        const period = cellFor(day, slot.startTime, slot.endTime);
                        return <td key={day} className={`border-l px-4 py-3 text-center align-top ${panelBorder}`}>{period ? <><p className={`font-bold ${textPrimary}`}>{period.subject}</p><p className={`mt-0.5 text-[11px] font-semibold ${textMuted}`}>{period.teacherName || "Unassigned"}</p></> : <span className={textMuted}>—</span>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <div id="class-list-panel" role="tabpanel" aria-label="Class list">
          <StudentDirectory
            students={roster.map((student) => ({ id: String(student.id), studentId: student.studentId, name: formatFullName(student), gender: student.gender }))}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
            onActivate={(id) => navigate(`/admin/students/${id}`)}
          />
        </div>
      )}
    </div>
  );
}

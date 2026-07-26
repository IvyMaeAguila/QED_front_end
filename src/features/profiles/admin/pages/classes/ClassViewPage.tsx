import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Mail, Phone, Clock } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { formatTeacherName } from "./types/Teacher";
import { formatTimeRange } from "./types/Class";
import { formatFullName } from "../studentrecords/types/Students";
import type { AdminThemeContext } from "../../AdminLayout";

export function ClassViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass } = useClasses();
  const { getTeacher } = useTeachers();
  const { students } = useStudents();

  const schoolClass = classId ? getClass(classId) : undefined;

  if (!schoolClass) {
    return (
      <section className={`rounded-xl border shadow-sm p-8 text-center ${panelBg} ${panelBorder}`}>
        <p className={`text-sm font-semibold ${textMuted}`}>
          No class found with ID <span className="font-bold">{classId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/classes")}
          className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
          style={{ background: "#8B0D0D" }}
        >
          <ArrowLeft size={14} />
          Back to Classes
        </button>
      </section>
    );
  }

  const adviser = getTeacher(schoolClass.adviserId);
  const roster = students.filter(
    (s) => s.gradeLevel === schoolClass.gradeLevel && s.section === schoolClass.section
  );

  return (
    <section className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
      <div className="bg-[#8B0D0D] px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/classes")}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div>
            <h3 className="text-white font-bold">{schoolClass.gradeLevel} • {schoolClass.section}</h3>
            <p className="text-xs text-white/70 mt-0.5">{roster.length} students enrolled</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/classes/${schoolClass.id}/edit`)}
          className="h-9 px-3 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Pencil size={13} />
          Edit Class
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${panelBorder}`}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: "#1D70D6" }}
          >
            {adviser ? adviser.firstName[0] + adviser.lastName[0] : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${textMuted}`}>Class Adviser</p>
            <p className={`text-sm font-extrabold ${textPrimary}`}>
              {adviser ? formatTeacherName(adviser) : "Unassigned"}
            </p>
            {adviser && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className={`text-xs font-semibold flex items-center gap-1 ${textMuted}`}>
                  <Mail size={12} /> {adviser.email}
                </span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${textMuted}`}>
                  <Phone size={12} /> {adviser.contactNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className={`text-sm font-extrabold mb-3 ${textPrimary}`}>Class Schedule</h4>
          {schoolClass.schedule.length === 0 ? (
            <p className={`text-xs font-semibold ${textMuted}`}>No schedule set yet.</p>
          ) : (
            <div className="space-y-2">
              {schoolClass.schedule.map((period) => {
                const teacher = getTeacher(period.teacherId);
                return (
                  <div
                    key={period.id}
                    className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${panelBorder}`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${textPrimary}`}>{period.subject}</p>
                      <p className={`text-xs font-semibold ${textMuted}`}>
                        {teacher ? formatTeacherName(teacher) : "Unassigned"} • {period.days.join(", ")}
                      </p>
                    </div>
                    <span className={`text-xs font-bold flex items-center gap-1.5 shrink-0 ${textMuted}`}>
                      <Clock size={13} />
                      {formatTimeRange(period.startTime, period.endTime)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className={`text-sm font-extrabold mb-3 ${textPrimary}`}>Students</h4>
          {roster.length === 0 ? (
            <p className={`text-xs font-semibold ${textMuted}`}>No students assigned to this section yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {roster.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                  className={`text-left rounded-xl border px-4 py-2.5 transition-colors ${panelBorder} ${
                    darkMode ? "hover:bg-white/5" : "hover:bg-[#F6F7FB]"
                  }`}
                >
                  <p className={`text-sm font-semibold ${textPrimary}`}>{formatFullName(s)}</p>
                  <p className={`text-[11px] font-bold tabular-nums ${textMuted}`}>{s.id}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
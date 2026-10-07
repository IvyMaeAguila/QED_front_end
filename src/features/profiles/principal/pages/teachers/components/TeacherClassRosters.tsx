import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { Student } from "../../students/data/types";

export interface TeacherClassRoster {
  classId: number;
  sectionLabel: string;
  room: string;
  students: Student[];
}

interface TeacherClassRostersProps {
  rosters: TeacherClassRoster[];
  loading: boolean;
  error: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

function studentName(student: Student) {
  return [student.firstName, student.middleInitial, student.lastName]
    .filter(Boolean)
    .join(" ");
}

export function TeacherClassRosters({
  rosters,
  loading,
  error,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TeacherClassRostersProps) {
  return (
    <div className="flex flex-col gap-3" aria-label="Student lists by section">
      {loading ? (
        <div className={`rounded-xl border px-4 py-5 text-sm ${panelBg} ${panelBorder} ${textMuted}`}>Loading section rosters…</div>
      ) : rosters.length === 0 ? (
        <div className={`rounded-xl border px-4 py-5 text-sm ${panelBg} ${panelBorder} ${textMuted}`}>
          {error
            ? "The class lists could not be loaded. Please try again."
            : "No class lists are available for this teacher yet."}
        </div>
      ) : (
        <>
        {error && <p className={`px-1 text-xs ${textMuted}`}>Some class lists could not be loaded; the available sections are shown below.</p>}
        <div className="grid gap-3">
          {rosters.map((roster) => {
            const maleStudents = roster.students.filter((student) => student.gender === "Male");
            const femaleStudents = roster.students.filter((student) => student.gender === "Female");

            return (
              <section key={roster.classId} className={`overflow-hidden rounded-lg border ${panelBorder} ${panelBg}`}>
                <header className={`flex items-center justify-between gap-3 border-b px-3 py-2.5 ${panelBorder}`}>
                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-bold ${textPrimary}`}>{roster.sectionLabel}</h3>
                    <p className={`mt-0.5 text-xs ${textMuted}`}>{roster.room || "Room not assigned"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textMuted}`}>
                    {roster.students.length} students
                  </span>
                </header>
                <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/10">
                  {[
                    { label: "Male", students: maleStudents },
                    { label: "Female", students: femaleStudents },
                  ].map((group) => (
                    <div key={group.label} className="min-w-0">
                      <p className={`border-b px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${panelBorder} ${textMuted}`}>
                        {group.label} <span className="font-semibold">({group.students.length})</span>
                      </p>
                      {group.students.length === 0 ? (
                        <p className={`px-4 py-3 text-xs ${textMuted}`}>No students</p>
                      ) : (
                        <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                          {group.students.map((student) => {
                            const name = studentName(student);
                            return (
                              <li key={student.studentId} className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                                <StudentAvatar gender={student.gender} name={name} className="h-6 w-6" />
                                <span className={`truncate text-xs font-medium ${textPrimary}`}>{name}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

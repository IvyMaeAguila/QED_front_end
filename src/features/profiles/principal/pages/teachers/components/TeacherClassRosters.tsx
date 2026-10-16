import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonAvatar, SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
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
  retry?: () => void;
  view?: string;
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
  retry,
  view = "teacher-rosters",
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TeacherClassRostersProps) {
  const renderRosters = (pending: boolean) => {
    const rows: TeacherClassRoster[] = pending ? Array.from({ length: Math.min(2, skeletonRows(view)) }, (_, index) => ({ classId: index, sectionLabel: "", room: "", students: Array.from({ length: skeletonRows(`${view}:students:${index}`) }, (_, student) => ({ studentId: String(student), firstName: "", middleInitial: "", lastName: "", gender: student % 2 ? "Female" : "Male" })) })) : rosters;
    return (
    <div className="flex flex-col gap-3" aria-label="Student lists by section" data-sk-region="teacherclassrosters-div-field-1">
      {rows.length === 0 ? (
        <div className={`rounded-xl border px-4 py-5 text-sm ${panelBg} ${panelBorder} ${textMuted}`}>
          {error
            ? "The class lists could not be loaded. Please try again."
            : "No class lists are available for this teacher yet."}
        </div>
      ) : (
        <>
        {!pending && error && <p className={`px-1 text-xs ${textMuted}`} data-sk-region="teacherclassrosters-some-class-lists-could-not-be-loaded-the-avai" data-sk-static="">Some class lists could not be loaded; the available sections are shown below.</p>}
        <div className="grid gap-3" data-sk-region="teacherclassrosters-div-field-2">
          {rows.map((roster) => {
            const maleStudents = roster.students.filter((student) => student.gender === "Male");
            const femaleStudents = roster.students.filter((student) => student.gender === "Female");

                return (
              <section data-sk-item key={roster.classId} className={`overflow-hidden rounded-lg border ${panelBorder} ${panelBg}`}>
                <header className={`flex items-center justify-between gap-3 border-b px-3 py-2.5 ${panelBorder}`}>
                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-bold ${textPrimary}`} data-sk-region="teacherclassrosters-h3-field-3">{pending ? <SkeletonText width="16ch" /> : roster.sectionLabel}</h3>
                    <p className={`mt-0.5 text-xs ${textMuted}`} data-sk-region="teacherclassrosters-p-field-4">{pending ? <><SkeletonText width="12ch" /><SkeletonText width="8ch" /></> : roster.room || "Room not assigned"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${darkMode ? "bg-white/10" : "bg-brand-light"} ${textMuted}`} data-sk-region="teacherclassrosters-span-field-5">
                    {pending ? <SkeletonText width="10ch" /> : <>{roster.students.length} students</>}
                  </span>
                </header>
                <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/10" data-sk-region="teacherclassrosters-div-field-6">
                  {[
                    { label: "Male", students: maleStudents },
                    { label: "Female", students: femaleStudents },
                  ].map((group) => (
                    <div key={group.label} className="min-w-0" data-sk-region="teacherclassrosters-div-field-7">
                      <p className={`border-b px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${panelBorder} ${textMuted}`}>
                        {group.label} <span className="font-semibold" data-sk-region="teacherclassrosters-span-field-8">({pending ? <SkeletonText className="inline-block align-middle" width="1ch" /> : group.students.length})</span>
                      </p>
                      {group.students.length === 0 ? (
                        <p className={`px-4 py-3 text-xs ${textMuted}`} data-sk-region="teacherclassrosters-no-students" data-sk-static="">No students</p>
                      ) : (
                        <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.08]" data-sk-region="teacherclassrosters-ul-field-9">
                          {group.students.map((student) => {
                            const name = studentName(student);
                                return (
                              <li key={student.studentId} className="flex min-w-0 items-center gap-2.5 px-4 py-2" data-sk-region="teacherclassrosters-li-field-10">
                                {pending ? <SkeletonAvatar width="24px" style={{ height: "24px" }} /> : <StudentAvatar gender={student.gender} name={name} className="h-6 w-6" />}
                                <span className={`truncate text-xs font-medium ${textPrimary}`} data-sk-region="teacherclassrosters-span-field-11">{pending ? <SkeletonText width="16ch" /> : name}</span>
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
  };
  return <LoadingRegion name={`${view}:rows`} loading={loading} variable frame={renderRosters} retainPrevious hasContent={rosters.length > 0} error={error && !rosters.length ? "The class lists could not be loaded." : undefined} retry={retry} skeleton={renderRosters(true)} onSettled={() => { rememberRows(view, rosters.length); rosters.forEach((roster, index) => rememberRows(`${view}:students:${index}`, roster.students.length)); }}>{renderRosters(false)}</LoadingRegion>;
}



import { Fragment } from "react";
import { Clock } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { Student } from "../data/types";
import { computeAverage, fullName } from "../utils/gradeSheetUtils";

interface StudentGroupTableProps {
  groups: { label: string; students: Student[] }[];
  subjects: string[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function StudentGroupTable({
  groups,
  subjects,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: StudentGroupTableProps) {
  const columnCount = subjects.length + 2;
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;

  return (
    <div className="overflow-x-auto">
      <table className="teacher-user-table w-full min-w-max text-sm">
        <thead>
          <tr className={`border-b ${panelBorder}`}>
            <th className={`sticky left-0 z-10 min-w-56 py-2 pr-4 text-left font-black uppercase tracking-wider ${panelBg} ${textMuted}`}>
              Student
            </th>
            {subjects.map((subject) => (
              <th key={subject} className={`min-w-28 whitespace-nowrap px-3 py-2 text-center font-black uppercase tracking-wider ${textMuted}`}>
                <span>{subject}</span>
                <span className="block text-[10px] font-medium tracking-normal">Term Grade</span>
              </th>
            ))}
            <th className={`min-w-28 py-2 pl-3 text-center font-black uppercase tracking-wider ${textMuted}`}>
              Overall Average
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.label}>
              <tr>
                <td colSpan={columnCount} className={groupBand}>
                  {group.label} · {group.students.length} students
                </td>
              </tr>
              {group.students.map((student) => {
                const average = student.overallAverage ?? computeAverage(student.grades, subjects);
                return (
                  <tr key={student.studentId} className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StudentAvatar gender={student.gender} name={fullName(student)} />
                        <span className={`truncate text-xs font-bold ${textPrimary}`}>
                          {fullName(student)}
                        </span>
                      </div>
                    </td>
                    {subjects.map((subject) => {
                      const status = student.gradeStatuses[subject] ?? (student.grades[subject] === undefined ? "not_submitted" : "submitted");
                      return (
                        <td key={subject} className="px-3 py-2 text-center">
                          {status === "submitted" ? (
                            <span className={`text-[13px] font-black tabular-nums ${student.grades[subject] == null ? "text-gray-400" : "text-[#800000]"}`}>
                              {student.grades[subject] ?? "—"}
                            </span>
                          ) : status === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#B45309]">
                              <Clock size={10} aria-hidden="true" /> Pending
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>
                              {student.ownAdvisorySubjects[subject] ? "No Grades Yet" : "Not Submitted"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[13px] font-black tabular-nums ${student.overallAverage == null ? "text-gray-400" : "text-[#800000]"}`}>
                        {student.overallAverage ?? (average > 0 ? average : "—")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
          {groups.length === 0 && (
            <tr>
              <td colSpan={columnCount} className={`py-8 text-center text-xs font-medium ${textMuted}`}>
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

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
  const groupBand = `qed-type-table-group px-4 py-1.5 uppercase ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;

  return (
    <div className="overflow-x-auto">
      <table className="teacher-user-table w-full min-w-max text-sm">
        <thead>
          <tr className={`border-b ${panelBorder}`}>
            <th className={`qed-type-table-header sticky left-0 z-10 min-w-56 py-2 pr-4 text-left uppercase tracking-wider ${panelBg} ${textMuted}`}>
              Student
            </th>
            {subjects.map((subject) => (
              <th key={subject} className={`qed-type-table-header min-w-28 whitespace-nowrap px-3 py-2 text-center uppercase tracking-wider ${textMuted}`}>
                <span>{subject}</span>
              </th>
            ))}
            <th className={`qed-type-table-header min-w-28 py-2 pl-3 text-center uppercase tracking-wider ${textMuted}`}>
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
                const displayAverage = student.overallAverage ?? (average > 0 ? average : null);
                return (
                  <tr key={student.studentId} className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StudentAvatar gender={student.gender} name={fullName(student)} />
                        <span className={`qed-type-table-body truncate ${textPrimary}`}>
                          {fullName(student)}
                        </span>
                      </div>
                    </td>
                    {subjects.map((subject) => {
                      const status = student.gradeStatuses[subject] ?? (student.grades[subject] === undefined ? "not_submitted" : "submitted");
                      const grade = student.grades[subject];
                      return (
                        <td key={subject} className="px-3 py-2 text-center">
                          {status === "submitted" ? (
                            grade == null ? (
                              <span className="qed-type-table-empty-value">—</span>
                            ) : (
                              <span className="qed-type-table-grade text-[#800000]">{grade}</span>
                            )
                          ) : status === "pending" ? (
                            <span className="qed-type-badge inline-flex items-center gap-1 uppercase tracking-wide text-[#B45309]">
                              <Clock size={10} aria-hidden="true" /> Pending
                            </span>
                          ) : (
                            student.ownAdvisorySubjects[subject] ? (
                              <span className="qed-type-table-empty-value">No grades yet</span>
                            ) : (
                              <span className={`qed-type-badge uppercase tracking-wide ${textMuted}`}>Not Submitted</span>
                            )
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      {displayAverage == null ? (
                        <span className="qed-type-table-empty-value">—</span>
                      ) : (
                        <span className="qed-type-table-grade text-[#800000]">{displayAverage}</span>
                      )}
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

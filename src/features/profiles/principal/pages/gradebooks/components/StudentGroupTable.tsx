import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText, SkeletonAvatar } from "@shared/components/SkeletonLoading";
import { skeletonRows, lastKnownCount, rememberRows, rememberColumns, useColumnReservation } from "@shared/loading/reservations";
import { Fragment, useRef } from "react";
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
  loading?: boolean;
  view?: string;
}

export function StudentGroupTable({
  groups,
  subjects,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  loading = false, view = "principal-grade-sheet",
}: StudentGroupTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const reservedSubjects = Array.from({ length: lastKnownCount(`${view}-subjects`, 3) }, (_, index) => `pending-${index}`);
  const widths = useColumnReservation(view, [{ label: "Student", typical: "Last name, First name" }, ...(loading ? reservedSubjects : subjects).map(subject => ({ label: loading ? "" : subject, typical: "Subject name" })), { label: "Overall Average", typical: "90.00" }], loading);
  const groupBand = `qed-type-table-group px-4 py-1.5 uppercase ${
    darkMode ? "bg-white/10" : "bg-brand-light"
  } ${textPrimary}`;

  const renderTable = (pending: boolean) => {
    const displaySubjects = pending ? reservedSubjects : subjects;
    const pendingStudents = Array.from({ length: skeletonRows(view, undefined, 44) }, (_, index): Student => ({ studentId: `pending-${index}`, firstName: "", lastName: "", middleInitial: "", gender: index % 2 ? "Female" : "Male", grades: {}, gradeStatuses: {}, ownAdvisorySubjects: {}, overallAverage: null }));
    const displayGroups = pending ? [{ label: "Male", students: pendingStudents.filter(student => student.gender === "Male") }, { label: "Female", students: pendingStudents.filter(student => student.gender === "Female") }].filter(group => group.students.length) : groups;
    const columnCount = displaySubjects.length + 2;
    return (
      <table ref={tableRef} className="teacher-user-table w-full min-w-max text-sm">
        {pending && <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
        <thead data-sk-region="grade-sheet-table-header">
          <tr className={`border-b ${panelBorder}`}>
            <th className={`qed-type-table-header sticky left-0 z-10 min-w-56 py-2 pr-4 text-left uppercase tracking-wider ${panelBg} ${textMuted}`}>
              Student
            </th>
            {displaySubjects.map((subject, index) => (
              <th key={subject} className={`qed-type-table-header min-w-28 whitespace-nowrap px-3 py-2 text-center uppercase tracking-wider ${textMuted}`}>
                <span>{pending ? <SkeletonText width={index % 2 ? "13ch" : "10ch"} /> : subject}</span>
              </th>
            ))}
            <th className={`qed-type-table-header min-w-28 py-2 pl-3 text-center uppercase tracking-wider ${textMuted}`}>
              Overall Average
            </th>
          </tr>
        </thead>
        <tbody>
          {displayGroups.map((group) => (
            <Fragment key={group.label}>
              <tr>
                <td colSpan={columnCount} className={groupBand}>
                  {group.label} · {pending ? <SkeletonText width="1ch" className="inline-block align-middle" /> : group.students.length} students
                </td>
              </tr>
              {group.students.map((student) => {
                const average = student.overallAverage ?? computeAverage(student.grades, subjects);
                const displayAverage = student.overallAverage ?? (average > 0 ? average : null);
                return (
                  <tr key={student.studentId} data-sk-region="grade-sheet-student-row" data-sk-item="" className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="h-7 w-7 shrink-0" data-sk-region="grade-sheet-student-avatar">{pending ? <SkeletonAvatar width={28} /> : <StudentAvatar gender={student.gender} name={fullName(student)} />}</span>
                        <span data-sk-region="grade-sheet-student-name" className={`qed-type-table-body truncate ${textPrimary}`}>
                          {pending ? <SkeletonText width={student.gender === "Female" ? "11ch" : "15ch"} /> : fullName(student)}
                        </span>
                      </div>
                    </td>
                    {displaySubjects.map((subject, index) => {
                      const status = student.gradeStatuses[subject] ?? (student.grades[subject] === undefined ? "not_submitted" : "submitted");
                      const grade = student.grades[subject];
                      return (
                        <td key={subject} className="px-3 py-2 text-center">
                          {pending ? <SkeletonText width={index % 2 ? "2ch" : "3ch"} className="qed-type-table-grade mx-auto" /> : status === "submitted" ? (
                            grade == null ? (
                              <span className="qed-type-table-empty-value">—</span>
                            ) : (
                              <span className="qed-type-table-grade text-brand-ink">{grade}</span>
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
                      {pending ? <SkeletonText width="4ch" className="qed-type-table-grade mx-auto" /> : displayAverage == null ? (
                        <span className="qed-type-table-empty-value">—</span>
                      ) : (
                        <span className="qed-type-table-grade text-brand-ink">{displayAverage}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
          {displayGroups.length === 0 && (
            <tr>
              <td colSpan={columnCount} className={`py-8 text-center text-xs font-medium ${textMuted}`}>
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };
  return <div className="overflow-x-auto"><LoadingRegion loading={loading} variable autoColumns name="principal-grade-sheet-table" skeleton={null} frame={renderTable} retainPrevious hasContent={groups.some(group => group.students.length > 0)} onSettled={() => { rememberRows(view, groups.reduce((count, group) => count + group.students.length, 0)); rememberRows(`${view}-subjects`, subjects.length); rememberColumns(view, tableRef.current); }}>{null}</LoadingRegion></div>;
}


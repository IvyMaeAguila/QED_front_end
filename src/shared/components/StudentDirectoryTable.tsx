import { LoadingTable } from "../loading/LoadingTable";
import { LoadingRegion } from "../loading/LoadingRegion";
import { skeletonRows } from "../loading/reservations";
import { SkeletonAvatar, SkeletonText } from "./SkeletonLoading";
import { Fragment } from "react";
import { StudentAvatar, type StudentGender } from "./StudentAvatar";

export interface StudentDirectoryRow {
  id: string;
  name: string;
  gender?: StudentGender;
}

interface StudentDirectoryTableProps {
  students: StudentDirectoryRow[];
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
  totalStudents?: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  onActivate?: (id: string) => void;
  activateOnDoubleClick?: boolean;
  activationHint?: string;
  className?: string;
}

function genderGroup(gender: StudentGender): "Male" | "Female" | "Gender not specified" {
  const value = String(gender ?? "").trim().toLowerCase();
  if (value === "m" || value === "male") return "Male";
  if (value === "f" || value === "female") return "Female";
  return "Gender not specified";
}

export function StudentDirectoryTable({
  students,
  loading = false, error, retry, view = "student-directory",
  totalStudents = students.length,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  onActivate,
  activateOnDoubleClick = false,
  activationHint,
  className = "",
}: StudentDirectoryTableProps) {
  const renderRows = (pending: boolean) => {
    const list: StudentDirectoryRow[] = pending ? Array.from({ length: skeletonRows(view) }, (_, index) => ({ id: String(index), name: "", gender: index % 2 ? "Female" : "Male" })) : students;
    const groups = (["Male", "Female", "Gender not specified"] as const).map(label => ({ label, rows: list.filter(student => genderGroup(student.gender) === label) }));
    return list.length === 0 ? <tr><td colSpan={2} className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No students found.</td></tr> : <>
              {groups.map(({ label, rows }) => rows.length > 0 && (
                <Fragment key={label}>
                  <tr>
                    <td colSpan={2} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider ${darkMode ? "bg-white/10" : "bg-brand-light"} ${textPrimary}`}>
                      <span data-sk-static="" data-sk-region={`studentdirectory-group-${label}`}>{label}</span> <span className={textMuted} data-sk-region="studentdirectorytable-span-field-1">({pending ? <SkeletonText width="1ch" className="inline-block align-middle" /> : rows.length})</span>
                    </td>
                  </tr>
                  {rows.map((student, index) => (
                    <tr
                      data-sk-region="student-directory-row"
                      data-sk-item key={student.id}
                      onClick={!pending && onActivate && !activateOnDoubleClick ? () => onActivate(student.id) : undefined}
                      onDoubleClick={!pending && onActivate && activateOnDoubleClick ? () => onActivate(student.id) : undefined}
                      title={activationHint}
                      className={`border-t transition-colors ${panelBorder} ${onActivate ? "cursor-pointer" : ""} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/[0.02]"}`}
                    >
                      <td className={`px-4 py-2.5 text-xs font-bold tabular-nums ${textMuted}`} data-sk-region="studentdirectorytable-td-field-2">{pending ? <SkeletonText width="1ch" /> : index + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5" data-sk-region="studentdirectorytable-div-field-3">
                          {pending ? <SkeletonAvatar width="32px" style={{ height: "32px" }} /> : <StudentAvatar gender={student.gender} name={student.name} className="h-8 w-8" />}
                          <span className={`truncate text-xs font-bold ${textPrimary}`} data-sk-region="studentdirectorytable-span-field-4">{pending ? <SkeletonText width="18ch" /> : student.name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
</>;
  };
  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder} ${className}`} aria-label="Student directory">
      <div className={`flex items-center gap-1.5 border-b px-4 py-3 ${panelBorder}`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="studentdirectorytable-student-directory" data-sk-static="">Student directory</p>
        <span className={`ml-1 text-xs ${textMuted}`}><LoadingRegion as="span" loading={loading} skeleton={<SkeletonText width="16ch" />}>· {students.length} of {totalStudents} students</LoadingRegion></span>
      </div>
      <div className="overflow-x-auto">
        <LoadingTable view={view} loading={loading} error={error} retry={retry} staticRows columns={[{ label: "No.", typical: "99", reservedWidth: 48 }, { label: "Student", typical: "Maria Alexandra Santos" }]} count={students.length} className="teacher-user-table w-full min-w-208 text-sm" header={            <thead>
              <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                <th className={`w-12 px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${textMuted}`} data-sk-region="studentdirectorytable-no-" data-sk-static="">No.</th>
                <th className={`px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${textMuted}`} data-sk-region="studentdirectorytable-student" data-sk-static="">Student</th>
              </tr>
            </thead>} skeleton={renderRows(true)}>{renderRows(false)}</LoadingTable>
      </div>
    </section>
  );
}



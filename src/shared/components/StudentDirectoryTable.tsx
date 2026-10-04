import { Fragment } from "react";
import { StudentAvatar, type StudentGender } from "./StudentAvatar";

export interface StudentDirectoryRow {
  id: string;
  name: string;
  gender?: StudentGender;
}

interface StudentDirectoryTableProps {
  students: StudentDirectoryRow[];
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
  const groups = (["Male", "Female", "Gender not specified"] as const).map((label) => ({
    label,
    rows: students.filter((student) => genderGroup(student.gender) === label),
  }));

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder} ${className}`} aria-label="Student directory">
      <div className={`flex items-center gap-1.5 border-b px-4 py-3 ${panelBorder}`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Student directory</p>
        <span className={`ml-1 text-[11px] ${textMuted}`}>· {students.length} of {totalStudents} students</span>
      </div>
      {students.length === 0 ? (
        <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No students found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="teacher-user-table w-full min-w-208 text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                <th className={`w-12 px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>No.</th>
                <th className={`px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>Student</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ label, rows }) => rows.length > 0 && (
                <Fragment key={label}>
                  <tr>
                    <td colSpan={2} className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textPrimary}`}>
                      {label} <span className={textMuted}>({rows.length})</span>
                    </td>
                  </tr>
                  {rows.map((student, index) => (
                    <tr
                      key={student.id}
                      onClick={onActivate && !activateOnDoubleClick ? () => onActivate(student.id) : undefined}
                      onDoubleClick={onActivate && activateOnDoubleClick ? () => onActivate(student.id) : undefined}
                      title={activationHint}
                      className={`border-t transition-colors ${panelBorder} ${onActivate ? "cursor-pointer" : ""} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/[0.02]"}`}
                    >
                      <td className={`px-4 py-2.5 text-[11px] font-bold tabular-nums ${textMuted}`}>{index + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <StudentAvatar gender={student.gender} name={student.name} className="h-8 w-8" />
                          <span className={`truncate text-xs font-bold ${textPrimary}`}>{student.name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

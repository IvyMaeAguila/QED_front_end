import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Student } from "../types/Students";
import { formatFullName } from "../types/Students";

interface StudentsTableProps {
  students: Student[];
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const genderBadge = (gender: string) =>
  gender === "Male"
    ? { color: "#1D70D6", bg: "#EAF2FF" }
    : { color: "#C2255C", bg: "#FCE7F1" };

export function StudentsTable({
  students,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
  onView,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className={`text-sm font-semibold ${textMuted}`}>No students match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={darkMode ? "bg-[#0B1120]" : "bg-[#F8FAFC]"}>
              {["Student ID", "Full Name", "Gender", "Grade Level", "Section", ""].map((h) => (
                <th
                  key={h}
                  className={`text-left font-bold text-[11px] uppercase tracking-wider px-5 py-3 ${textMuted}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {students.map((student) => {
              const badge = genderBadge(student.gender);
              return (
                <tr key={student.id} className={`border-t ${panelBorder} hover:bg-black/2 transition-colors`}>
                  <td className={`px-5 py-4 font-extrabold tabular-nums ${textPrimary}`}>{student.id}</td>
                  <td className={`px-5 py-4 font-semibold ${textPrimary}`}>{formatFullName(student)}</td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: darkMode ? `${badge.color}25` : badge.bg, color: badge.color }}
                    >
                      {student.gender}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-semibold ${textPrimary}`}>{student.gradeLevel}</td>
                  <td className={`px-5 py-4 font-semibold ${textPrimary}`}>{student.section}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <RowActionButton icon={Eye} label="View" darkMode={darkMode} onClick={() => onView(student)} />
                      <RowActionButton icon={Pencil} label="Edit" darkMode={darkMode} onClick={() => onEdit(student)} />
                      <RowActionButton
                        icon={Trash2}
                        label="Delete"
                        darkMode={darkMode}
                        danger
                        onClick={() => onDelete(student)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[#E5E7EB]">
        {students.map((student) => {
          const badge = genderBadge(student.gender);
          return (
            <div key={student.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-extrabold text-base ${textPrimary}`}>{formatFullName(student)}</p>
                  <p className={`text-xs font-bold tabular-nums mt-0.5 ${textMuted}`}>{student.id}</p>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0"
                  style={{ background: darkMode ? `${badge.color}25` : badge.bg, color: badge.color }}
                >
                  {student.gender}
                </span>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`}>
                {student.gradeLevel} &middot; Section {student.section}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <RowActionButton icon={Eye} label="View" darkMode={darkMode} full onClick={() => onView(student)} />
                <RowActionButton icon={Pencil} label="Edit" darkMode={darkMode} full onClick={() => onEdit(student)} />
                <RowActionButton
                  icon={Trash2}
                  label="Delete"
                  darkMode={darkMode}
                  danger
                  full
                  onClick={() => onDelete(student)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActionButton({
  icon: Icon,
  label,
  darkMode,
  danger,
  full,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  darkMode: boolean;
  danger?: boolean;
  full?: boolean;
  onClick: () => void;
}) {
  const dangerClasses = darkMode
    ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20"
    : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]";
  const normalClasses = darkMode
    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
    : "border-[#E5E7EB] text-[#64748B] hover:bg-[#F6F7FB]";

  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
        danger ? dangerClasses : normalClasses
      } ${full ? "flex-1" : ""}`}
    >
      <Icon size={13} />
      {full && label}
    </button>
  );
}
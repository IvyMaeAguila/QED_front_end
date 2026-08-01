import { useState } from "react";
import { Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
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
                <tr
                  key={student.id}
                  onDoubleClick={() => onView(student)}
                  title="Double-click to view details"
                  className={`border-t ${panelBorder} hover:bg-black/2 transition-colors cursor-pointer`}
                >
                  <td className={`px-5 py-4 font-extrabold tabular-nums ${textPrimary}`}>{student.studentId}</td>
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
                    <div className="flex items-center justify-end">
                      <RowActionMenu
                        darkMode={darkMode}
                        onView={() => onView(student)}
                        onEdit={() => onEdit(student)}
                        onDelete={() => onDelete(student)}
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
            <div
              key={student.id}
              onDoubleClick={() => onView(student)}
              className="p-4 space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-extrabold text-base ${textPrimary}`}>{formatFullName(student)}</p>
                  <p className={`text-xs font-bold tabular-nums mt-0.5 ${textMuted}`}>{student.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ background: darkMode ? `${badge.color}25` : badge.bg, color: badge.color }}
                  >
                    {student.gender}
                  </span>
                  <RowActionMenu
                    darkMode={darkMode}
                    onView={() => onView(student)}
                    onEdit={() => onEdit(student)}
                    onDelete={() => onDelete(student)}
                  />
                </div>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`}>
                {student.gradeLevel} &middot; Section {student.section}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActionMenu({
  darkMode,
  onView,
  onEdit,
  onDelete,
}: {
  darkMode: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-[#F6F7FB]"
        }`}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-9 z-10 w-40 rounded-xl border shadow-lg py-1 ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
          }`}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <Eye size={13} />
            View
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#F87171] hover:bg-white/5" : "text-[#B91C1C] hover:bg-[#FEE2E2]"
            }`}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
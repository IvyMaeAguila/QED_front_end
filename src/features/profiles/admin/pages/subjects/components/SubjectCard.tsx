import { useState } from "react";
import { BookOpen, User, School, Calendar, MoreVertical, Pencil, UserPlus } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, type Subject, type SubjectsTheme } from "../types/types";

interface SubjectCardProps extends SubjectsTheme {
  subject: Subject;
  onEdit: () => void;
  onAssign: () => void;
  onToggleStatus: () => void;
}

export function SubjectCard({
  subject,
  onEdit,
  onAssign,
  onToggleStatus,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: SubjectCardProps) {
  const { teachers } = useTeachers();
  const teacher = teachers.find((t) => t.id === subject.teacherId);
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = subject.status === "Active";

  return (
    <div className="relative pr-1 pb-1">
      {/* a single sliver of page peeking out — just enough to read as a closed book */}
      <div
        className={`absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border ${panelBorder}`}
        style={{ background: darkMode ? "#2E1719" : "#FAF6E9" }}
      />

      <div
        className={`relative flex rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${panelBorder} ${panelBg}`}
      >
        {/* spine */}
        <div className="w-2.5 shrink-0" style={{ background: ACCENT }} />

        <div className="relative flex-1 min-w-0 p-5">
          {/* bookmark tucked into the top edge */}
          <div
            className="absolute top-0 left-6 w-4 h-6"
            style={{
              background: darkMode ? "#F2F4F7" : "#FFFFFF",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
              opacity: 0.9,
            }}
          />

          {/* header */}
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: darkMode ? `${ACCENT}26` : `${ACCENT}14`, color: ACCENT }}
            >
              <BookOpen size={18} />
            </span>
            <div className="min-w-0">
              <h3 className={`text-base font-bold leading-tight truncate ${textPrimary}`}>{subject.name}</h3>
              <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>{subject.gradeLevel}</p>
            </div>
            <div className="ml-auto relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  darkMode ? "text-[#9CA3AF] hover:bg-white/5" : "text-[#9CA3AF] hover:bg-black/5"
                }`}
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div
                  className={`absolute right-0 top-9 z-10 w-44 rounded-xl border shadow-lg py-1 ${
                    darkMode ? "bg-[#1B1112] border-[#332022]" : "bg-white border-[#E5E7EB]"
                  }`}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAssign();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                      darkMode ? "text-[#D8B978] hover:bg-white/5" : "text-[#7A1420] hover:bg-[#FBF4E4]"
                    }`}
                  >
                    <UserPlus size={13} />
                    Assign Teacher
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* status */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: isActive ? "#22C55E" : "#9CA3AF" }}
            />
            <span className={`text-xs font-semibold ${isActive ? "text-[#16A34A]" : textMuted}`}>
              {subject.status}
            </span>
          </div>

          {/* details */}
          <div className={`mt-4 pt-4 border-t space-y-2.5 ${panelBorder}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={`inline-flex items-center gap-1.5 ${textMuted}`}>
                <User size={13} />
                Teacher
              </span>
              <span className={`font-semibold text-right truncate max-w-[60%] ${teacher ? textPrimary : textMuted}`}>
                {teacher ? formatTeacherName(teacher) : "Not Assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`inline-flex items-center gap-1.5 ${textMuted}`}>
                <School size={13} />
                Section
              </span>
              <span className={`font-semibold ${subject.section ? textPrimary : textMuted}`}>
                {subject.section || "Not Assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`inline-flex items-center gap-1.5 ${textMuted}`}>
                <Calendar size={13} />
                School Year
              </span>
              <span className={`font-semibold ${textPrimary}`}>{subject.schoolYear}</span>
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onEdit}
              title="Edit Subject"
              className={`h-10 w-10 shrink-0 rounded-xl border inline-flex items-center justify-center transition-colors ${panelBorder} ${
                darkMode ? "text-[#D1D5DB] hover:bg-white/5" : "text-[#374151] hover:bg-black/5"
              }`}
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={onToggleStatus}
              className={`flex-1 h-10 rounded-xl text-xs font-bold border inline-flex items-center justify-center transition-colors ${
                isActive
                  ? darkMode
                    ? "border-[#4A2226] text-[#F87171] hover:bg-[#4A2226]/30"
                    : "border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]"
                  : darkMode
                  ? "border-[#22C55E]/40 text-[#4ADE80] hover:bg-[#22C55E]/10"
                  : "border-[#86EFAC] text-[#16A34A] hover:bg-[#F0FDF4]"
              }`}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
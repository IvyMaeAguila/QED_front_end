import { useState } from "react";
import { BookOpen, User, School, Calendar, MoreVertical, Pencil, UserPlus, Power } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { PALETTE, type Subject, type SubjectsTheme } from "../types";

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
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${panelBorder}`}>
      <div
        className="px-5 pt-5 pb-6 relative"
        style={{ background: `linear-gradient(160deg, ${PALETTE.gradientFrom} 0%, ${PALETTE.gradientTo} 100%)` }}
      >
        <div className="flex items-start justify-between">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1.5px solid ${PALETTE.white}66`,
              color: PALETTE.white,
            }}
          >
            <BookOpen size={22} />
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                className={`absolute right-0 top-9 z-10 w-44 rounded-xl border shadow-lg py-1 ${
                  darkMode ? "bg-[#241012] border-[#4A2226]" : "bg-white border-[#E8DFC8]"
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

        <h3 className="mt-4 text-2xl font-semibold text-white leading-tight">{subject.name}</h3>

        <div className="mt-5 flex items-center gap-1.5 text-white/85">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: isActive ? "#4ADE80" : "#9CA3AF" }}
          />
          <span className="text-sm">{subject.status}</span>
          <span className="text-white/40 mx-1">•</span>
          <span className="text-sm">{subject.gradeLevel}</span>
        </div>
      </div>

      <div className={`px-5 py-4 space-y-3 ${panelBg}`}>
        <div className="flex items-center justify-between text-sm">
          <span className={`inline-flex items-center gap-1.5 ${textMuted}`}>
            <User size={13} />
            Teacher
          </span>
          <span className={`font-semibold text-right ${teacher ? textPrimary : textMuted}`}>
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

        <div className="flex gap-2 mt-2">
          <button
            onClick={onEdit}
            title="Edit Subject"
            className="h-11 w-11 shrink-0 rounded-xl border inline-flex items-center justify-center transition-colors"
            style={{
              borderColor: darkMode ? PALETTE.gray : "#9CA3AF",
              color: darkMode ? "#F2F4F7" : "#650000",
              background: darkMode ? "#241012" : "#F8FAFC",
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onToggleStatus}
            className="flex-1 h-11 rounded-xl text-sm font-normal border inline-flex items-center justify-center gap-2 transition-colors"
            style={{
              borderColor: darkMode ? PALETTE.gray : "#9CA3AF",
              color: darkMode ? "#F2F4F7" : "#650000",
              background: darkMode ? "#650000" : "#F8FAFC",
            }}
          >
            {isActive ? "Deactivate Subject" : "Activate Subject"}
          </button>
        </div>
      </div>
    </div>
  );
}
import { BookOpen } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import type { Subject, SubjectsTheme } from "../types/types";

interface SubjectCardProps extends SubjectsTheme {
  subject: Subject;
  onEdit: () => void;
  onAssign: () => void;
  onToggleStatus: () => void;
}

const MAROON = "#800020";
const MAROON_DARK = "#5A1A1F";

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
  const isActive = subject.status === "Active";

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className={textMuted}>{label}</span>
      <span className={`font-medium text-right truncate ${textPrimary}`}>{children}</span>
    </div>
  );

  return (
    <div
      className="flex h-full flex-col rounded-2xl overflow-hidden shadow-sm"
      style={{ background: darkMode ? MAROON_DARK : MAROON }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-7">
        <span
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"
          style={{ color: MAROON }}
        >
          <BookOpen size={16} />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#800020]">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isActive ? "#22C55E" : "#9CA3AF" }}
          />
          {subject.status}
        </span>
      </div>

      {/* body */}
      <div
        className={`relative -mt-4 flex flex-1 flex-col rounded-2xl p-4 ${darkMode ? panelBg : "bg-white"}`}
      >
        <h3 className={`text-base font-semibold leading-snug ${textPrimary}`}>{subject.name}</h3>
        <p className={`mt-0.5 text-xs ${textMuted}`}>
          {subject.gradeLevel} · {subject.isGraded ? "Graded" : "Non-Graded"}
        </p>

        <div className="mt-4 space-y-2">
          <Row label="Teacher">
            {teacher ? (
              formatTeacherName(teacher)
            ) : (
              <button onClick={onAssign} className={`underline decoration-dotted ${textMuted}`}>
                Not assigned
              </button>
            )}
          </Row>
          <Row label="Section">{subject.section || "Not assigned"}</Row>
          <Row label="School year">{subject.schoolYear}</Row>
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <button
            onClick={onEdit}
            className="flex-1 h-8 rounded-lg bg-[#800000] text-white text-[11px] font-extrabold transition-colors hover:bg-[#650000]"
          >
            Edit
          </button>
          <button
            onClick={onToggleStatus}
            className={`flex-1 h-8 rounded-lg border text-[11px] font-extrabold transition-colors ${
              darkMode
                ? "border-[#D4AF37]/30 bg-white/5 hover:bg-white/10"
                : "border-[#D4AF37]/40 bg-white hover:bg-[#FFFDF5]"
            } ${isActive ? "text-[#DC2626]" : "text-[#16A34A]"}`}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
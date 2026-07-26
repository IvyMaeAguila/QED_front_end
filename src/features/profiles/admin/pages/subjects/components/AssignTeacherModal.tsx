import { useState } from "react";
import { UserPlus, Sparkles } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, type Subject, type SubjectsTheme } from "../types";
import { ModalShell } from "./ModalShell";

interface AssignTeacherModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onAssign: (updates: Partial<Subject>) => void;
}

export function AssignTeacherModal({ subject, onClose, onAssign, ...theme }: AssignTeacherModalProps) {
  const { teachers } = useTeachers();
  const [section, setSection] = useState(subject.section);
  const [teacherId, setTeacherId] = useState(subject.teacherId ?? "");
  const { darkMode } = theme;

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${theme.textMuted}`;

  return (
    <ModalShell title="Assign Teacher" icon={UserPlus} onClose={onClose} {...theme}>
      <div>
        <label className={labelClasses}>Subject</label>
        <input value={subject.name} disabled className={disabledInputClasses} />
      </div>
      <div>
        <label className={labelClasses}>Grade Level</label>
        <input value={subject.gradeLevel} disabled className={disabledInputClasses} />
      </div>
      <div>
        <label className={labelClasses}>Section</label>
        <input value={section} onChange={(e) => setSection(e.target.value)} className={inputClasses} />
      </div>
      <div>
        <label className={labelClasses}>Assigned Teacher</label>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputClasses}>
          <option value="">Not Assigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {formatTeacherName(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={() => onAssign({ section: section.trim() || subject.section, teacherId: teacherId || null })}
          className="flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          <Sparkles size={13} />
          Assign Teacher
        </button>
      </div>
    </ModalShell>
  );
}
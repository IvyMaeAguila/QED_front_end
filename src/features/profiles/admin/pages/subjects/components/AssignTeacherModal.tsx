import { useState } from "react";
import { UserPlus, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, type Subject, type SubjectsTheme } from "../types";
import { ModalShell } from "./ModalShell";

interface AssignTeacherModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onAssign: (updates: Partial<Subject>) => void | Promise<void>;
  saving?: boolean;
  error?: string | null;
}

export function AssignTeacherModal({
  subject,
  onClose,
  onAssign,
  saving = false,
  error = null,
  ...theme
}: AssignTeacherModalProps) {
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

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleAssign() {
    if (saving) return;
    void onAssign({ section: section.trim() || subject.section, teacherId: teacherId || null });
  }

  return (
    <ModalShell title="Assign Teacher" icon={UserPlus} onClose={onClose} closeDisabled={saving} {...theme}>
      {error && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
            darkMode
              ? "border-[#7F1D1D] bg-[#7F1D1D]/20 text-[#F87171]"
              : "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
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
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Assigned Teacher</label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        >
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
          onClick={handleClose}
          disabled={saving}
          className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={saving}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {saving ? "Saving..." : "Assign Teacher"}
        </button>
      </div>
    </ModalShell>
  );
}
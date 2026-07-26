import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, type Subject, type SubjectsTheme } from "../types";
import { useSections } from "../context/SectionsContext";
import { ModalShell } from "./ModalShell";

interface EditSubjectModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onSave: (updates: Partial<Subject>) => void;
  onManageSections: () => void;
}

export function EditSubjectModal({ subject, onClose, onSave, onManageSections, ...theme }: EditSubjectModalProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade } = useSections();
  const [name, setName] = useState(subject.name);
  const [schoolYear, setSchoolYear] = useState(subject.schoolYear);
  const [teacherId, setTeacherId] = useState(subject.teacherId ?? "");
  const [section, setSection] = useState(subject.section);
  const [status, setStatus] = useState(subject.status);
  const { darkMode, textMuted } = theme;

  const gradeSections = getSectionsForGrade(subject.gradeLevel);
  const sectionOptions =
    subject.section && !gradeSections.some((s) => s.name === subject.section)
      ? [{ id: "current", name: subject.section }, ...gradeSections]
      : gradeSections;

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  return (
    <ModalShell title="Edit Subject" icon={Pencil} onClose={onClose} {...theme}>
      <p className={`text-[11px] font-semibold -mt-1 ${textMuted}`}>
        Editing renames the existing curriculum entry — this does not create a new subject.
      </p>
      <div>
        <label className={labelClasses}>Subject Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
      </div>
      <div>
        <label className={labelClasses}>Grade Level</label>
        <input value={subject.gradeLevel} disabled className={`${inputClasses} opacity-60 cursor-not-allowed`} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClasses.replace("mb-1.5", "")}>Section</label>
          <button
            type="button"
            onClick={onManageSections}
            className="text-[11px] font-bold hover:underline"
            style={{ color: ACCENT }}
          >
            Manage Sections
          </button>
        </div>
        {sectionOptions.length === 0 ? (
          <p className={`text-xs font-semibold rounded-xl border px-3 py-2.5 ${
            darkMode ? "border-[#374151] text-[#F87171]" : "border-[#FEE2E2] text-[#B91C1C]"
          }`}>
            No sections exist yet for {subject.gradeLevel}. Use Manage Sections to add one.
          </p>
        ) : (
          <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClasses}>
            <option value="">Not Assigned</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className={labelClasses}>School Year</label>
        <input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className={inputClasses} />
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
      <div>
        <label className={labelClasses}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Subject["status"])}
          className={inputClasses}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
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
          onClick={() =>
            onSave({ name: name.trim() || subject.name, schoolYear, teacherId: teacherId || null, section, status })
          }
          className="flex-1 h-10 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          Save Changes
        </button>
      </div>
    </ModalShell>
  );
}
import { useState, useEffect } from "react";
import { Pencil, Loader2, AlertCircle } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, type Subject, type SubjectsTheme } from "../types";
import { useSections } from "../context/SectionsContext";
import { ModalShell } from "./ModalShell";

interface EditSubjectModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onSave: (updates: Partial<Subject>) => void | Promise<void>;
  onManageSections: () => void;
  saving?: boolean;
  error?: string | null;
}

export function EditSubjectModal({
  subject,
  onClose,
  onSave,
  onManageSections,
  saving = false,
  error = null,
  ...theme
}: EditSubjectModalProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();
  const [name, setName] = useState(subject.name);
  const [schoolYear, setSchoolYear] = useState(subject.schoolYear);
  const [teacherId, setTeacherId] = useState(subject.teacherId ?? "");
  const [section, setSection] = useState(subject.section);
  const [status, setStatus] = useState(subject.status);
  const { darkMode, textMuted } = theme;

  useEffect(() => {
    void loadSectionsForGrade(subject.gradeLevel);
  }, [subject.gradeLevel, loadSectionsForGrade]);

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
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleSave() {
    if (saving) return;
    void onSave({
      name: name.trim() || subject.name,
      schoolYear,
      teacherId: teacherId || null,
      section,
      status,
    });
  }

  return (
    <ModalShell
      title="Edit Subject"
      icon={Pencil}
      onClose={onClose}
      closeDisabled={saving}
      {...theme}
    >
      <p className={`text-[11px] font-semibold -mt-1 ${textMuted}`}>
        Editing renames the existing curriculum entry — this does not create a
        new subject.
      </p>

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
        <label className={labelClasses}>Subject Name</label>
        {/* <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        /> */}
        <input value={subject.name} disabled className={disabledInputClasses} />
      </div>
      <div>
        <label className={labelClasses}>Grade Level</label>
        <input
          value={subject.gradeLevel}
          disabled
          className={disabledInputClasses}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClasses.replace("mb-1.5", "")}>Section</label>
          <button
            type="button"
            onClick={onManageSections}
            disabled={saving}
            className="text-[11px] font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: ACCENT }}
          >
            Manage Sections
          </button>
        </div>
        {sectionOptions.length === 0 ? (
          <p
            className={`text-xs font-semibold rounded-xl border px-3 py-2.5 ${
              darkMode
                ? "border-[#374151] text-[#F87171]"
                : "border-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            No sections exist yet for {subject.gradeLevel}. Use Manage Sections
            to add one.
          </p>
        ) : (
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={saving}
            className={saving ? disabledInputClasses : inputClasses}
          >
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
        {/* <input
          value={schoolYear}
          onChange={(e) => setSchoolYear(e.target.value)}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        /> */}
        <input
          value={subject.schoolYear}
          disabled
          className={disabledInputClasses}
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
      <div>
        <label className={labelClasses}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Subject["status"])}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
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
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}

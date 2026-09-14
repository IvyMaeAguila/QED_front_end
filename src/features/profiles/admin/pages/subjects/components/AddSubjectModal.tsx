import { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import {
  ACCENT,
  type GradeLevel,
  type Subject,
  type NewSubjectInput,
  type SubjectsTheme,
} from "../types/types";
import { ModalShell } from "./ModalShell";
import { useGradeLevels } from "../context/gradeLevelsContext";

interface AddSubjectModalProps extends SubjectsTheme {
  subjects: Subject[];
  defaultGrade: GradeLevel;
  schoolYear: string;
  onClose: () => void;
  onAdd: (newSubject: NewSubjectInput) => void | Promise<void>;
  onManageSections: () => void;
  saving?: boolean;
  error?: string | null;
}

export function AddSubjectModal({
  subjects,
  schoolYear,
  onClose,
  onAdd,
  saving = false,
  error = null,
  ...theme
}: AddSubjectModalProps) {
  const { darkMode, textMuted } = theme;

  const { gradeLevels, loading: loadingGradeLevels } = useGradeLevels();

  // "" = wala pang napiling grade level — sadyang hindi ito ni-default sa defaultGrade
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [name, setName] = useState("");
  // default true — karamihan ng subjects ay graded; i-uncheck lang para sa
  // mga subject na walang numerical grade (e.g. Values Education sa ibang schools)
  const [isGraded, setIsGraded] = useState(true);

  useEffect(() => {
    setName("");
    setIsGraded(true);
  }, [gradeLevel]);

  function handleGradeChange(grade: string) {
    setGradeLevel(grade as GradeLevel | "");
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed placeholder:text-current`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  const noGradeSelected = gradeLevel === "";
  const trimmedName = name.trim();

  const isDuplicate =
    !noGradeSelected &&
    trimmedName !== "" &&
    subjects.some(
      (s) =>
        s.gradeLevel === gradeLevel &&
        s.schoolYear === schoolYear &&
        s.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

  const canSubmit = !saving && !noGradeSelected && trimmedName !== "" && !isDuplicate;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleAdd() {
    // Check muna ang gradeLevel bago i-reference si canSubmit — kung
    // paglipatin ang pagkakasunod, na-narrow na ni TS ang gradeLevel
    // papuntang GradeLevel dahil sa canSubmit's alias chain (noGradeSelected),
    // kaya nagiging "no overlap" error itong comparison sa "".
    if (gradeLevel === "") return;
    if (!canSubmit) return;

    void onAdd({
      name: trimmedName,
      gradeLevel,
      isGraded,
      schoolYear,
      status: "Active",
    });
  }

  return (
    <ModalShell
      title="Add Subject"
      icon={BookOpen}
      onClose={onClose}
      closeDisabled={saving}
      {...theme}
    >

      <div>
        <label className={labelClasses}>Grade Level</label>
        <select
          value={gradeLevel}
          onChange={(e) => handleGradeChange(e.target.value)}
          disabled={saving || loadingGradeLevels}
          className={inputClasses}
        >
          <option value="">
            {loadingGradeLevels
              ? "Loading…"
              : gradeLevels.length === 0
                ? "No grade levels found"
                : "Select grade level…"}
          </option>
          {gradeLevels.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses}>Subject Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving || noGradeSelected}
          placeholder={
            noGradeSelected ? "Select a grade level first" : "e.g. Filipino, MAPEH"
          }
          className={noGradeSelected ? disabledInputClasses : inputClasses}
        />
        {isDuplicate && (
          <p className="mt-1 text-[11px] font-semibold text-[#B91C1C]">
            This subject is already available
          </p>
        )}
      </div>

      <div>
        <label className={labelClasses}>Grading Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsGraded(true)}
            disabled={saving || noGradeSelected}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isGraded
                ? "text-white border-transparent"
                : darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
            style={isGraded ? { background: ACCENT } : undefined}
          >
            Graded
          </button>
          <button
            type="button"
            onClick={() => setIsGraded(false)}
            disabled={saving || noGradeSelected}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              !isGraded
                ? "text-white border-transparent"
                : darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
            style={!isGraded ? { background: ACCENT } : undefined}
          >
            Non-graded
          </button>
        </div>
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
          disabled={!canSubmit}
          onClick={handleAdd}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            !canSubmit ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Add Subject"}
        </button>
      </div>
    </ModalShell>
  );
}
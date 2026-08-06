import { useMemo, useState, useEffect } from "react";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import {
  ACCENT,
  type GradeLevel,
  type Subject,
  type SubjectsTheme,
} from "../types";
import { useSections } from "../context/SectionsContext";
import { ModalShell } from "./ModalShell";
import { useGradeLevels } from "../context/gradeLevelsContext";
import { useSubjectsCatalog } from "../context/SubjectsCatalogContext";

interface AddSubjectModalProps extends SubjectsTheme {
  subjects: Subject[];
  defaultGrade: GradeLevel;
  schoolYear: string;
  onClose: () => void;
  onAdd: (newSubject: Omit<Subject, "id">) => void | Promise<void>;
  onManageSections: () => void;
  saving?: boolean;
  error?: string | null;
}

export function AddSubjectModal({
  subjects,
  schoolYear,
  onClose,
  onAdd,
  onManageSections,
  saving = false,
  error = null,
  ...theme
}: AddSubjectModalProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();
  const { darkMode, textMuted } = theme;

  const { gradeLevels, loading: loadingGradeLevels } = useGradeLevels();
  const {
    getSubjectNamesForGrade,
    loadSubjectsForGrade,
    loading: loadingSubjects,
  } = useSubjectsCatalog();

  // "" = wala pang napiling grade level — sadyang hindi ito ni-default sa defaultGrade
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    if (!gradeLevel) return;
    void loadSectionsForGrade(gradeLevel);
  }, [gradeLevel, loadSectionsForGrade]);

  useEffect(() => {
    if (!gradeLevel) return;
    void loadSubjectsForGrade(gradeLevel);
  }, [gradeLevel, loadSubjectsForGrade]);

  useEffect(() => {
    setName("");
  }, [gradeLevel]);

  const nameOptions = useMemo<string[]>(
    () => (gradeLevel ? getSubjectNamesForGrade(gradeLevel) : []),
    [getSubjectNamesForGrade, gradeLevel],
  );

  const gradeSectionNames = useMemo<string[]>(
    () => (gradeLevel ? getSectionsForGrade(gradeLevel).map((s) => s.name) : []),
    [getSectionsForGrade, gradeLevel],
  );

  const availableSections = useMemo(() => {
    if (!gradeLevel || !name) return [];
    const used = subjects
      .filter(
        (s) =>
          s.gradeLevel === gradeLevel &&
          s.name === name &&
          s.schoolYear === schoolYear,
      )
      .map((s) => s.section);
    return gradeSectionNames.filter((sec) => !used.includes(sec));
  }, [subjects, gradeLevel, name, schoolYear, gradeSectionNames]);

  useEffect(() => {
    setSection(availableSections[0] ?? "");
  }, [availableSections]);

  function handleGradeChange(grade: string) {
    setGradeLevel(grade as GradeLevel | "");
  }

  function handleNameChange(nextName: string) {
    setName(nextName);
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const disabledSelectClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  const noGradeSelected = gradeLevel === "";
  const noSubjectSelected = name === "";
  const noSectionsAtAll = !noGradeSelected && gradeSectionNames.length === 0;
  const noSectionsLeft =
    !noGradeSelected && !noSubjectSelected && gradeSectionNames.length > 0 && availableSections.length === 0;

  // function loadingSections(_names: string[], _l: boolean) {
  //   return false;
  // }

  const sectionDisabled = saving || noGradeSelected || noSubjectSelected;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleAdd() {
    if (saving || !gradeLevel || !name || !section) return;
    void onAdd({
      name,
      gradeLevel,
      section,
      teacherId: teacherId || null,
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
      <p className={`text-[11px] font-semibold -mt-1 ${textMuted}`}>
        Subject names come from the MATATAG curriculum list — pick a name and a
        section to create a gradable record for that section. This keeps
        subjects consistent when a grade has multiple sections.
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
        <label className={labelClasses}>Subject</label>
        <select
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          disabled={saving || noGradeSelected || loadingSubjects}
          className={noGradeSelected ? disabledSelectClasses : inputClasses}
        >
          <option value="">
            {noGradeSelected
              ? "Select a grade level first"
              : loadingSubjects
                ? "Loading…"
                : nameOptions.length === 0
                  ? "No subjects found"
                  : "Select subject…"}
          </option>
          {nameOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
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

        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          disabled={sectionDisabled || noSectionsAtAll || noSectionsLeft}
          className={sectionDisabled || noSectionsAtAll || noSectionsLeft ? disabledSelectClasses : inputClasses}
        >
          <option value="">
            {noGradeSelected
              ? "Select a grade level first"
              : noSubjectSelected
                ? "Select a subject first"
                : noSectionsAtAll
                  ? "No sections found"
                  : noSectionsLeft
                    ? "No sections available"
                    : "Select section…"}
          </option>
          {availableSections.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>

        {!noGradeSelected && !noSubjectSelected && noSectionsAtAll && (
          <p
            className={`mt-1.5 text-xs font-semibold rounded-xl border px-3 py-2.5 ${
              darkMode
                ? "border-[#374151] text-[#F87171]"
                : "border-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            No sections exist yet for {gradeLevel}. Use Manage Sections to add
            one.
          </p>
        )}
        {!noGradeSelected && !noSubjectSelected && noSectionsLeft && (
          <p
            className={`mt-1.5 text-xs font-semibold rounded-xl border px-3 py-2.5 ${
              darkMode
                ? "border-[#374151] text-[#F87171]"
                : "border-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            Every section already has {name} for {gradeLevel}. Choose a
            different subject, or add a new section.
          </p>
        )}
      </div>

      <div>
        <label className={labelClasses}>Assigned Teacher</label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          disabled={saving}
          className={inputClasses}
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
          disabled={saving || !gradeLevel || !name || !section}
          onClick={handleAdd}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            saving || !gradeLevel || !name || !section
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
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
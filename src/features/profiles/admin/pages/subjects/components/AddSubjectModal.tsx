import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { ACCENT, GRADE_LEVELS, type GradeLevel, type Subject, type SubjectsTheme } from "../types";
import { getSubjectNamesForGrade } from "../data";
import { useSections } from "../context/SectionsContext";
import { ModalShell } from "./ModalShell";

interface AddSubjectModalProps extends SubjectsTheme {
  subjects: Subject[];
  defaultGrade: GradeLevel;
  schoolYear: string;
  onClose: () => void;
  onAdd: (newSubject: Omit<Subject, "id">) => void;
  onManageSections: () => void;
}

export function AddSubjectModal({
  subjects,
  defaultGrade,
  schoolYear,
  onClose,
  onAdd,
  onManageSections,
  ...theme
}: AddSubjectModalProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade } = useSections();
  const { darkMode, textMuted } = theme;

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(defaultGrade);
  const nameOptions = useMemo(() => getSubjectNamesForGrade(gradeLevel), [gradeLevel]);
  const [name, setName] = useState(nameOptions[0]);
  const [teacherId, setTeacherId] = useState("");

  const gradeSectionNames = useMemo(
    () => getSectionsForGrade(gradeLevel).map((s) => s.name),
    [getSectionsForGrade, gradeLevel]
  );

  const availableSections = useMemo(() => {
    const used = subjects
      .filter((s) => s.gradeLevel === gradeLevel && s.name === name && s.schoolYear === schoolYear)
      .map((s) => s.section);
    return gradeSectionNames.filter((sec) => !used.includes(sec));
  }, [subjects, gradeLevel, name, schoolYear, gradeSectionNames]);

  const [section, setSection] = useState(availableSections[0] ?? "");

  function handleGradeChange(grade: GradeLevel) {
    setGradeLevel(grade);
    const nextNames = getSubjectNamesForGrade(grade);
    setName(nextNames[0]);
  }

  function handleNameChange(nextName: string) {
    setName(nextName);
    const used = subjects
      .filter((s) => s.gradeLevel === gradeLevel && s.name === nextName && s.schoolYear === schoolYear)
      .map((s) => s.section);
    const next = getSectionsForGrade(gradeLevel)
      .map((s) => s.name)
      .filter((sec) => !used.includes(sec));
    setSection(next[0] ?? "");
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  const noSectionsAtAll = gradeSectionNames.length === 0;
  const noSectionsLeft = availableSections.length === 0;

  return (
    <ModalShell title="Add Subject" icon={BookOpen} onClose={onClose} {...theme}>
      <p className={`text-[11px] font-semibold -mt-1 ${textMuted}`}>
        Subject names come from the MATATAG curriculum list — pick a name and a section to create a
        gradable record for that section. This keeps subjects consistent when a grade has multiple
        sections.
      </p>

      <div>
        <label className={labelClasses}>Grade Level</label>
        <select
          value={gradeLevel}
          onChange={(e) => handleGradeChange(e.target.value as GradeLevel)}
          className={inputClasses}
        >
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses}>Subject</label>
        <select value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClasses}>
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
            className="text-[11px] font-bold hover:underline"
            style={{ color: ACCENT }}
          >
            Manage Sections
          </button>
        </div>

        {noSectionsAtAll ? (
          <p className={`text-xs font-semibold rounded-xl border px-3 py-2.5 ${
            darkMode ? "border-[#374151] text-[#F87171]" : "border-[#FEE2E2] text-[#B91C1C]"
          }`}>
            No sections exist yet for {gradeLevel}. Use Manage Sections to add one.
          </p>
        ) : noSectionsLeft ? (
          <p className={`text-xs font-semibold rounded-xl border px-3 py-2.5 ${
            darkMode ? "border-[#374151] text-[#F87171]" : "border-[#FEE2E2] text-[#B91C1C]"
          }`}>
            Every section already has {name} for {gradeLevel}. Choose a different subject, or add a new
            section.
          </p>
        ) : (
          <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClasses}>
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        )}
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
          disabled={noSectionsLeft}
          onClick={() =>
            onAdd({
              name,
              gradeLevel,
              section,
              teacherId: teacherId || null,
              schoolYear,
              status: "Active",
            })
          }
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white transition-opacity ${
            noSectionsLeft ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          Add Subject
        </button>
      </div>
    </ModalShell>
  );
}
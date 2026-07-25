import { useState } from "react";
import { School, Plus, Trash2 } from "lucide-react";
import { ACCENT, GRADE_LEVELS, type GradeLevel, type Subject, type SubjectsTheme } from "../types";
import { useSections } from "../context/SectionsContext";
import { ModalShell } from "./ModalShell";

interface ManageSectionsModalProps extends SubjectsTheme {
  defaultGrade: GradeLevel;
  subjects: Subject[];
  onClose: () => void;
}

export function ManageSectionsModal({ defaultGrade, subjects, onClose, ...theme }: ManageSectionsModalProps) {
  const { darkMode, textMuted, textPrimary } = theme;
  const { getSectionsForGrade, addSection, removeSection } = useSections();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(defaultGrade);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const gradeSections = getSectionsForGrade(gradeLevel);

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function handleAdd() {
    const result = addSection(gradeLevel, name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setError(null);
  }

  function isInUse(sectionName: string) {
    return subjects.some((s) => s.gradeLevel === gradeLevel && s.section === sectionName);
  }

  return (
    <ModalShell title="Manage Sections" icon={School} onClose={onClose} {...theme}>
      <div>
        <label className={labelClasses}>Grade Level</label>
        <select
          value={gradeLevel}
          onChange={(e) => {
            setGradeLevel(e.target.value as GradeLevel);
            setError(null);
          }}
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
        <label className={labelClasses}>Add a Section</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Amethyst"
            className={inputClasses}
          />
          <button
            onClick={handleAdd}
            className="h-10 w-10 shrink-0 rounded-xl text-white inline-flex items-center justify-center transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
            aria-label="Add section"
          >
            <Plus size={16} />
          </button>
        </div>
        {error && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1.5">{error}</p>}
      </div>

      <div>
        <p className={labelClasses}>{gradeLevel} Sections</p>
        <div className={`rounded-xl border divide-y ${darkMode ? "border-[#374151] divide-[#374151]" : "border-[#E5E7EB] divide-[#E5E7EB]"}`}>
          {gradeSections.length === 0 ? (
            <p className={`text-xs font-semibold px-3 py-3 ${textMuted}`}>No sections yet for this grade.</p>
          ) : (
            gradeSections.map((section) => {
              const inUse = isInUse(section.name);
              return (
                <div key={section.id} className="flex items-center justify-between px-3 py-2.5">
                  <span className={`text-sm font-semibold ${textPrimary}`}>{section.name}</span>
                  <button
                    onClick={() => removeSection(section.id)}
                    disabled={inUse}
                    title={inUse ? "This section has subjects assigned — reassign or deactivate them first" : "Remove section"}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      inUse
                        ? "opacity-30 cursor-not-allowed"
                        : darkMode
                        ? "text-[#F87171] hover:bg-[#7F1D1D]/20"
                        : "text-[#B91C1C] hover:bg-[#FEE2E2]"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onClose}
          className={`w-full h-10 rounded-xl text-xs font-bold border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}
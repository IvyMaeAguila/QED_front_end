import { ACCENT, GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../types/types";

interface GradeLevelTabsProps extends Pick<SubjectsTheme, "panelBorder" | "textPrimary" | "textMuted"> {
  activeGrade: GradeLevel;
  onChange: (grade: GradeLevel) => void;
  onSectionChange: (sectionName: string | null) => void;
}

// Underline tabs that filter by grade. The section filter now lives in the
// SubjectFilters toolbar as a dropdown, so this only resets it on grade change.
export function GradeLevelTabs({
  activeGrade,
  onChange,
  onSectionChange,
  panelBorder,
  textPrimary,
  textMuted,
}: GradeLevelTabsProps) {
  function handleGradeChange(grade: GradeLevel) {
    onSectionChange(null); // reset section filter when switching grade level
    onChange(grade);
  }

  return (
    <div className={`flex items-center gap-8 border-b overflow-x-auto whitespace-nowrap ${panelBorder}`}>
      {GRADE_LEVELS.map((grade) => {
        const isActive = grade === activeGrade;
        return (
          <button
            key={grade}
            onClick={() => handleGradeChange(grade)}
            className={`relative pb-3 whitespace-nowrap text-sm font-bold transition-colors ${
              isActive ? textPrimary : `${textMuted} hover:${textPrimary}`
            }`}
          >
            {grade}
            {isActive && (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
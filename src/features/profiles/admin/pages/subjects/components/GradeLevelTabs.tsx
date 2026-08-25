import { ACCENT, GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../types/types";

interface GradeLevelTabsProps extends Pick<SubjectsTheme, "panelBorder" | "textPrimary" | "textMuted"> {
  activeGrade: GradeLevel;
  onChange: (grade: GradeLevel) => void;
}

// Same underline-tab language as AdminTopTabs, one level down — filters the
// current tab's content by grade instead of switching routes.
export function GradeLevelTabs({
  activeGrade,
  onChange,
  panelBorder,
  textPrimary,
  textMuted,
}: GradeLevelTabsProps) {
  return (
    <div className={`flex items-center gap-8 border-b overflow-x-auto ${panelBorder}`}>
      {GRADE_LEVELS.map((grade) => {
        const isActive = grade === activeGrade;
        return (
          <button
            key={grade}
            onClick={() => onChange(grade)}
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
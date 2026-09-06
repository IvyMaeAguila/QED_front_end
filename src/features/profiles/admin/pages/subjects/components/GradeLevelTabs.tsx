import { useEffect } from "react";
import { ACCENT, GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../types/types";
import { useSections } from "../context/SectionsContext";

interface GradeLevelTabsProps extends Pick<SubjectsTheme, "panelBorder" | "textPrimary" | "textMuted"> {
  activeGrade: GradeLevel;
  onChange: (grade: GradeLevel) => void;
  activeSection: string | null;
  onSectionChange: (sectionName: string | null) => void;
}

// Same underline-tab language as AdminTopTabs, one level down — filters the
// current tab's content by grade instead of switching routes.
//
// Ang section buttons ay nasa kanang dulo ng parehong row (hindi na hiwalay
// na row sa ilalim) — lalabas lang ito kapag may section talaga ang
// kasalukuyang grade level (getSectionsForGrade ay hindi empty). Kung walang
// section, walang ipinapakitang button dito.
export function GradeLevelTabs({
  activeGrade,
  onChange,
  activeSection,
  onSectionChange,
  panelBorder,
  textPrimary,
  textMuted,
}: GradeLevelTabsProps) {
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();

  useEffect(() => {
    void loadSectionsForGrade(activeGrade);
  }, [activeGrade, loadSectionsForGrade]);

  const sectionsForActiveGrade = getSectionsForGrade(activeGrade);

  function handleGradeChange(grade: GradeLevel) {
    onSectionChange(null); // i-reset ang section filter tuwing lilipat ng grade level
    onChange(grade);
  }

  return (
    <div className={`flex items-center justify-between gap-4 border-b overflow-x-auto ${panelBorder}`}>
      <div className="flex items-center gap-8 whitespace-nowrap">
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

      {sectionsForActiveGrade.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pb-2 shrink-0">
          <button
            onClick={() => onSectionChange(null)}
            className={`h-8 px-3 rounded-lg text-xs font-bold border transition-colors ${
              activeSection === null
                ? "text-white border-transparent"
                : `${textMuted} ${panelBorder} hover:${textPrimary}`
            }`}
            style={activeSection === null ? { background: ACCENT } : undefined}
          >
            All Sections
          </button>
          {sectionsForActiveGrade.map((section) => {
            const isActiveSection = section.name === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.name)}
                className={`h-8 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  isActiveSection
                    ? "text-white border-transparent"
                    : `${textMuted} ${panelBorder} hover:${textPrimary}`
                }`}
                style={isActiveSection ? { background: ACCENT } : undefined}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { ACCENT, GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../types";

interface GradeLevelTabsProps extends Pick<SubjectsTheme, "darkMode"> {
  activeGrade: GradeLevel;
  onChange: (grade: GradeLevel) => void;
}

export function GradeLevelTabs({ activeGrade, onChange, darkMode }: GradeLevelTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {GRADE_LEVELS.map((grade) => {
        const isActive = grade === activeGrade;
        return (
          <button
            key={grade}
            onClick={() => onChange(grade)}
            className={`h-10 px-5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
              isActive
                ? "text-white shadow-sm scale-[1.02]"
                : darkMode
                ? "bg-transparent border-[#8B0D0D]/50 text-[#D1D5DB] hover:border-[#8B0D0D] hover:bg-[#8B0D0D]/10"
                : "bg-white border-[#8B0D0D]/30 text-[#8B0D0D] hover:border-[#8B0D0D] hover:bg-[#8B0D0D]/5"
            }`}
            style={isActive ? { background: ACCENT, borderColor: ACCENT } : undefined}
          >
            {grade}
          </button>
        );
      })}
    </div>
  );
}
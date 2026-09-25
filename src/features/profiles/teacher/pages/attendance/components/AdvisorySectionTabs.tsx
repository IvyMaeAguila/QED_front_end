import type { AdvisorySection } from "../services/attendance.service";

interface Props {
  sections: AdvisorySection[];
  activeClassId: string;
  onSelect: (classId: string) => void;
  darkMode: boolean;
  panelBorder: string;
  textMuted: string;
}

export function AdvisorySectionTabs({
  sections,
  activeClassId,
  onSelect,
  darkMode,
  panelBorder,
  textMuted,
}: Props) {
  // Only ever shows up for teachers with 2+ advisory classes.
  if (sections.length < 2) return null;

  return (
    <div className={`flex items-center gap-1 rounded-xl border p-1 ${panelBorder}`}>
      {sections.map((s) => {
        const label = s.sectionName?.trim() || s.gradeLevel;
        const active = s.classId === activeClassId;
        return (
          <button
            key={s.classId}
            onClick={() => onSelect(s.classId)}
            className={`h-8 rounded-lg px-3 text-[11px] font-extrabold transition-colors ${
              active
                ? "bg-[#800000] text-white"
                : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
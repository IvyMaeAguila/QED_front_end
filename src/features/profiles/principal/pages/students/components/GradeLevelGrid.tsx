import { GradeLevelCard } from "./GradeLevelCard";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelGridProps {
  gradeLevels: GradeLevelSummary[];
  onViewClassList: (gradeLevel: GradeLevelSummary) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function GradeLevelGrid({
  gradeLevels,
  onViewClassList,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeLevelGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {gradeLevels.map((g) => (
        <GradeLevelCard
          key={g.classId ?? `grade-${g.gradeId}`}
          gradeLevel={g}
          onViewClassList={onViewClassList}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}
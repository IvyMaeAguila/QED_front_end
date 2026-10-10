import { GradeLevelCard } from "./GradeLevelCard";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelGridProps {
  gradeLevels: GradeLevelSummary[];
  loading?: boolean;
  onViewClassList: (gradeLevel: GradeLevelSummary) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function GradeLevelGrid({
  gradeLevels,
  loading = false,
  onViewClassList,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeLevelGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {gradeLevels.map((g) => (
        <GradeLevelCard
          key={g.classId ?? `grade-${g.gradeId}`}
          gradeLevel={g}
          loading={loading}
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


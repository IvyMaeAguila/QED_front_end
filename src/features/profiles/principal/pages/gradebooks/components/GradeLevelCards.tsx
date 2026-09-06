import { BookOpen, Users } from "lucide-react";
import { HeroActionCard } from "../../../../shared/components/DashboardUI";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardsProps {
  gradeLevels: GradeLevelSummary[];
  panelBg: string;
  onSelectGrade: (grade: string) => void;
}

export function GradeLevelCards({ gradeLevels, panelBg, onSelectGrade }: GradeLevelCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {gradeLevels.map((g) => (
        <HeroActionCard
          key={g.grade}
          icon={BookOpen}
          title={g.section}
          subtitle={g.grade}
          stat={`${g.totalStudents} students`}
          statIcon={Users}
          actionLabel="View GradeSheet"
          onAction={() => onSelectGrade(g.grade)}
          panelBg={panelBg}
        />
      ))}
    </div>
  );
}

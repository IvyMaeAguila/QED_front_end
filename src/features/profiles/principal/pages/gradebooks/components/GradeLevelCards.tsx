import { BookOpen, Users, Lock, User } from "lucide-react";
import { HeroActionCard } from "../../../../shared/components/DashboardUI";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardsProps {
  gradeLevels: GradeLevelSummary[];
  panelBg: string;
  onSelectGrade: (summary: GradeLevelSummary) => void;
}

export function GradeLevelCards({ gradeLevels, panelBg, onSelectGrade }: GradeLevelCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {gradeLevels.map((g, index) => {
        const hasSection = g.section.trim().length > 0;
        // Naka-lock ang card hangga't hindi pa na-su-submit ng adviser ang grades sa principal
        const isLocked = !g.isSubmitted;

        return (
          <div
            key={`${g.grade}-${g.section || index}`}
            className="relative"
          >
            <div
              className={
                isLocked
                  ? "opacity-50 grayscale-[0.4] pointer-events-none transition-opacity"
                  : "transition-opacity"
              }
            >
              <HeroActionCard
                icon={BookOpen}
                title={hasSection ? g.section : g.grade}
                subtitle={hasSection ? g.grade : ""}
                stat={`${g.totalStudents} students`}
                statIcon={Users}
                stat2={g.adviserName ?? undefined}
                statIcon2={User}
                actionLabel={isLocked ? "Not yet submitted" : "View GradeSheet"}
                onAction={isLocked ? () => {} : () => onSelectGrade(g)}
                panelBg={panelBg}
              />
            </div>

            {/* Maroon tint overlay para malinaw na naka-lock */}
            {isLocked && (
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  backgroundColor: "rgba(127, 29, 29, 0.12)", // maroon, faded
                  border: "1px solid rgba(127, 29, 29, 0.25)",
                }}
              />
            )}

            {/* Small lock badge */}
            {isLocked && (
              <div
                className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: "rgba(127, 29, 29, 0.85)",
                  color: "#fff",
                }}
              >
                <Lock size={11} />
                Pending
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
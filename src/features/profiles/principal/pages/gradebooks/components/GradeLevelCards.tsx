import { LockKeyhole } from "lucide-react";
import { SubjectAssignmentCard } from "../../../../shared/components/SubjectAssignmentCard";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardsProps {
  gradeLevels: GradeLevelSummary[];
  schoolYear: string;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onSelectGrade: (summary: GradeLevelSummary) => void;
}

export function GradeLevelCards({
  gradeLevels,
  schoolYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onSelectGrade,
}: GradeLevelCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {gradeLevels.map((g, index) => {
        const hasSection = g.section.trim().length > 0;
        const isSubmitted = g.isSubmitted && g.gradingPeriodId !== null;

        return (
          <div
            key={`${g.grade}-${g.section || index}`}
            className="relative"
          >
            <SubjectAssignmentCard
              schoolYear={`School Year ${schoolYear}`}
              status={isSubmitted ? "Submitted" : "Pending"}
              title={hasSection ? `${g.grade} · ${g.section}` : g.grade}
              studentCount={g.totalStudents}
              showStudentCount={false}
              faded={!isSubmitted}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              actions={
                <button
                  type="button"
                  disabled={!isSubmitted}
                  onClick={() => onSelectGrade(g)}
                  className={`whitespace-nowrap text-[10px] font-bold uppercase transition-colors ${isSubmitted ? "text-[#800020] hover:text-[#5A0017]" : "cursor-not-allowed text-gray-400"}`}
                >
                  {isSubmitted ? (
                    "View gradebook ›"
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                      Not yet submitted
                    </span>
                  )}
                </button>
              }
            />
          </div>
        );
      })}
    </div>
  );
}

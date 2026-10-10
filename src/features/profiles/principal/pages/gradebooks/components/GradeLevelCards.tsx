import { LockKeyhole } from "lucide-react";
import { SubjectAssignmentCard } from "../../../../shared/components/SubjectAssignmentCard";
import type { GradeLevelSummary } from "../data/types";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";

interface GradeLevelCardsProps {
  loading?: boolean;
  yearLoading?: boolean;
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
  loading = false,
  yearLoading = loading,
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" data-sk-region="gradelevelcards-div-field-1">
      {gradeLevels.map((g, index) => {
        const hasSection = g.section.trim().length > 0;
        const isSubmitted = g.isSubmitted && g.gradingPeriodId !== null;

        return (
          <div
            key={`${g.grade}-${g.section || index}`}
            className="relative"
          >
            <SubjectAssignmentCard
              loading={loading}
              schoolYearLoading={false}
              schoolYear={<LoadingRegion as="span" name="gradebook-card-year" loading={yearLoading} variable skeleton={<SkeletonText width="18ch" />}>School Year {schoolYear}</LoadingRegion>}
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
                  disabled={loading || !isSubmitted}
                  onClick={() => onSelectGrade(g)}
                  className={`whitespace-nowrap text-xs font-bold uppercase transition-colors ${isSubmitted ? "text-brand-ink hover:text-[#5A0017]" : "cursor-not-allowed text-gray-400"}`} data-sk-region="gradelevelcards-button-field-2"
                >
                  {loading ? <span className="inline-flex items-center gap-1"><Skeleton className="h-3 w-3" /><SkeletonText width="14ch" /></span> : isSubmitted ? (
                    "View gradebook ›"
                  ) : (
                    <span className="inline-flex items-center gap-1" data-sk-region="gradelevelcards-not-yet-submitted" data-sk-static="">
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

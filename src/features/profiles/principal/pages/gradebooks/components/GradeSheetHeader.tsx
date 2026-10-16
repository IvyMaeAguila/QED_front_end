import { BackButton } from "../../../../shared/components/DashboardUI";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";

interface GradeSheetHeaderProps {
  gradeLabel: string;
  sectionName: string | null;
  schoolYear: string;
  onBack: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  loading?: boolean;
}

export function GradeSheetHeader({
  gradeLabel,
  sectionName,
  schoolYear,
  onBack,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  loading = false,
}: GradeSheetHeaderProps) {
  return (
    <div className="flex items-start gap-2.5">
      <BackButton onClick={onBack} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon">
          <span data-sk-static="">{gradeLabel}</span><LoadingRegion as="span" loading={loading} variable name="grade-sheet-section" skeleton={<SkeletonParagraph field="grade-sheet-section" width="14ch" inline />}><span data-sk-field="grade-sheet-section">{sectionName ? ` · ${sectionName}` : ""}</span></LoadingRegion>
        </p>
        <h1 className={`qed-type-page-title mt-1 ${textPrimary}`}>
          Grade Sheet
        </h1>
        <p className={`qed-type-page-description mt-1 ${textMuted}`}><span data-sk-static="">School Year</span>{" "}<LoadingRegion as="span" loading={loading} variable name="grade-sheet-year" skeleton={<SkeletonParagraph field="grade-sheet-year" width="12ch" typical={1} inline />}><span data-sk-field="grade-sheet-year">{schoolYear}</span></LoadingRegion></p>
      </div>
    </div>
  );
}

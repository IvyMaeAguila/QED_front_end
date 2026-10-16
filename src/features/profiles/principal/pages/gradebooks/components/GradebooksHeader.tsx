import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface GradebooksHeaderProps {
  loading?: boolean;
  schoolYear: string;
  textPrimary: string;
  textMuted: string;
}

export function GradebooksHeader({ loading = false, schoolYear, textPrimary, textMuted }: GradebooksHeaderProps) {
  return (
    <div>
      <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="gradebooksheader-gradebook" data-sk-static="">
        Gradebook
      </h1>
      <p className={`qed-type-page-description mt-2 ${textMuted}`} data-sk-region="gradebooksheader-select-a-grade-level-to-view-grades-middot-sc" data-sk-static="">
        Select a grade level to view grades &middot; School Year <LoadingRegion as="span" name="gradebook-school-year" loading={loading} variable skeleton={<SkeletonText width="10ch" />}>{schoolYear}</LoadingRegion>
      </p>
    </div>
  );
}

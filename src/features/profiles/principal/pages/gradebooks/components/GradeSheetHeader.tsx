import { BackButton } from "../../../../shared/components/DashboardUI";

interface GradeSheetHeaderProps {
  gradeLabel: string;
  sectionName: string | null;
  schoolYear: string;
  onBack: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
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
}: GradeSheetHeaderProps) {
  return (
    <div className="flex items-start gap-2.5">
      <BackButton onClick={onBack} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon">
          {gradeLabel}{sectionName ? ` · ${sectionName}` : ""}
        </p>
        <h1 className={`qed-type-page-title mt-1 ${textPrimary}`}>
          Grade Sheet
        </h1>
        <p className={`qed-type-page-description mt-1 ${textMuted}`}>School Year {schoolYear}</p>
      </div>
    </div>
  );
}

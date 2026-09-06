import { BackButton } from "../../../../shared/components/DashboardUI";

interface GradeSheetHeaderProps {
  gradeLabel: string;
  schoolYear: string;
  onBack: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function GradeSheetHeader({
  gradeLabel,
  schoolYear,
  onBack,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: GradeSheetHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={onBack} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
      <div>
        <h1 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${textPrimary}`}>
          {gradeLabel} — Grade Sheet
        </h1>
        <p className={`text-sm mt-1 ${textMuted}`}>School Year {schoolYear}</p>
      </div>
    </div>
  );
}

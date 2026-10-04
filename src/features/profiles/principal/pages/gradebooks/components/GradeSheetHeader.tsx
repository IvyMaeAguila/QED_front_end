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
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-maroon">
          {gradeLabel}{sectionName ? ` · ${sectionName}` : ""}
        </p>
        <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>
          Grade Sheet
        </h1>
        <p className={`mt-1 text-xs font-medium ${textMuted}`}>School Year {schoolYear}</p>
      </div>
    </div>
  );
}

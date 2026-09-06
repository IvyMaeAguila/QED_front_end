interface GradeSheetNotFoundProps {
  gradeLabel: string;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

export function GradeSheetNotFound({ gradeLabel, panelBg, panelBorder, textMuted }: GradeSheetNotFoundProps) {
  return (
    <div className={`rounded-2xl border ${panelBg} ${panelBorder} p-8 text-center shadow-card`}>
      <p className={`text-sm ${textMuted}`}>No grade records found for {gradeLabel}.</p>
    </div>
  );
}

interface GradebooksHeaderProps {
  schoolYear: string;
  textPrimary: string;
  textMuted: string;
}

export function GradebooksHeader({ schoolYear, textPrimary, textMuted }: GradebooksHeaderProps) {
  return (
    <div>
      <h1 className={`qed-type-page-title ${textPrimary}`}>
        Gradebook
      </h1>
      <p className={`qed-type-page-description mt-2 ${textMuted}`}>
        Select a grade level to view grades &middot; School Year {schoolYear}
      </p>
    </div>
  );
}

interface GradebooksHeaderProps {
  schoolYear: string;
  textPrimary: string;
  textMuted: string;
}

export function GradebooksHeader({ schoolYear, textPrimary, textMuted }: GradebooksHeaderProps) {
  return (
    <div>
      <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>
        Gradebook
      </h1>
      <p className={`text-sm mt-2 ${textMuted}`}>
        Select a grade level to view grades &middot; School Year {schoolYear}
      </p>
    </div>
  );
}

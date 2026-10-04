interface TeacherClassListHeaderProps {
  sectionCount: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function TeacherClassListHeader({
  sectionCount,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: TeacherClassListHeaderProps) {
  return (
    <header
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-card ${panelBg} ${panelBorder}`}
      aria-label="Class list summary"
    >
      <h2 className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
        Class list
      </h2>
      <span className={`text-[11px] font-medium ${textMuted}`}>
        {sectionCount} {sectionCount === 1 ? "section" : "sections"}
      </span>
    </header>
  );
}

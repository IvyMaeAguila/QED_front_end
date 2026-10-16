import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
interface TeacherClassListHeaderProps {
  sectionCount: number;
  loading?: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function TeacherClassListHeader({
  sectionCount,
  loading = false,
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
      <h2 className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="teacherclasslistheader-class-list" data-sk-static="">
        Class list
      </h2>
      <span className={`text-xs font-medium ${textMuted}`}>
        <LoadingRegion as="span" loading={loading} skeleton={<SkeletonText width="9ch" />}>{sectionCount} {sectionCount === 1 ? "section" : "sections"}</LoadingRegion>
      </span>
    </header>
  );
}


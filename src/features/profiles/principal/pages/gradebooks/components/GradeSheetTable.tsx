import type { Student } from "../data/types";
import { StudentGroupTable } from "./StudentGroupTable";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";

interface GradeSheetTableProps {
  sectionName: string;
  subjects: string[];
  males: Student[];
  females: Student[];
  rankedGroup?: { label: string; students: Student[] };
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  loading?: boolean;
  initialLoading?: boolean;
  view?: string;
}

export function GradeSheetTable({
  sectionName,
  subjects,
  males,
  females,
  rankedGroup,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  loading = false, initialLoading = false, view = "principal-grade-sheet",
}: GradeSheetTableProps) {
  return (
    <section aria-label="Class grades" className={`relative z-0 overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}>
        <p className={`qed-type-table-group flex min-w-0 items-center gap-1.5 uppercase ${textPrimary}`}>
          <LoadingRegion as="span" loading={initialLoading} variable name="grade-sheet-table-section" skeleton={<SkeletonParagraph field={`${view}-section`} width="14ch" inline />}><span data-sk-field={`${view}-section`}>{sectionName}</span></LoadingRegion>
        </p>
      </div>
      <StudentGroupTable
        loading={loading} view={view}
        groups={[
          ...(rankedGroup ? [rankedGroup] : []),
          ...(!rankedGroup && males.length > 0 ? [{ label: "Male" as const, students: males }] : []),
          ...(!rankedGroup && females.length > 0 ? [{ label: "Female" as const, students: females }] : []),
        ]}
        subjects={subjects}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </section>
  );
}

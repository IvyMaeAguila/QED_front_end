import type { Student } from "../data/types";
import { StudentGroupTable } from "./StudentGroupTable";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";

interface GradeSheetTableProps {
  sectionName: string;
  termLabel: string;
  totalStudents: number;
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
  termLoading?: boolean;
  view?: string;
}

export function GradeSheetTable({
  sectionName,
  termLabel,
  totalStudents,
  subjects,
  males,
  females,
  rankedGroup,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  loading = false, initialLoading = false, termLoading = false, view = "principal-grade-sheet",
}: GradeSheetTableProps) {
  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
      <div className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wide ${panelBorder} ${textPrimary}`}>
        <LoadingRegion as="span" loading={initialLoading} variable name="grade-sheet-table-section" skeleton={<SkeletonParagraph field={`${view}-section`} width="18ch" inline />}><span data-sk-field={`${view}-section`}>{sectionName}</span></LoadingRegion>{" "}<span className={textMuted}>· <LoadingRegion as="span" loading={termLoading} skeleton={<SkeletonText width="5ch" />}>{termLabel}</LoadingRegion> · <LoadingRegion as="span" loading={initialLoading} skeleton={<SkeletonText width="2ch" />}>{totalStudents}</LoadingRegion> students</span>
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

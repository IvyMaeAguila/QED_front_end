import type { ReactNode } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface AdvisoryHeaderProps {
  loading?: boolean;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  gradeLevel: string;
  sectionName: string;
  accentColor: string;
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  onBack: () => void;
  onExport: () => void;
  tabs?: ReactNode;
}

export function AdvisoryHeader({
  loading = false,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  gradeLevel,
  sectionName,
  accentColor,
  totalStudents,
  maleCount,
  femaleCount,
  onBack,
  onExport,
  tabs,
}: AdvisoryHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className={`system-back-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${panelBg} ${panelBorder} ${textMuted} ${
            darkMode ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5 hover:text-black"
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p
            className="text-xs font-extrabold uppercase tracking-[0.18em]"
            style={{ color: accentColor }}
          >
            <LoadingRegion as="span" name="advisory-section" loading={loading} variable skeleton={<SkeletonParagraph field="advisory-section" typical={2} />}><span data-sk-field="advisory-section">{gradeLevel} · Section {sectionName}</span></LoadingRegion>
          </p>
          <h1 className={`qed-type-page-title mt-1 ${textPrimary}`} data-sk-region="advisoryheader-class-roster" data-sk-static="">
            Class Roster
          </h1>
          <p className={`qed-type-page-description mt-1 ${textMuted}`}>
            <LoadingRegion as="span" name="advisory-counts" loading={loading} variable skeleton={<SkeletonText width="24ch" />}>{totalStudents} student{totalStudents === 1 ? "" : "s"} · {maleCount} male · {femaleCount} female</LoadingRegion>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tabs}
        <button
          type="button"
          onClick={onExport}
          disabled={loading || totalStudents === 0}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light disabled:opacity-40 ${
            darkMode ? "border-white/10" : "border-black/10"
          }`} data-sk-region="advisoryheader-export-to-excel" data-sk-static=""
        >
          <Download size={12} />
          Export to Excel
        </button>
      </div>
    </div>
  );
}

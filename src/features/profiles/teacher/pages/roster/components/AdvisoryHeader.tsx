import type { ReactNode } from "react";
import { ChevronLeft, Download } from "lucide-react";

interface AdvisoryHeaderProps {
  darkMode: boolean;
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
  darkMode,
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
          className={`mt-1 shrink-0 ${textMuted}`}
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: accentColor }}
          >
            {gradeLevel} · Section {sectionName}
          </p>
          <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>
            Class Roster
          </h1>
          <p className={`mt-1 text-xs font-medium ${textMuted}`}>
            {totalStudents} student{totalStudents === 1 ? "" : "s"} · {maleCount} male ·{" "}
            {femaleCount} female
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tabs}
        <button
          type="button"
          onClick={onExport}
          disabled={totalStudents === 0}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-40 ${
            darkMode ? "border-white/10" : "border-black/10"
          }`}
        >
          <Download size={12} />
          Export to Excel
        </button>
      </div>
    </div>
  );
}
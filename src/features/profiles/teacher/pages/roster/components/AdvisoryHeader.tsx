import { ArrowLeft, Download } from "lucide-react";

interface AdvisoryHeaderProps {
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
  gradeLevel: string;
  sectionName: string;
  accentColor: string;
  onBack: () => void;
  onExport: () => void;
}

export function AdvisoryHeader({
  darkMode,
  textPrimary,
  textMuted,
  gradeLevel,
  sectionName,
  accentColor,
  onBack,
  onExport,
}: AdvisoryHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to dashboard"
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
            darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-[#F6F7FB]"
          }`}
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: accentColor }}>
            Advisory class
          </p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>Class roster</h1>
          <p className={`mt-2 text-sm font-medium ${textMuted}`}>
            {gradeLevel} · Section {sectionName}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accentColor }}
      >
        <Download size={15} /> Export Excel
      </button>
    </div>
  );
}
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { Pencil } from "lucide-react";
import { ACCENT } from "../types/types";
import type { AcademicYear } from "../types/academicyear";
import { StatusBadge } from "./StatusBadge";

interface AcademicYearCardProps {
  loading?: boolean;
  academicYear: AcademicYear;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onEdit: () => void;
}

// "2026-08-01" -> "Aug 1, 2026" (parsed manually to avoid timezone shifts)
function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AcademicYearCard({
  loading = false,
  academicYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onEdit,
}: AcademicYearCardProps) {
  // ── Shared design tokens (same as StudentFormPage) ──
  const cardClasses = `rounded-[12px] border shadow-xs overflow-hidden ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-5 py-3 flex items-center justify-between border-b sm:px-6 ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;
  const labelClasses = `text-xs font-bold uppercase tracking-wide mb-1 ${textMuted}`;

  return (
    <section className={cardClasses}>
      <div className={cardHeaderClasses}>
        <h2 className={sectionTitleClasses} data-sk-region="academicyearcard-school-year-details" data-sk-static="">School Year Details</h2>
        <button
          disabled={loading}
          type="button"
          onClick={onEdit}
          className={`h-9 px-4 rounded-lg text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-border-subtle text-[#374151] hover:bg-brand-light"
          }`} data-sk-region="academicyearcard-change-academic-year" data-sk-static=""
        >
          <Pencil size={14} style={{ color: ACCENT }} />
          Change Academic Year
        </button>
      </div>

      <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <dt className={labelClasses} data-sk-region="academicyearcard-school-year" data-sk-static="">School Year</dt>
          <dd className={`text-lg font-black tracking-tight ${textPrimary}`}>
            <LoadingRegion loading={loading} variable skeleton={<SkeletonText width="9ch" />}>{academicYear.label}</LoadingRegion>
          </dd>
        </div>
        <div>
          <dt className={labelClasses} data-sk-region="academicyearcard-start-date" data-sk-static="">Start Date</dt>
          <dd className={`text-sm font-semibold leading-7 ${textPrimary}`}>
            <LoadingRegion loading={loading} variable skeleton={<SkeletonText width="12ch" />}>{formatDate(academicYear.startDate)}</LoadingRegion>
          </dd>
        </div>
        <div>
          <dt className={labelClasses} data-sk-region="academicyearcard-end-date" data-sk-static="">End Date</dt>
          <dd className={`text-sm font-semibold leading-7 ${textPrimary}`}>
            <LoadingRegion loading={loading} variable skeleton={<SkeletonText width="12ch" />}>{formatDate(academicYear.endDate)}</LoadingRegion>
          </dd>
        </div>
        <div>
          <dt className={labelClasses} data-sk-region="academicyearcard-status" data-sk-static="">Status</dt>
          <dd className="leading-7">
            <LoadingRegion loading={loading} skeleton={<StatusBadge status={academicYear.status} darkMode={darkMode} loading />}><StatusBadge status={academicYear.status} darkMode={darkMode} /></LoadingRegion>
          </dd>
        </div>
      </dl>
    </section>
  );
}

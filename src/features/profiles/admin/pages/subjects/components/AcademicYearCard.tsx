import { CalendarDays, Pencil } from "lucide-react";
import { ACCENT } from "../types/types";
import type { AcademicYear } from "../types/academicyear";
import { StatusBadge } from "./StatusBadge";

interface AcademicYearCardProps {
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
  academicYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onEdit,
}: AcademicYearCardProps) {
  // ── Shared design tokens (same as StudentFormPage) ──
  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;
  const labelClasses = `text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  return (
    <section className={cardClasses}>
      <div className={cardHeaderClasses}>
        <h2 className={sectionTitleClasses}>
          <CalendarDays size={15} style={{ color: ACCENT }} />
          School Year Details
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className={`h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          <Pencil size={14} style={{ color: ACCENT }} />
          Change Academic Year
        </button>
      </div>

      <dl className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className={labelClasses}>School Year</dt>
          <dd className={`text-lg font-black tracking-tight ${textPrimary}`}>
            {academicYear.label}
          </dd>
        </div>
        <div>
          <dt className={labelClasses}>Start Date</dt>
          <dd className={`text-sm font-semibold leading-7 ${textPrimary}`}>
            {formatDate(academicYear.startDate)}
          </dd>
        </div>
        <div>
          <dt className={labelClasses}>End Date</dt>
          <dd className={`text-sm font-semibold leading-7 ${textPrimary}`}>
            {formatDate(academicYear.endDate)}
          </dd>
        </div>
        <div>
          <dt className={labelClasses}>Status</dt>
          <dd className="leading-7">
            <StatusBadge status={academicYear.status} darkMode={darkMode} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
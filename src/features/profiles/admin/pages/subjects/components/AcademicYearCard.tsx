import { Pencil } from "lucide-react";
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

export function AcademicYearCard({
  academicYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onEdit,
}: AcademicYearCardProps) {
  const dateRange =
    academicYear.startDate && academicYear.endDate
      ? `${academicYear.startDate} — ${academicYear.endDate}`
      : "No term dates set yet";

  return (
    <div className={`rounded-2xl border shadow-sm p-6 ${panelBg} ${panelBorder}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>
            Academic Year
          </p>
          <h2 className={`text-2xl font-black mt-1 ${textPrimary}`}>
            {academicYear.label}
          </h2>
          <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
            {dateRange}
          </p>
          <div className="mt-3">
            <StatusBadge status={academicYear.status} darkMode={darkMode} />
          </div>
        </div>

        <button
          onClick={onEdit}
          className={`h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          <Pencil size={14} style={{ color: ACCENT }} />
          Edit Academic Year
        </button>
      </div>
    </div>
  );
}
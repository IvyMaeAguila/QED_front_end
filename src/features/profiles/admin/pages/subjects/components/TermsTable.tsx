import { Pencil } from "lucide-react";
import { ACCENT } from "../types/types";
import type { Term } from "../types/academicyear";
import { StatusBadge } from "./StatusBadge";

interface TermsTableProps {
  terms: Term[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onEdit: () => void;
}

export function TermsTable({
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onEdit,
}: TermsTableProps) {
  const headerCell = `text-left text-xs font-bold uppercase tracking-wide px-4 py-3 ${textMuted}`;
  const rowBorder = darkMode ? "border-[#1F2937]" : "border-[#E5E7EB]";

  return (
    <div className={`rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap px-6 pt-5">
        <h3 className={`text-sm font-black ${textPrimary}`}>Terms</h3>
        <button
          onClick={onEdit}
          className={`h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          <Pencil size={14} style={{ color: ACCENT }} />
          Edit Term Dates
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={headerCell}>Term</th>
              <th className={headerCell}>Start Date</th>
              <th className={headerCell}>End Date</th>
              <th className={headerCell}>Status</th>
            </tr>
          </thead>
          <tbody>
            {terms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <p className={`text-sm font-semibold ${textMuted}`}>
                    No term dates set yet.
                  </p>
                  <p className={`text-xs font-medium mt-1 ${textMuted}`}>
                    Use "Edit Term Dates" to add Term 1, Term 2, and Term 3.
                  </p>
                </td>
              </tr>
            ) : (
              terms.map((term) => (
                <tr key={term.id} className={`border-b last:border-b-0 ${rowBorder}`}>
                  <td className={`px-4 py-3 text-sm font-bold ${textPrimary}`}>
                    {term.name}
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${textMuted}`}>
                    {term.startDate}
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${textMuted}`}>
                    {term.endDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={term.status} darkMode={darkMode} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="h-5" />
    </div>
  );
}
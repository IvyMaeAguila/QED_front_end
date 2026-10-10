import { LoadingTable } from "@shared/loading/LoadingTable";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { skeletonRows } from "@shared/loading/reservations";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { Pencil } from "lucide-react";
import { ACCENT } from "../types/types";
import type { Term } from "../types/academicyear";
import { StatusBadge } from "./StatusBadge";

interface TermsTableProps {
  loading?: boolean; view?: string;
  terms: Term[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onEdit: () => void;
}

function formatCell(value: string | null): string {
  return value && value.trim() !== "" ? value : "";
}

export function TermsTable({
  loading = false, view = "admin/academic-year/terms",
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onEdit,
}: TermsTableProps) {
  const headerCell = `text-left text-xs font-bold uppercase tracking-wide px-4 py-2.5 ${textMuted}`;
  const rowBorder = darkMode ? "border-[#1F2937]" : "border-border-subtle";

  // Terms exist as rows even before they're configured (seeded with null
  // dates), so "no rows at all" only happens if fetchTerms genuinely
  // returned nothing.
  const hasUnconfiguredTerms = terms.some(
    (t) => !t.name || !t.startDate || !t.endDate,
  );

  const columns = [{label:"Term",typical:"First Grading Period"},{label:"Start Date",typical:"2026-10-08"},{label:"End Date",typical:"2027-03-31"},{label:"Status",typical:"Upcoming"}];
  function renderRows(pending: boolean) {
    const items: Term[] = pending ? Array.from({length:skeletonRows(view)}, (_, index) => ({id:index,termNumber:index+1,name:null,startDate:null,endDate:null,status:"Upcoming"})) : terms;
    return (<>
            {!pending && terms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <p className={`text-sm font-semibold ${textMuted}`} data-sk-region="termstable-no-term-dates-set-yet-" data-sk-static="">
                    No term dates set yet.
                  </p>
                  <p className={`text-xs font-medium mt-1 ${textMuted}`} data-sk-region="termstable-use-edit-term-dates-to-add-term-1-term-2-and-" data-sk-static="">
                    Use "Edit Term Dates" to add Term 1, Term 2, and Term 3.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((term) => (
                <tr key={term.id} className={`border-b last:border-b-0 ${rowBorder}`}>
                  <td className={`px-4 py-2.5 text-sm font-bold ${textPrimary}`} data-sk-region="termstable-td-field-1">
                    {pending ? <><SkeletonText width="92%" /><SkeletonText width="64%" /></> : formatCell(term.name)}
                  </td>
                  <td className={`px-4 py-2.5 text-sm font-semibold ${textMuted}`} data-sk-region="termstable-td-field-2">
                    {pending ? <SkeletonText width="10ch" /> : formatCell(term.startDate)}
                  </td>
                  <td className={`px-4 py-2.5 text-sm font-semibold ${textMuted}`} data-sk-region="termstable-td-field-3">
                    {pending ? <SkeletonText width="10ch" /> : formatCell(term.endDate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge loading={pending} status={term.status} darkMode={darkMode} />
                  </td>
                </tr>
              ))
            )}
    </>);
  }

  return (
    <div className={`rounded-[12px] border shadow-sm ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap px-5 pt-3 sm:px-6">
        <h3 className={`text-sm font-black ${textPrimary}`} data-sk-region="termstable-terms" data-sk-static="">Terms</h3>
        <button
          disabled={loading}
          onClick={onEdit}
          className={`h-9 px-4 rounded-lg text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-border-subtle text-[#374151] hover:bg-brand-light"
          }`} data-sk-region="termstable-edit-term-dates" data-sk-static=""
        >
          <Pencil size={14} style={{ color: ACCENT }} />
          Edit Term Dates
        </button>
      </div>

      <LoadingRegion loading={loading} variable skeleton={<p className={`px-6 mt-2 text-xs font-medium ${textMuted}`}><SkeletonText width="92%" /><SkeletonText width="64%" /></p>}>      {hasUnconfiguredTerms && terms.length > 0 && (
        <p className={`px-6 mt-2 text-xs font-medium ${textMuted}`} data-sk-region="termstable-some-terms-don-t-have-dates-yet-use-edit-term" data-sk-static="">
          Some terms don't have dates yet. Use "Edit Term Dates" to configure
          them.
        </p>
      )}</LoadingRegion>

      <div className="mt-3 overflow-x-auto">
        <LoadingTable loading={loading} view={view} columns={columns} header={<thead>
            <tr className={`border-b ${rowBorder}`}>
              {columns.map(column => <th key={column.label} className={headerCell}>{column.label}</th>)}
            </tr>
          </thead>} skeleton={renderRows(true)} count={terms.length} className="teacher-user-table w-full border-collapse">{renderRows(false)}</LoadingTable>
      </div>
    </div>
  );
}

import { LoadingTable } from "@shared/loading/LoadingTable";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows } from "@shared/loading/reservations";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { ClipboardList } from "lucide-react";
import { TERMS, TERM_SHORT_LABELS, type PeriodicRatingRow, type TermAverageEntry } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface PeriodicRatingCardProps {
  rows: PeriodicRatingRow[];
  loading?: boolean;
  termAverages: TermAverageEntry[];
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function PeriodicRatingCard({ rows, termAverages, theme, student, loading = false }: PeriodicRatingCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const view = `parent-periodic:${student.id}`;
  const renderRow = (row:PeriodicRatingRow,index:number,pending:boolean) => (
              <tr key={row.learningArea} className={`border-t ${panelBorder}`}>
                <td className={`px-3 py-2.5 text-sm font-semibold ${textPrimary}`}>{pending ? <SkeletonParagraph field={view+":area:"+index} typical={2} width="100%" /> : <span data-sk-field={view+":area:"+index}>{row.learningArea}</span>}</td>
                {TERMS.map((t) => {
                  const score = row.scores[t];
                  const isLow = typeof score === "number" && score < 85;
                  return (
                    <td
                      key={t}
                      className={`px-3 py-2.5 text-center text-sm font-bold ${
                        score === undefined ? textMuted : isLow ? "text-red-500" : textPrimary
                      }`}
                    >
                      {pending ? <SkeletonText width="3ch" /> : score ?? ""}
                    </td>
                  );
                })}
                <td className={`px-3 py-2.5 text-sm ${textMuted}`}>{pending ? <SkeletonParagraph field={view+":rating:"+index} typical={2} width="100%" /> : <span data-sk-field={view+":rating:"+index}>{row.finalRating}</span>}</td>
              </tr>
  );
  return (
    <div className={`flex-[2] rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <SectionHeader
        icon={ClipboardList}
        title="Periodic Rating"
        about={`Provides a comprehensive overview of ${student.firstName}'s performance across all terms for the selected term.`}
        theme={theme}
      />

      <div className="mt-4 overflow-x-auto">
        <LoadingTable name="parent-periodic-table" view={view} loading={loading} count={rows.length} columns={[{label:"Learning Areas",typical:"Mathematics"},...TERMS.map(t=>({label:TERM_SHORT_LABELS[t],typical:"100%"})),{label:"Final Rating",typical:"Satisfactory"}]} className="teacher-user-table w-full min-w-[420px] border-collapse text-sm" header={(pending)=><><thead>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${textMuted}`}>
                Learning Areas
              </th>
              {TERMS.map((t) => (
                <th key={t} className={`px-3 py-2 text-center text-xs font-semibold uppercase ${textMuted}`}>
                  {TERM_SHORT_LABELS[t]}
                </th>
              ))}
              <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${textMuted}`}>
                Final Rating
              </th>
            </tr>
          </thead><tfoot>
            <tr className={`border-t-2 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-brand-light"}`}>
              <td className={`px-3 py-2.5 text-sm font-bold uppercase ${textPrimary}`}>
                Term Average
              </td>
              {TERMS.map((t) => {
                const entry = termAverages.find((e) => e.term === t);
                const avg = entry?.average;
                return (
                  <td
                    key={t}
                    className={`px-3 py-2.5 text-center text-sm font-bold ${
                      avg === null || avg === undefined ? textMuted : textPrimary
                    }`}
                  >
                    {pending ? <SkeletonText width="4ch" /> : avg !== null && avg !== undefined ? `${avg}%` : ""}
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot></>} skeleton={Array.from({length:skeletonRows(view)},(_,i)=>renderRow({learningArea:String(i),scores:{},finalRating:""},i,true))}>{rows.map((row,i)=>renderRow(row,i,false))}</LoadingTable> </div>
    </div>
  );
}
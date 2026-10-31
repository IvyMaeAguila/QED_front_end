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
  const renderRow = (row:PeriodicRatingRow,index:number,pending:boolean) => {
    const components = pending || row.parentLearningArea ? [] : rows.filter(child => child.parentLearningArea === row.learningArea);
    if (components.length > 0) {
      const group = [row, ...components];
      return <tr key={row.learningArea} className={`border-t ${panelBorder}`} data-learning-area-group={row.learningArea}>
        <td className={`!p-0 align-top text-sm ${textPrimary}`}>
          {group.map((entry, position) => <div key={entry.learningArea} className={`flex h-12 sm:h-9 items-center py-1 pr-3 ${position === 0 ? "pl-3 font-semibold" : "pl-7 font-normal"}`}>
            <span>{entry.learningArea}</span>
          </div>)}
        </td>
        {TERMS.map(term => <td key={term} className="!p-0 align-top text-center text-sm">
          {group.map((entry,position) => <div key={entry.learningArea} data-grade-for={entry.learningArea} data-term={term} className={`flex h-12 sm:h-9 items-center justify-center px-3 py-1 ${position > 0 ? `border-t ${panelBorder}` : ""} ${position === 0 ? "font-bold" : "font-medium"} ${entry.scores[term] === undefined ? textMuted : entry.scores[term]! < 85 ? "text-red-500" : textPrimary}`}>
            {entry.scores[term] ?? ""}
          </div>)}
        </td>)}
        <td className={`!p-0 align-top text-sm ${textMuted}`}>
          {group.map((entry,position) => <div key={entry.learningArea} data-final-for={entry.learningArea} className={`flex h-12 sm:h-9 items-center px-3 py-1 ${position > 0 ? `border-t ${panelBorder}` : ""} ${position === 0 ? "font-semibold" : ""}`}>{entry.finalRating}</div>)}
        </td>
      </tr>;
    }
    return (
              <tr key={`${row.parentLearningArea ?? ""}:${row.learningArea}`} className={`border-t ${panelBorder}`}>
                <td className={`px-3 py-2.5 text-sm font-semibold ${textPrimary}`}>
                  {pending ? <SkeletonParagraph field={view+":area:"+index} typical={2} width="100%" /> : <span data-sk-field={view+":area:"+index}>{row.learningArea}</span>}
                </td>
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
  };
  return (
    <div className={`flex-[2] rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <SectionHeader
        icon={ClipboardList}
        title="Periodic Rating"
        about={`Provides a comprehensive overview of ${student.firstName}'s performance across all terms for the selected term.`}
        theme={theme}
      />

      <div className="mt-4 overflow-x-auto">
        <LoadingTable name="parent-periodic-table" view={view} loading={loading} count={rows.filter(row => !row.parentLearningArea).length} columns={[{label:"Learning Areas",typical:"Physical Education and Health"},...TERMS.map(t=>({label:TERM_SHORT_LABELS[t],typical:"100%"})),{label:"Final Rating",typical:"Satisfactory"}]} className="teacher-user-table w-full min-w-[560px] border-collapse text-sm" header={(pending)=><><thead>
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
          </tfoot></>} skeleton={Array.from({length:skeletonRows(view)},(_,i)=>renderRow({learningArea:String(i),scores:{},finalRating:""},i,true))}>{rows.filter(row => !row.parentLearningArea).map((row,i)=>renderRow(row,i,false))}</LoadingTable> </div>
    </div>
  );
}
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { useState } from "react";
import { Crown } from "lucide-react";
import { SectionCard, ProgressBar, Dropdown } from "../../../../shared/components/DashboardUI";
import type { FilteredSubjectRank, Term } from "../data/types";
import { getMedalStyle } from "../utils/medalStyles";

interface PerGradeRankingProps {
  loading?: boolean;
  view?: string;
  term: Term;
  gradeFilter: string;
  gradeOptions: string[];
  onGradeFilterChange: (grade: string) => void;
  ranking: FilteredSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function PerGradeRanking({
  term,
  gradeFilter,
  gradeOptions,
  onGradeFilterChange,
  ranking: loadedRanking,
  loading = false,
  view = "per-grade-ranking",
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: PerGradeRankingProps) {
  const [showFullRanking, setShowFullRanking] = useState(false);
  const renderBody = (pending: boolean) => {
    const ranking = pending ? Array.from({ length: skeletonRows(view, undefined, 64) }, (_, index) => ({ subject: `pending-${index}`, grade: "", score: 52 + index * 7, trend: "flat" as const, gradeCount: 0, rank: index + 1 })) : loadedRanking;
    const podiumItems = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
    const visibleRows = showFullRanking ? ranking : ranking.slice(0, 3);
    return (<>      {ranking.length > 0 && (
        <div className={`mb-5 overflow-hidden rounded-xl border ${panelBorder} ${darkMode ? "bg-[#171315]" : "bg-[#FAF6F5]"}`}>
          <div className="px-4 pb-4 pt-3">
            <p className={`text-xs font-bold uppercase tracking-[0.15em] ${textMuted}`} data-sk-region="pergraderanking-top-three" data-sk-static="">Top three</p>
            <div className="grid h-[190px] grid-cols-3 items-end gap-2 pt-2 sm:gap-4" data-sk-region="pergraderanking-div-field-1">
              {podiumItems.map((item) => {
                const podium = item.rank === 1
                  ? { height: "h-[88px]", background: "#DEC77F", text: "#5A4816" }
                  : item.rank === 2
                    ? { height: "h-[68px]", background: "#C9CFD4", text: "#4D5660" }
                    : { height: "h-[54px]", background: "#CF9C7D", text: "#63402D" };
                return (
                  <div key={`${item.subject}-${item.grade}`} className="flex h-full min-w-0 flex-col items-center justify-end text-center">
                    <div className="flex h-5 items-center justify-center">
                      {item.rank === 1 && <Crown size={14} className="text-maroon" aria-label="First place" />}
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${textPrimary}`} data-sk-region="pergraderanking-span-field-2">{pending ? <SkeletonText width="4ch" /> : `${item.score}%`}</span>
                    <p className={`mt-0.5 w-full truncate text-xs font-semibold ${textPrimary}`} title={pending ? undefined : `${item.subject} · ${item.grade}`} data-sk-region="pergraderanking-p-field-3">{pending ? <SkeletonText width="70%" /> : item.subject}</p>
                    <p className={`mb-1 text-xs ${textMuted}`} data-sk-region="pergraderanking-p-field-4">{pending ? <SkeletonParagraph field={`${view}:podium-${item.rank}:grade`} typical={1} width="8ch" /> : item.grade}</p>
                    <div className={`flex w-full items-center justify-center rounded-t-md border-x border-t text-lg font-bold shadow-inner ${podium.height}`} style={{ background: podium.background, color: podium.text, borderColor: "rgba(75,50,20,0.28)" }}>
                      {item.rank}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {ranking.length === 0 ? (
        <p className={`py-6 text-center text-sm ${textMuted}`} data-sk-region="pergraderanking-no-data-for-this-filter-" data-sk-static="">No data for this filter.</p>
      ) : (
        <>
          <ol className={`overflow-hidden rounded-xl border ${panelBorder}`} data-sk-region="pergraderanking-ol-field-5">
            {visibleRows.map((item, index) => (
              <li data-sk-region="per-grade-ranking-row" key={`${item.subject}-${item.grade}`} className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3 ${index > 0 ? `border-t ${panelBorder}` : ""}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${item.rank > 3 ? (darkMode ? "bg-white/10 text-white/75" : "bg-brand-light text-[#606875]") : "shadow-sm"}`} style={getMedalStyle(item.rank)}>
                  {item.rank}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <p className={`truncate text-xs font-semibold ${textPrimary}`} data-sk-region="pergraderanking-p-field-6">{pending ? <SkeletonText width={`${78 - index * 8}%`} /> : item.subject}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${darkMode ? "bg-white/10" : "bg-brand-light"} ${textMuted}`} data-sk-region="pergraderanking-span-field-7">{pending ? <SkeletonText width="6ch" /> : item.grade}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                <div className="col-start-2 col-end-4" data-sk-region="pergraderanking-div-field-8">
                  {pending ? <Skeleton className="h-1.5 w-full rounded-full" /> : <ProgressBar value={item.score} darkMode={darkMode} />}
                </div>
              </li>
            ))}
          </ol>
          {ranking.length > 3 && (
            <div className="mt-3 text-center">
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowFullRanking((value) => !value)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${panelBorder} ${darkMode ? "text-border-border-subtle hover:bg-white/5" : "text-maroon hover:bg-[#F8F1F1]"}`} data-sk-region="pergraderanking-button-field-9"
              >
                {pending ? <SkeletonText width="18ch" /> : showFullRanking ? "Show top three" : `View full ranking · ${ranking.length}`}
              </button>
            </div>
          )}
        </>
      )}</>);
  };

  return (
    <SectionCard
      title="Per Grade Level Ranking"
      compact
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
      action={
        <Dropdown
          value={gradeFilter}
          onChange={onGradeFilterChange}
          options={gradeOptions.length ? gradeOptions : [gradeFilter]}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          compact
        />
      }
    >
      <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
        {gradeFilter === "All Grades" ? "All subject-grade combinations" : `Subjects ranked for ${gradeFilter}`} &middot; {term}
      </p>

      <LoadingRegion loading={loading} variable name="per-grade-ranking-body" retainPrevious hasContent={loadedRanking.length > 0} skeleton={null} frame={renderBody} onSettled={() => rememberRows(view, loadedRanking.length)}>{renderBody(false)}</LoadingRegion>
    </SectionCard>
  );
}

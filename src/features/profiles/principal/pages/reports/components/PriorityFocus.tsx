import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { ProgressBar } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank, Term } from "../data/types";

interface PriorityFocusProps {
  loading?: boolean;
  view?: string;
  term: Term;
  items: AggregatedSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

const TREND_LABEL: Record<AggregatedSubjectRank["trend"], string> = {
  up: "Improving",
  down: "Declining",
  flat: "Stable",
};

export function PriorityFocus({ term, items: loadedItems, loading = false, view = "priority-focus", panelBg, panelBorder, textPrimary, textMuted, darkMode }: PriorityFocusProps) {
  const render = (pending: boolean) => {
  const items = pending ? (Array.from({ length: skeletonRows(view, undefined, 64) }, (_, index) => ({ subject: `pending-${index}`, grade: "", score: 52 + index * 7, trend: "flat" as const, gradeCount: 0, rank: index + 1 }))).slice(0, 3) : loadedItems;
  const [highestPriority, ...otherPriorities] = items;

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-labelledby="priority-focus-title">
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div>
          <h2 id="priority-focus-title" className={`text-sm font-bold ${textPrimary}`} data-sk-region="priorityfocus-priority-focus" data-sk-static="">Priority Focus</h2>
          <p className={`mt-0.5 text-xs ${textMuted}`}>Lowest subject averages · {term}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${darkMode ? "bg-white/10 text-white/80" : "bg-brand-light text-[#555E69]"}`} data-sk-region="priorityfocus-span-field-1">
          {pending ? <SkeletonText width="20ch" /> : items.length === 0 ? "No subjects flagged" : `${items.length} ${items.length === 1 ? "subject" : "subjects"} need attention`}
        </span>
      </header>

      <div className="space-y-3 p-4 sm:p-5" data-sk-region="priorityfocus-div-field-2">
        {!highestPriority ? (
          <p className={`py-6 text-center text-sm ${textMuted}`} data-sk-region="priorityfocus-no-subject-scores-are-available-for-this-term" data-sk-static="">No subject scores are available for this term.</p>
        ) : (
          <>
            <article className="sk-surface-brand grid gap-5 rounded-xl bg-maroon p-4 text-white sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)] sm:items-center sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-white/75" data-sk-region="priorityfocus-highest-priority" data-sk-static="">Highest priority</p>
                <h3 className="mt-1 truncate text-lg font-bold" title={pending ? undefined : highestPriority.subject} data-sk-region="priorityfocus-h3-field-3">{pending ? <SkeletonText width="65%" /> : highestPriority.subject}</h3>
                <p className="mt-2 text-xs text-white/75" data-sk-region="priorityfocus-p-field-4">
                  {pending ? <SkeletonParagraph field={`${view}:priority-metadata`} /> : <>{highestPriority.gradeCount} {highestPriority.gradeCount === 1 ? "grade level" : "grade levels"}<span className="mx-1.5">·</span>{TREND_LABEL[highestPriority.trend]}</>}
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold leading-none tabular-nums" data-sk-region="priorityfocus-span-field-5">{pending ? <SkeletonText width="4ch" /> : `${highestPriority.score}%`}</span>
                  <span className="text-xs text-white/75" data-sk-region="priorityfocus-average-score" data-sk-static="">average score</span>
                </div>
                <div data-sk-region="priority-score-track" className="sk-surface-brand-track h-2 overflow-hidden rounded-full bg-white/20">
                  {pending ? <Skeleton className="h-full rounded-full" width="65%" /> : <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, highestPriority.score))}%` }} />}
                </div>
              </div>
            </article>

            {otherPriorities.length > 0 && (
              <div className="flex flex-col gap-2" data-sk-region="priorityfocus-div-field-7">
                {otherPriorities.map((item, index) => (
                  <article key={item.subject} className={`grid grid-cols-[28px_minmax(0,1fr)_minmax(70px,0.7fr)_auto] items-center gap-3 rounded-lg border px-3.5 py-3 ${panelBorder}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${darkMode ? "bg-white/10 text-white/80" : "bg-brand-light text-[#59616B]"}`}>
                      {index + 2}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${textPrimary}`} data-sk-region="priorityfocus-p-field-8">{pending ? <SkeletonText width={`${78 - index * 10}%`} /> : item.subject}</p>
                      <p className={`mt-0.5 text-xs ${textMuted}`} data-sk-region="priorityfocus-p-field-9">
                        {pending ? <SkeletonParagraph field={`${view}:other-${index}:metadata`} /> : `${item.gradeCount} ${item.gradeCount === 1 ? "grade level" : "grade levels"} · ${TREND_LABEL[item.trend]}`}
                      </p>
                    </div>
                    <div className="hidden sm:block" data-sk-region="priorityfocus-div-field-10">
                      {pending ? <Skeleton className="h-1.5 w-full rounded-full" /> : <ProgressBar value={item.score} darkMode={darkMode} />}
                    </div>
                    <span className="text-sm font-bold tabular-nums text-maroon" data-sk-region="priorityfocus-span-field-11">{pending ? <SkeletonText width="4ch" /> : `${item.score}%`}</span>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
  };
  return <LoadingRegion loading={loading} variable name="priority-focus" retainPrevious hasContent={loadedItems.length > 0} skeleton={null} frame={render} onSettled={() => rememberRows(view, loadedItems.length)}>{render(false)}</LoadingRegion>;
}

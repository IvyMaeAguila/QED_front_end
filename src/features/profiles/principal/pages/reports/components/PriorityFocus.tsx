import { ProgressBar } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank, Term } from "../data/types";

interface PriorityFocusProps {
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

export function PriorityFocus({ term, items, panelBg, panelBorder, textPrimary, textMuted, darkMode }: PriorityFocusProps) {
  const [highestPriority, ...otherPriorities] = items;

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-labelledby="priority-focus-title">
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div>
          <h2 id="priority-focus-title" className={`text-sm font-bold ${textPrimary}`}>Priority Focus</h2>
          <p className={`mt-0.5 text-xs ${textMuted}`}>Lowest subject averages · {term}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${darkMode ? "bg-white/10 text-white/80" : "bg-[#F1F2F4] text-[#555E69]"}`}>
          {items.length === 0 ? "No subjects flagged" : `${items.length} ${items.length === 1 ? "subject" : "subjects"} need attention`}
        </span>
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        {!highestPriority ? (
          <p className={`py-6 text-center text-sm ${textMuted}`}>No subject scores are available for this term.</p>
        ) : (
          <>
            <article className="grid gap-5 rounded-xl bg-[#6B0000] p-4 text-white sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)] sm:items-center sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Highest priority</p>
                <h3 className="mt-1 truncate text-lg font-bold" title={highestPriority.subject}>{highestPriority.subject}</h3>
                <p className="mt-2 text-xs text-white/75">
                  {highestPriority.gradeCount} {highestPriority.gradeCount === 1 ? "grade level" : "grade levels"}
                  <span className="mx-1.5">·</span>{TREND_LABEL[highestPriority.trend]}
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold leading-none tabular-nums">{highestPriority.score}%</span>
                  <span className="text-xs text-white/75">average score</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, highestPriority.score))}%` }} />
                </div>
              </div>
            </article>

            {otherPriorities.length > 0 && (
              <div className="flex flex-col gap-2">
                {otherPriorities.map((item, index) => (
                  <article key={item.subject} className={`grid grid-cols-[28px_minmax(0,1fr)_minmax(70px,0.7fr)_auto] items-center gap-3 rounded-lg border px-3.5 py-3 ${panelBorder}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold ${darkMode ? "bg-white/10 text-white/80" : "bg-[#F1F2F4] text-[#59616B]"}`}>
                      {index + 2}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${textPrimary}`}>{item.subject}</p>
                      <p className={`mt-0.5 text-[11px] ${textMuted}`}>
                        {item.gradeCount} {item.gradeCount === 1 ? "grade level" : "grade levels"} · {TREND_LABEL[item.trend]}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <ProgressBar value={item.score} darkMode={darkMode} />
                    </div>
                    <span className="text-sm font-bold tabular-nums text-maroon">{item.score}%</span>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

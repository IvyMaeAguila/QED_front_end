import { AccountSelect } from "@shared/components/AccountSelect";
import { Skeleton, SkeletonText, SkeletonAvatar } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { Trophy, Maximize2 } from "lucide-react";
import { SectionCard, TrendChip, ProgressBar, RankBadge } from "../../../../shared/components/DashboardUI";
import type { SubjectRankingItem, Term, TopSubjectPerGrade } from "../data/types";

interface SubjectPerformanceSectionProps {
  loading?: boolean;
  topSubjectPerGrade: TopSubjectPerGrade[];
  ranking: SubjectRankingItem[];
  rankingTerm: Term;
  onRankingTermChange: (term: Term) => void;
  onExpandRanking?: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function SubjectPerformanceSection({
  topSubjectPerGrade,
  ranking,
  rankingTerm,
  onRankingTermChange,
  onExpandRanking,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  loading = false,
}: SubjectPerformanceSectionProps) {
  return (
    <SectionCard title="Subject Performance" icon={Trophy} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <p className={`mb-5 text-sm font-semibold ${textMuted}`}>Highest performing subject per grade level</p>
      <div
        className="mb-8 grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))" }}
      >
        {topSubjectPerGrade.length === 0 ? (
          <p className={`sm:col-span-2 xl:col-span-3 rounded-xl border border-dashed px-4 py-6 text-center text-sm ${panelBorder} ${textMuted}`}>
            Subject performance will appear when grades are available.
          </p>
        ) : topSubjectPerGrade.map((item, index) => (
          <div key={item.grade || index} data-sk-region="principal-top-subject" data-sk-variable="" className={`flex flex-col gap-4 rounded-xl border p-5 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${textMuted}`}>{loading ? <SkeletonText width="8ch" /> : item.grade}</span>
              {loading ? <SkeletonAvatar className="h-6 w-6" /> : <TrendChip trend={item.trend} darkMode={darkMode} />}
            </div>
            <p data-sk-field={`principal-top-subject-${index}`} className={`text-sm font-bold ${textPrimary}`}>{loading ? <SkeletonParagraph field={`principal-top-subject-${index}`} typical={2} width="100%" /> : item.subject}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {loading ? <Skeleton className="h-1.5 w-full rounded-full" /> : <ProgressBar value={item.score} darkMode={darkMode} />}
              </div>
              <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>{loading ? <SkeletonText width="4ch" className="inline-block align-top" /> : `${item.score}%`}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8" style={{ borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` }}>
        <div className="flex items-center justify-between mb-5">
          <p className={`text-sm font-semibold ${textMuted}`}>School-wide subject ranking</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <AccountSelect data-account-select=""
                value={rankingTerm}
                onChange={(e) => onRankingTermChange(e.target.value as Term)}
                className={`appearance-none rounded-lg border py-2.5 pl-4 pr-9 text-sm font-medium ${panelBg} ${panelBorder} ${textPrimary} shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 cursor-pointer`}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </AccountSelect>
            </div>
            <button
              onClick={onExpandRanking} disabled={loading}
              className={`h-9 w-9 rounded-full flex items-center justify-center border ${panelBorder} ${textMuted} hover:text-white hover:bg-maroon hover:border-maroon transition-colors`}
              aria-label="Expand ranking"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {ranking.length === 0 ? (
            <p className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${panelBorder} ${textMuted}`}>
              There are no subject rankings for this term yet.
            </p>
          ) : ranking.map((item) => (
            <div
              key={item.rank} data-sk-region="principal-ranking-row" data-sk-variable=""
              className="flex items-center gap-5 rounded-2xl px-5 py-4"
              style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "#F7F7F8" }}
            >
              <RankBadge loading={loading} rank={item.rank} darkMode={darkMode} />
              <div className="flex-1 min-w-0">
                <p data-sk-field={`principal-ranking-subject-${item.rank}`} className={`text-sm font-bold ${textPrimary}`}>{loading ? <SkeletonParagraph field={`principal-ranking-subject-${item.rank}`} typical={2} width="100%" /> : item.subject}</p>
                <p className={`text-xs mt-0.5 ${textMuted}`}>{loading ? <SkeletonText width="8ch" /> : item.grade}</p>
              </div>
              <div className="w-32 hidden sm:block">
                {loading ? <Skeleton className="h-1.5 w-full rounded-full" /> : <ProgressBar value={item.score} darkMode={darkMode} />}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-bold tabular-nums ${textPrimary}`}>{loading ? <SkeletonText width="4ch" className="inline-block align-top" /> : `${item.score}%`}</span>
                {loading ? <SkeletonAvatar className="h-6 w-6" /> : <TrendChip trend={item.trend} darkMode={darkMode} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

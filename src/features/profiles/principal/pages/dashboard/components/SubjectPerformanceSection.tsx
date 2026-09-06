import { ChevronDown, Trophy, Maximize2 } from "lucide-react";
import { SectionCard, TrendChip, ProgressBar, RankBadge } from "../../../../shared/components/DashboardUI";
import type { SubjectRankingItem, Term, TopSubjectPerGrade } from "../data/types";

interface SubjectPerformanceSectionProps {
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
}: SubjectPerformanceSectionProps) {
  return (
    <SectionCard title="Subject Performance" icon={Trophy} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${textMuted}`}>Highest Performing Subject per Grade Level</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
        {topSubjectPerGrade.map((item) => (
          <div key={item.grade} className={`rounded-2xl p-5 flex flex-col gap-4 ${darkMode ? "glass-dark" : "glass"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${textMuted}`}>{item.grade}</span>
              <TrendChip trend={item.trend} darkMode={darkMode} />
            </div>
            <p className={`text-sm font-bold ${textPrimary}`}>{item.subject}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={item.score} darkMode={darkMode} />
              </div>
              <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8" style={{ borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` }}>
        <div className="flex items-center justify-between mb-5">
          <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>School-wide Subject Ranking</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={rankingTerm}
                onChange={(e) => onRankingTermChange(e.target.value as Term)}
                className={`appearance-none text-sm font-bold uppercase tracking-wide pl-5 pr-10 py-2.5 rounded-2xl shadow-card ${panelBg} ${panelBorder} border ${textPrimary} focus:outline-none focus:ring-2 focus:ring-maroon/40 cursor-pointer`}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <ChevronDown className={`h-3.5 w-3.5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>
            <button
              onClick={onExpandRanking}
              className={`h-9 w-9 rounded-full flex items-center justify-center border ${panelBorder} ${textMuted} hover:text-white hover:bg-maroon hover:border-maroon transition-colors`}
              aria-label="Expand ranking"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {ranking.map((item) => (
            <div
              key={item.rank}
              className="flex items-center gap-5 rounded-2xl px-5 py-4"
              style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "#F7F7F8" }}
            >
              <RankBadge rank={item.rank} darkMode={darkMode} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${textPrimary}`}>{item.subject}</p>
                <p className={`text-xs mt-0.5 ${textMuted}`}>{item.grade}</p>
              </div>
              <div className="w-32 hidden sm:block">
                <ProgressBar value={item.score} darkMode={darkMode} />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                <TrendChip trend={item.trend} darkMode={darkMode} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

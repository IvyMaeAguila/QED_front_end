import { TrendingUp } from "lucide-react";
import { SectionCard, RankBadge, TrendChip, ProgressBar, Dropdown } from "../../../../shared/components/DashboardUI";
import type { FilteredSubjectRank, Term } from "../data/types";

interface PerGradeRankingProps {
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
  ranking,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: PerGradeRankingProps) {
  return (
    <SectionCard
      title="Per Grade Level Ranking"
      icon={TrendingUp}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
      action={
        <Dropdown
          value={gradeFilter}
          onChange={onGradeFilterChange}
          options={gradeOptions}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      }
    >
      <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
        {gradeFilter === "All Grades" ? "All subject-grade combinations" : `Subjects ranked for ${gradeFilter}`} &middot; {term}
      </p>

      <div className="flex flex-col gap-3">
        {ranking.map((item, i) => (
          <div key={`${item.subject}-${item.grade}-${i}`} className={`flex items-center gap-4 rounded-2xl border ${panelBorder} px-4 py-3.5`}>
            <RankBadge rank={item.rank} darkMode={darkMode} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${textPrimary}`}>{item.subject}</p>
              <p className={`text-xs mt-0.5 ${textMuted}`}>{item.grade}</p>
            </div>
            <div className="w-40 hidden sm:block">
              <ProgressBar value={item.score} darkMode={darkMode} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-black tabular-nums ${textPrimary}`}>{item.score}%</span>
              <TrendChip trend={item.trend} darkMode={darkMode} />
            </div>
          </div>
        ))}
        {ranking.length === 0 && <p className={`text-sm text-center py-6 ${textMuted}`}>No data for this filter.</p>}
      </div>
    </SectionCard>
  );
}

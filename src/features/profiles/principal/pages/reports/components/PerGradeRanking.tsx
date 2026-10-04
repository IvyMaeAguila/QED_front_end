import { useState } from "react";
import { Crown } from "lucide-react";
import { SectionCard, ProgressBar, Dropdown } from "../../../../shared/components/DashboardUI";
import type { FilteredSubjectRank, Term } from "../data/types";
import { getMedalStyle } from "../utils/medalStyles";

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
  const [showFullRanking, setShowFullRanking] = useState(false);
  const podiumItems = [ranking[1], ranking[0], ranking[2]].filter(Boolean);
  const visibleRows = showFullRanking ? ranking : ranking.slice(0, 3);

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
          options={gradeOptions}
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

      {ranking.length > 0 && (
        <div className={`mb-5 overflow-hidden rounded-xl border ${panelBorder} ${darkMode ? "bg-[#171315]" : "bg-[#FAF6F5]"}`}>
          <div className="px-4 pb-4 pt-3">
            <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${textMuted}`}>Top three</p>
            <div className="grid h-[190px] grid-cols-3 items-end gap-2 pt-2 sm:gap-4">
              {podiumItems.map((item) => {
                const podium = item.rank === 1
                  ? { height: "h-[88px]", background: "linear-gradient(155deg, #F3E6B7 0%, #DEC77F 52%, #F5EBCB 100%)", text: "#5A4816" }
                  : item.rank === 2
                    ? { height: "h-[68px]", background: "linear-gradient(155deg, #EDF0F2 0%, #C9CFD4 52%, #F5F6F7 100%)", text: "#4D5660" }
                    : { height: "h-[54px]", background: "linear-gradient(155deg, #EAD0BE 0%, #CF9C7D 52%, #EBD8CB 100%)", text: "#63402D" };
                return (
                  <div key={`${item.subject}-${item.grade}`} className="flex h-full min-w-0 flex-col items-center justify-end text-center">
                    <div className="flex h-5 items-center justify-center">
                      {item.rank === 1 && <Crown size={14} className="text-maroon" aria-label="First place" />}
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                    <p className={`mt-0.5 w-full truncate text-[10px] font-semibold ${textPrimary}`} title={`${item.subject} · ${item.grade}`}>{item.subject}</p>
                    <p className={`mb-1 text-[9px] ${textMuted}`}>{item.grade}</p>
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
        <p className={`py-6 text-center text-sm ${textMuted}`}>No data for this filter.</p>
      ) : (
        <>
          <ol className={`overflow-hidden rounded-xl border ${panelBorder}`}>
            {visibleRows.map((item, index) => (
              <li key={`${item.subject}-${item.grade}`} className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3 ${index > 0 ? `border-t ${panelBorder}` : ""}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${item.rank > 3 ? (darkMode ? "bg-white/10 text-white/75" : "bg-[#F1F2F4] text-[#606875]") : "shadow-sm"}`} style={getMedalStyle(item.rank)}>
                  {item.rank}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <p className={`truncate text-xs font-semibold ${textPrimary}`}>{item.subject}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textMuted}`}>{item.grade}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                <div className="col-start-2 col-end-4">
                  <ProgressBar value={item.score} darkMode={darkMode} />
                </div>
              </li>
            ))}
          </ol>
          {ranking.length > 3 && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowFullRanking((value) => !value)}
                className={`rounded-lg border px-3.5 py-2 text-[11px] font-semibold transition-colors ${panelBorder} ${darkMode ? "text-[#E5E7EB] hover:bg-white/5" : "text-maroon hover:bg-[#F8F1F1]"}`}
              >
                {showFullRanking ? "Show top three" : `View full ranking · ${ranking.length}`}
              </button>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

import { TrendChip } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank } from "../data/types";
import { getMedalStyle } from "../utils/medalStyles";

interface LeadingSubjectsPanelProps {
  ranking: AggregatedSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function LeadingSubjectsPanel({ ranking, panelBg, panelBorder, textPrimary, textMuted, darkMode }: LeadingSubjectsPanelProps) {
  const leaders = ranking.slice(0, 5);

  return (
    <section className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-labelledby="leading-subjects-title">
      <header className={`flex items-center justify-between gap-3 border-b px-4 py-3.5 ${panelBorder}`}>
        <div>
          <h2 id="leading-subjects-title" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Leading subjects</h2>
          <p className={`mt-0.5 text-[10px] ${textMuted}`}>School-wide averages</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textMuted}`}>
          {ranking.length} total
        </span>
      </header>

      <ol className="flex flex-1 flex-col">
          {leaders.map((item, index) => (
            <li key={item.subject} className={`flex min-h-[58px] flex-1 items-center gap-3 px-4 py-2.5 ${index < leaders.length - 1 ? `border-b ${panelBorder}` : ""}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${item.rank > 3 ? (darkMode ? "bg-white/10 text-white/75" : "bg-[#F1F2F4] text-[#606875]") : "shadow-sm"}`} style={getMedalStyle(item.rank)}>
                {item.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-semibold ${textPrimary}`} title={item.subject}>{item.subject}</p>
                <p className={`mt-0.5 text-[10px] ${textMuted}`}>{item.gradeCount} {item.gradeCount === 1 ? "grade level" : "grade levels"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                <TrendChip trend={item.trend} darkMode={darkMode} />
              </div>
            </li>
          ))}
      </ol>

      <footer className={`border-t px-4 py-2.5 text-[11px] ${textMuted} ${darkMode ? "bg-white/[0.025]" : "bg-[#FAFAFB]"} ${panelBorder}`}>
      Ranked by average score
      </footer>
    </section>
  );
}

import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { TrendChip } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank } from "../data/types";
import { getMedalStyle } from "../utils/medalStyles";

interface LeadingSubjectsPanelProps {
  pending?: boolean;
  view?: string;
  ranking: AggregatedSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function LeadingSubjectsPanel({ ranking, pending = false, view = "leading-subjects", panelBg, panelBorder, textPrimary, textMuted, darkMode }: LeadingSubjectsPanelProps) {
  const leaders = ranking.slice(0, 5);

  return (
    <section className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-labelledby="leading-subjects-title">
      <header className={`flex items-center justify-between gap-3 border-b px-4 py-3.5 ${panelBorder}`}>
        <div>
          <h2 id="leading-subjects-title" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="leadingsubjectspanel-leading-subjects" data-sk-static="">Leading subjects</h2>
          <p className={`mt-0.5 text-xs ${textMuted}`} data-sk-region="leadingsubjectspanel-school-wide-averages" data-sk-static="">School-wide averages</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? "bg-white/10" : "bg-brand-light"} ${textMuted}`} data-sk-region="leadingsubjectspanel-span-field-1">
          {pending ? <SkeletonText className="inline-block align-middle" width="2ch" /> : ranking.length} total
        </span>
      </header>

      <ol className="flex flex-1 flex-col" data-sk-region="leadingsubjectspanel-ol-field-2">
          {leaders.map((item, index) => (
            <li data-sk-region="leading-subject-row" key={item.subject} className={`flex min-h-[58px] flex-1 items-center gap-3 px-4 py-2.5 ${index < leaders.length - 1 ? `border-b ${panelBorder}` : ""}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${item.rank > 3 ? (darkMode ? "bg-white/10 text-white/75" : "bg-brand-light text-[#606875]") : "shadow-sm"}`} style={getMedalStyle(item.rank)}>
                {item.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-semibold ${textPrimary}`} title={pending ? undefined : item.subject} data-sk-region="leadingsubjectspanel-p-field-3">{pending ? <SkeletonText width={`${78 - index * 6}%`} /> : item.subject}</p>
                <p className={`mt-0.5 text-xs ${textMuted}`}><span data-sk-field={`${view}:leader-${index}:grades`} data-sk-region="leadingsubjectspanel-span-field-4">{pending ? <SkeletonParagraph field={`${view}:leader-${index}:grades`} /> : `${item.gradeCount} ${item.gradeCount === 1 ? "grade level" : "grade levels"}`}</span></p>
              </div>
              <div className="flex shrink-0 items-center gap-2" data-sk-region="leadingsubjectspanel-div-field-5">
                <span className={`text-xs font-bold tabular-nums ${textPrimary}`} data-sk-region="leadingsubjectspanel-span-field-6">{pending ? <SkeletonText width="4ch" /> : `${item.score}%`}</span>
                {pending ? <Skeleton className="h-6 w-6 rounded-full" /> : <TrendChip trend={item.trend} darkMode={darkMode} />}
              </div>
            </li>
          ))}
      </ol>

      <footer className={`border-t px-4 py-2.5 text-xs ${textMuted} ${darkMode ? "bg-white/[0.025]" : "bg-[#FAFAFB]"} ${panelBorder}`}>
      Ranked by average score
      </footer>
    </section>
  );
}

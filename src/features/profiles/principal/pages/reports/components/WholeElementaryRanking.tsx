import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank, Term } from "../data/types";
import { LeadingSubjectsPanel } from "./LeadingSubjectsPanel";

interface WholeElementaryRankingProps {
  loading?: boolean;
  view?: string;
  term: Term;
  ranking: AggregatedSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function WholeElementaryRanking({ term, ranking: loadedRanking, loading = false, view = "subject-ranking", panelBg, panelBorder, textPrimary, textMuted, darkMode }: WholeElementaryRankingProps) {
  const render = (pending: boolean) => {
  const ranking = pending ? Array.from({ length: skeletonRows(view, undefined, 64) }, (_, index) => ({ subject: `pending-${index}`, grade: "", score: 52 + index * 7, trend: "flat" as const, gradeCount: 0, rank: index + 1 })) : loadedRanking;
  const chartGridColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const chartAxisColor = darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const chartTooltipBg = darkMode ? "#111827" : "#FFFFFF";
  const chartData = ranking.map((item) => ({ ...item, scoreLabel: `${item.score}%` }));
  const chartHeight = Math.max(260, Math.min(480, ranking.length * 38 + 44));

  return (
    <div className={`grid items-stretch gap-4 ${ranking.length ? "lg:grid-cols-[minmax(0,1fr)_310px]" : "grid-cols-1"}`}>
    <SectionCard title="Whole Elementary Department Ranking" compact panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm ${textMuted}`}>Average subject scores across all grade levels · {term}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? "bg-white/5" : "bg-[#F4F5F7]"} ${textMuted}`} data-sk-region="wholeelementaryranking-span-field-1">
          {pending ? <SkeletonText className="inline-block align-middle" width="2ch" /> : ranking.length} subjects
        </span>
      </div>

      {ranking.length === 0 ? (
        <p className={`py-12 text-center text-sm ${textMuted}`} data-sk-region="wholeelementaryranking-no-subject-scores-are-available-for-this-term" data-sk-static="">No subject scores are available for this term.</p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
            <div data-sk-region="subject-ranking-plot" data-sk-chart="bars" className="min-w-[460px]" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 34, bottom: 2, left: 4 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 5" stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="subject" width={138} tick={pending ? (props: { x?: number | string; y?: number | string }) => <foreignObject x={Number(props.x ?? 0) - 132} y={Number(props.y ?? 0) - 8} width={128} height={16}><SkeletonText width="85%" style={{ fontSize: 11, lineHeight: "16px" }} /></foreignObject> : { fill: chartAxisColor, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip active={pending ? false : undefined}
                    cursor={{ fill: darkMode ? "rgba(255,255,255,0.04)" : "color-mix(in srgb, var(--brand-primary) 3.5%, transparent)" }}
                    contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartGridColor}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: textPrimary, fontWeight: 700, marginBottom: 3 }}
                    formatter={(value, _name, props) => [`${Number(value)}% · ${props.payload.gradeCount} grade levels`, "Average score"]}
                  />
                  <Bar isAnimationActive={false} shape={pending ? (props: unknown) => { const box = props as { x: number; y: number; width: number; height: number }; return <foreignObject x={box.x} y={box.y} width={box.width} height={box.height}><Skeleton className="h-full w-full rounded-l-none" style={{ borderRadius: "0 var(--sk-chart-radius) var(--sk-chart-radius) 0" }} /></foreignObject>; } : undefined} dataKey="score" radius={[0, 5, 5, 0]} maxBarSize={22}>
                    {ranking.map((item) => (
                      <Cell key={item.subject} fill={item.rank === 1 ? "var(--color-maroon)" : "var(--brand-secondary)"} />
                    ))}
                    <LabelList content={pending ? (props: unknown) => { const box = props as { x: number; y: number; width: number; height: number }; return <foreignObject x={box.x + box.width + 5} y={box.y} width={26} height={box.height}><SkeletonText width="3ch" style={{ fontSize: 11, lineHeight: `${box.height}px` }} /></foreignObject>; } : undefined} dataKey="scoreLabel" position="right" fill={chartAxisColor} fontSize={11} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      )}
    </SectionCard>
    {ranking.length > 0 && <LeadingSubjectsPanel pending={pending} view={view} ranking={ranking} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />}
    </div>
  );
  };
  return <LoadingRegion loading={loading} variable name="whole-elementary-ranking" retainPrevious hasContent={loadedRanking.length > 0} skeleton={null} frame={render} onSettled={() => rememberRows(view, loadedRanking.length)}>{render(false)}</LoadingRegion>;
}

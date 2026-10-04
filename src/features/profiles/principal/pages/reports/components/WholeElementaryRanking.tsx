import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank, Term } from "../data/types";
import { LeadingSubjectsPanel } from "./LeadingSubjectsPanel";

interface WholeElementaryRankingProps {
  term: Term;
  ranking: AggregatedSubjectRank[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function WholeElementaryRanking({ term, ranking, panelBg, panelBorder, textPrimary, textMuted, darkMode }: WholeElementaryRankingProps) {
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
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${darkMode ? "bg-white/5" : "bg-[#F4F5F7]"} ${textMuted}`}>
          {ranking.length} subjects
        </span>
      </div>

      {ranking.length === 0 ? (
        <p className={`py-12 text-center text-sm ${textMuted}`}>No subject scores are available for this term.</p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[460px]" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 34, bottom: 2, left: 4 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 5" stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chartAxisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="subject" width={138} tick={{ fill: chartAxisColor, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: darkMode ? "rgba(255,255,255,0.04)" : "rgba(107,0,0,0.035)" }}
                    contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartGridColor}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: textPrimary, fontWeight: 700, marginBottom: 3 }}
                    formatter={(value, _name, props) => [`${Number(value)}% · ${props.payload.gradeCount} grade levels`, "Average score"]}
                  />
                  <Bar dataKey="score" radius={[0, 5, 5, 0]} maxBarSize={22}>
                    {ranking.map((item) => (
                      <Cell key={item.subject} fill={item.rank === 1 ? "#6B0000" : "#A53333"} />
                    ))}
                    <LabelList dataKey="scoreLabel" position="right" fill={chartAxisColor} fontSize={11} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      )}
    </SectionCard>
    {ranking.length > 0 && <LeadingSubjectsPanel ranking={ranking} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />}
    </div>
  );
}

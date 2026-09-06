import { Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { SectionCard, TrendChip } from "../../../../shared/components/DashboardUI";
import { scoreVar } from "../utils/ranking";
import type { AggregatedSubjectRank, Term } from "../data/types";

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
  const chartTooltipBg = darkMode ? "#1A1A1A" : "#FFFFFF";

  return (
    <SectionCard title="Whole Elementary Department Ranking" icon={Trophy} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
        Average subject performance across all grade levels &middot; {term} &middot; {ranking.length} subjects
      </p>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ranking} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={14}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: chartAxisColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
            <YAxis type="category" dataKey="subject" width={140} tick={{ fill: chartAxisColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
            <Tooltip
              cursor={{ fill: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartGridColor}`, borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: textPrimary, fontWeight: 700 }}
              formatter={(value, _name, props) => [`${Number(value)}% (avg over ${props.payload.gradeCount} grade levels)`, "Score"]}
            />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} maxBarSize={28}>
              {ranking.map((item) => (
                <Cell key={item.subject} fill={scoreVar(item.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        {ranking.map((item) => (
          <div key={item.subject} className={`flex items-center gap-2.5 rounded-full border ${panelBorder} pl-1.5 pr-3.5 py-1.5`}>
            <span
              className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{
                backgroundColor:
                  item.rank === 1
                    ? "var(--color-gold)"
                    : item.rank === 2
                      ? "var(--color-silver)"
                      : item.rank === 3
                        ? "var(--color-bronze)"
                        : darkMode
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                color: item.rank <= 3 ? "#FFFFFF" : darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              }}
            >
              {item.rank}
            </span>
            <span className={`text-xs font-bold ${textPrimary}`}>{item.subject}</span>
            <TrendChip trend={item.trend} darkMode={darkMode} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

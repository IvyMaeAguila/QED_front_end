import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { GradePerformance, PerformanceTrendPoint } from "../data/types";

interface AcademicPerformanceSectionProps {
  performanceByGrade: GradePerformance[];
  performanceTrend: PerformanceTrendPoint[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  gridStroke: string;
  axisColor: string;
}

export function AcademicPerformanceSection({
  performanceByGrade,
  performanceTrend,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  gridStroke,
  axisColor,
}: AcademicPerformanceSectionProps) {
  return (
    <SectionCard title="Academic Performance Overview" icon={BarChart3} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${textMuted}`}>Performance by Grade Level</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={performanceByGrade} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="grade" tick={{ fill: axisColor, fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} domain={[0, 100]} axisLine={{ stroke: gridStroke }} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: darkMode ? "rgba(255,255,255,0.06)" : "rgba(85,0,0,0.04)" }}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", fontSize: 12 }}
              />
              <Bar dataKey="score" fill="var(--color-maroon-dark)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${textMuted}`}>Performance Trend Across Terms</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="term" tick={{ fill: axisColor, fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} domain={[0, 100]} axisLine={{ stroke: gridStroke }} tickLine={false} width={32} />
              <Tooltip
                cursor={{ stroke: "var(--color-maroon)" }}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="performance" stroke="var(--color-green)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-green)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}

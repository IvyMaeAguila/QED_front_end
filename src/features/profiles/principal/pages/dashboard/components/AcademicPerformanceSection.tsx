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

interface GradePerformanceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: GradePerformance }>;
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
}

function GradePerformanceTooltip({
  active,
  payload,
  darkMode,
  textPrimary,
  textMuted,
}: GradePerformanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{
        backgroundColor: darkMode ? "#1A1A1A" : "#FFFFFF",
        boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
        minWidth: 160,
      }}
    >
      <div className={`font-black text-sm mb-1 ${textPrimary}`}>{data.grade}</div>

      {data.score === null ? (
        <div className={`italic ${textMuted}`}>Result not available</div>
      ) : (
        <>
          <div className={`font-bold mb-2 ${textMuted}`}>Overall: {data.score}</div>
          {data.sections.length > 0 ? (
            <div className="flex flex-col gap-1">
              {data.sections.map((s) => (
                <div key={s.sectionId} className="flex items-center justify-between gap-4">
                  <span className={textMuted}>{s.section}</span>
                  <span className={`font-bold tabular-nums ${textPrimary}`}>{s.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`italic ${textMuted}`}>No sections recorded</div>
          )}
        </>
      )}
    </div>
  );
}

interface PerformanceTrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PerformanceTrendPoint }>;
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
}

function PerformanceTrendTooltip({
  active,
  payload,
  darkMode,
  textPrimary,
  textMuted,
}: PerformanceTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  const rows: Array<{ label: string; value: number | null }> = [
    { label: "Academic Performance", value: data.performance },
    { label: "Attendance", value: data.attendance },
    { label: "Holistic Average", value: data.holisticAverage },
  ];

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{
        backgroundColor: darkMode ? "#1A1A1A" : "#FFFFFF",
        boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
        minWidth: 190,
      }}
    >
      <div className={`font-black text-sm mb-1 ${textPrimary}`}>{data.term}</div>
      <div className={`font-bold mb-2 ${textMuted}`}>
        Overall: {data.overall === null ? "N/A" : data.overall}
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className={textMuted}>{r.label}</span>
            <span className={`font-bold tabular-nums ${textPrimary}`}>
              {r.value === null || r.value === undefined ? "N/A" : r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
                content={(props) => (
                  <GradePerformanceTooltip
                    active={props.active}
                    payload={props.payload as unknown as Array<{ payload: GradePerformance }> | undefined}
                    darkMode={darkMode}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                )}
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
              <XAxis
                dataKey="term"
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
                padding={{ left: 24, right: 24 }}
              />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} domain={[0, 100]} axisLine={{ stroke: gridStroke }} tickLine={false} width={32} />
              <Tooltip
                cursor={{ stroke: "var(--color-maroon)" }}
                content={(props) => (
                  <PerformanceTrendTooltip
                    active={props.active}
                    payload={props.payload as unknown as Array<{ payload: PerformanceTrendPoint }> | undefined}
                    darkMode={darkMode}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                )}
              />
              <Line type="monotone" dataKey="overall" name="Overall" stroke="var(--color-green)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-green)" }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}
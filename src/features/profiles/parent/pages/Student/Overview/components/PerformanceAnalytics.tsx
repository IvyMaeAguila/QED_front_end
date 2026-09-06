import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../GlobalTypes/types";
import { useTermPerformance } from "../context/PerformanceAnalyticsContext";
import type { TermPoint } from "../context/PerformanceAnalyticsContext";

const ACCENT = "#6B0000";

function CustomTooltip({ active, payload, studentName }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TermPoint | undefined;
  if (!row) return null;

  return (
    <div className="min-w-56 rounded-2xl border border-black/6 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-[#1A1A1A]">{row.term}</p>
      {studentName && (
        <p className="text-[11px] font-medium text-[#8A8F98]">{studentName}&apos;s grades</p>
      )}
      <div className="mt-3 space-y-1.5">
        {row.subjects.map((s) => (
          <div key={s.subject} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-[#5B6069]">{s.subject}</span>
            <span className="font-semibold tabular-nums text-[#1A1A1A]">{s.grade}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-2 text-xs">
        <span className="font-semibold text-[#1A1A1A]">Average</span>
        <span className="font-bold tabular-nums" style={{ color: ACCENT }}>
          {row.average.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

interface TermAverageTrendChartProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function TermAverageTrendChart({
  student,
  theme,
}: TermAverageTrendChartProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const hairline = darkMode ? "border-white/[0.08]" : "border-black/[0.06]";

  const { termPoints, loading, error } = useTermPerformance();
  const studentName = student.fullName;

  return (
    <div
      className={`rounded-2xl border ${panelBorder} ${panelBg} shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5 ${hairline}`}>
        <div>
          <h2 className={`text-[15px] font-semibold ${textPrimary}`}>Term average</h2>
          <p className={`mt-0.5 text-[12px] font-medium ${textMuted}`}>
            Hover a point to see{studentName ? ` ${studentName}'s` : ""} grades per subject that term
          </p>
        </div>
      </div>

      <div className="px-4 pb-6 pt-5 sm:px-6">
        <div className="h-80 w-full">
          {loading ? (
            <div className={`flex h-full items-center justify-center text-sm ${textMuted}`}>
              Loading term data…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              {error}
            </div>
          ) : termPoints.length === 0 ? (
            <div className={`flex h-full items-center justify-center text-sm ${textMuted}`}>
              No released terms yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={termPoints} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#FFFFFF12" : "#0000000A"}
                  vertical={false}
                />
                <XAxis
                  dataKey="term"
                  tick={{ fontSize: 12, fontWeight: 600, fill: darkMode ? "#9CA3AF" : "#8A8F98" }}
                  axisLine={{ stroke: darkMode ? "#FFFFFF1A" : "#0000001A" }}
                  tickLine={false}
                  padding={{ left: 40, right: 40 }}
                />
                <YAxis
                  domain={[75, 100]}
                  ticks={[75, 80, 85, 90, 95, 100]}
                  tick={{ fontSize: 11, fontWeight: 500, fill: darkMode ? "#9CA3AF" : "#8A8F98" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<CustomTooltip studentName={studentName} />}
                  cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Line
                  name="Average"
                  dataKey="average"
                  type="monotone"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ r: 4, strokeWidth: 2, stroke: darkMode ? "#15181C" : "#FFFFFF", fill: ACCENT }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: darkMode ? "#15181C" : "#FFFFFF", fill: ACCENT }}
                  connectNulls
                  isAnimationActive
                  animationDuration={450}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
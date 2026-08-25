import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeader from "../../../ui/SectionHeader";
import EmptyState from "../components/EmptyState";
import { COLORS } from "../utils/constants";
import { MOCK_TERMS } from "../data/mockData";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

interface PerformanceAnalyticsProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function PerformanceAnalytics({
  student,
  theme,
}: PerformanceAnalyticsProps) {
  const { darkMode, panelBg, textMuted } = theme;
  const term = MOCK_TERMS[MOCK_TERMS.length - 1];

  const barColor = darkMode ? "#F87171" : COLORS.maroonDark;
  const gridColor = darkMode ? "#1F2937" : COLORS.line;
  const axisTickColor = darkMode ? "#9CA3AF" : COLORS.sub;
  const badgeBg = darkMode ? "rgba(248,113,113,0.15)" : COLORS.maroonSoft;

  return (
    <div className={`flex-1 overflow-hidden rounded-2xl shadow-sm ${panelBg}`}>
      <SectionHeader
        icon={TrendingUp}
        title="Performance Analytics"
        about={`Breaks down ${student.firstName}'s grades per subject for the quarter. This section only fills in once the subject teachers submit and release the quarterly report card.`}
        theme={theme}
      />
      <div className="p-5">
        {term.released ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-semibold ${textMuted}`}>
                  {term.label} average
                </p>
                <p
                  className="text-xl font-extrabold"
                  style={{ color: barColor }}
                >
                  {term.average}
                </p>
              </div>
              <span
                className="rounded-full px-2 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: badgeBg, color: barColor }}
              >
                Released {term.releaseDate}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={term.subjects} margin={{ left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 9, fill: axisTickColor }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: axisTickColor }}
                />
                <Tooltip
                  contentStyle={
                    darkMode
                      ? {
                          backgroundColor: "#111827",
                          border: "1px solid #1F2937",
                          color: "#fff",
                        }
                      : undefined
                  }
                  labelStyle={darkMode ? { color: "#fff" } : undefined}
                />
                <Bar dataKey="grade" fill={barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            message="Performance breakdown charts appear here once quarterly grades are submitted."
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
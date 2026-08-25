import { Sparkles } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import SectionHeader from "../../../ui/SectionHeader";
import EmptyState from "./EmptyState";
import { COLORS } from "../utils/constants";
import { MOCK_HOLISTIC } from "../data/mockData";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

interface HolisticAnalyticsProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function HolisticAnalytics({
  student,
  theme,
}: HolisticAnalyticsProps) {
  const { darkMode, panelBg, textMuted } = theme;
  const data = MOCK_HOLISTIC;

  const radarColor = darkMode ? "#F87171" : COLORS.maroonDark;
  const gridColor = darkMode ? "#1F2937" : COLORS.line;
  const axisTickColor = darkMode ? "#9CA3AF" : COLORS.sub;

  return (
    <div className={`flex-1 overflow-hidden rounded-2xl shadow-sm ${panelBg}`}>
      <SectionHeader
        icon={Sparkles}
        title="Holistic Analytics"
        about={`Weekly snapshot of ${student.firstName}'s values, behavior, and classroom engagement, submitted by the adviser. Updates every week the adviser files an evaluation.`}
        theme={theme}
      />
      <div className="p-5">
        {data.hasUpdate ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className={`text-[11px] font-semibold ${textMuted}`}>
                Weekly evaluation
              </p>
              <span className={`text-[10px] font-medium ${textMuted}`}>
                Updated {data.lastUpdated}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={data.values} outerRadius={65}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fontSize: 9, fill: axisTickColor }}
                />
                <Radar
                  dataKey="score"
                  stroke={radarColor}
                  fill={radarColor}
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyState
            icon={Sparkles}
            message="Values, behavior, and engagement insights appear here once the adviser submits this week's evaluation."
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeader from "../../../ui/SectionHeader";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../GlobalTypes/types";
import { useProgressReport } from "../../ProgressReport/context/ProgressReportContext"; // adjust path as needed
import { TERM_LABELS, TERMS } from "../../ProgressReport/types/types";

const ACCENT = "#6B0000";
const CHART_FLOOR = 70;

interface SubjectGrade {
  subject: string;
  grade: number;
}

interface TermPoint {
  /** "1st Term" | "2nd Term" | "3rd Term" */
  term: string;
  /** Overall average for that term (percentage) — true value, used for tooltip/display */
  average: number;
  /** Value actually plotted on the line — clamped to CHART_FLOOR so a dot never
   *  dips below the 70 gridline, even if the true average is lower. */
  plotAverage: number;
  /** Per-subject grades for that term — shown on hover */
  subjects: SubjectGrade[];
}

function CustomTooltip({ active, payload, studentName }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TermPoint | undefined;
  if (!row) return null;

  return (
    <div className="min-w-56 rounded-2xl border border-black/6 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-[#1A1A1A]">{row.term}</p>
      {studentName && (
        <p className="text-[11px] font-medium text-[#8A8F98]">
          {studentName}&apos;s grades
        </p>
      )}
      <div className="mt-3 space-y-1.5">
        {row.subjects.map((s) => (
          <div
            key={s.subject}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="font-medium text-[#5B6069]">{s.subject}</span>
            <span className="font-semibold tabular-nums text-[#1A1A1A]">
              {s.grade}
            </span>
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

  const { data, loading, error } = useProgressReport();
  const studentName = student.fullName;

  // Derive the chart's { term, average, plotAverage, subjects[] } points from
  // the two separate arrays the new context gives us — termAverages (for the
  // released/average gate) and periodicRatings (for the per-subject
  // breakdown shown in the tooltip). Only released terms with a non-null
  // average are plotted, same gate the old TermPerformanceContext used.
  const termPoints = useMemo<TermPoint[]>(() => {
    return TERMS.filter((term) => {
      const entry = data.termAverages.find((t) => t.term === term);
      return entry?.released && entry.average !== null;
    }).map((term) => {
      const entry = data.termAverages.find((t) => t.term === term)!;
      const subjects: SubjectGrade[] = data.periodicRatings
        .filter((row) => typeof row.scores[term] === "number")
        .map((row) => ({
          subject: row.learningArea,
          grade: row.scores[term] as number,
        }));

      const average = entry.average as number;

      return {
        term: TERM_LABELS[term],
        average,
        // Floor the plotted value at CHART_FLOOR so a below-70 average still
        // renders its dot right on the 70 line, instead of clipping off the
        // bottom of the chart. Tooltip still reads the true `average`.
        plotAverage: Math.max(average, CHART_FLOOR),
        subjects,
      };
    });
  }, [data.termAverages, data.periodicRatings]);

  return (
    <div
       className={`flex h-[340px] flex-col rounded-2xl border ${panelBorder} ${panelBg} shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      {/* <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5 ${hairline}`}>
        <div>
          <h2 className={`text-[15px] font-semibold ${textPrimary}`}>Term average</h2>
          <p className={`mt-0.5 text-[12px] font-medium ${textMuted}`}>
            Hover a point to see{studentName ? ` ${studentName}'s` : ""} grades per subject that term
          </p>
        </div>
      </div> */}

      <SectionHeader
        icon={Sparkles}
        title="Term Average"
        about={`Hover a point to see ${studentName ? `${studentName}'s` : ""} grades per subject that term`}
        theme={theme}
      />

       <div className="flex flex-1 min-h-0 flex-col px-4 pb-6 pt-5 sm:px-6">
  <div className="w-full flex-1 min-h-0">
          {loading ? (
            <div
              className={`flex h-full items-center justify-center text-sm ${textMuted}`}
            >
              Loading term data…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              {error}
            </div>
          ) : termPoints.length === 0 ? (
            <div
              className={`flex h-full items-center justify-center text-sm ${textMuted}`}
            >
              No released terms yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={termPoints}
                margin={{ top: 8, right: 24, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#FFFFFF12" : "#0000000A"}
                  vertical={false}
                />
                <XAxis
                  dataKey="term"
                  tick={{
                    fontSize: 12,
                    fontWeight: 600,
                    fill: darkMode ? "#9CA3AF" : "#8A8F98",
                  }}
                  axisLine={{ stroke: darkMode ? "#FFFFFF1A" : "#0000001A" }}
                  tickLine={false}
                  padding={{ left: 40, right: 40 }}
                />
                <YAxis
                  domain={[CHART_FLOOR, 100]}
                  ticks={[70, 75, 80, 85, 90, 95, 100]}
                  tick={{
                    fontSize: 11,
                    fontWeight: 500,
                    fill: darkMode ? "#9CA3AF" : "#8A8F98",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<CustomTooltip studentName={studentName} />}
                  cursor={{
                    stroke: ACCENT,
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Line
                  name="Average"
                  dataKey="plotAverage"
                  type="monotone"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: darkMode ? "#15181C" : "#FFFFFF",
                    fill: ACCENT,
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: darkMode ? "#15181C" : "#FFFFFF",
                    fill: ACCENT,
                  }}
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
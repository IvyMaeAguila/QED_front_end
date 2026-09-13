import { Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type {
  GradeAttendance,
  TodaysAttendance,
} from "../data/types";

interface TodaysAttendanceSectionProps {
  attendanceByGrade: GradeAttendance[];
  todaysAttendance: TodaysAttendance;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  gridStroke: string;
  axisColor: string;
}

interface ChartData {
  gradeLevelId: number;
  grade: string;
  present: number;
  absent: number;
  total: number;
  attendance: number;
  sections: {
    sectionId: number | null;
    section: string | null;
    present: number;
    absent: number;
    total: number;
    attendance: number;
    hasRecorded: boolean;
  }[];
}

/* =========================
   CUSTOM TOOLTIP
========================= */

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

function CustomTooltip({
  active,
  payload,
  textPrimary,
  textMuted,
  darkMode,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  // Kapag isa lang (o wala) ang section, "solo" na yung grade -
  // wag nang ipakita yung Total Present/Absent block kasi
  // duplicate lang sya ng section row sa itaas.
  const isMultiSection = data.sections.length >= 2;

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-xl ${
        darkMode
          ? "bg-zinc-900 border-white/10"
          : "bg-white border-gray-200"
      }`}
      style={{
        minWidth: 210,
      }}
    >
      {/* Grade */}
      <div className="mb-3">
        <p
          className={`text-sm font-black ${textPrimary}`}
        >
          {data.grade}
        </p>

        <p
          className={`text-[10px] uppercase tracking-wider ${textMuted}`}
        >
          Attendance breakdown
        </p>
      </div>

      {/* Sections */}
      {data.sections.length > 0 ? (
        <div className="space-y-3">
          {data.sections.map((section, index) => (
            <div
              key={
                section.sectionId ??
                `${data.gradeLevelId}-${index}`
              }
              className={`pb-3 ${
                index !== data.sections.length - 1
                  ? darkMode
                    ? "border-b border-white/10"
                    : "border-b border-gray-100"
                  : ""
              }`}
            >
              {/* Section name */}
              {section.section && (
                <p
                  className={`text-[11px] font-black mb-1.5 ${textPrimary}`}
                >
                  {section.section}
                </p>
              )}

              {section.hasRecorded ? (
                <div className="space-y-1">
                  {/* Present */}
                  <div className="flex justify-between gap-4">
                    <span
                      className={`text-[10px] ${textMuted}`}
                    >
                      Present
                    </span>

                    <span
                      className={`text-[10px] font-bold ${textPrimary}`}
                    >
                      {section.present}
                    </span>
                  </div>

                  {/* Absent */}
                  <div className="flex justify-between gap-4">
                    <span
                      className={`text-[10px] ${textMuted}`}
                    >
                      Absent
                    </span>

                    <span
                      className={`text-[10px] font-bold ${textPrimary}`}
                    >
                      {section.absent}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between gap-4">
                    <span
                      className={`text-[10px] ${textMuted}`}
                    >
                      Total
                    </span>

                    <span
                      className={`text-[10px] font-bold ${textPrimary}`}
                    >
                      {section.total}
                    </span>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-[10px] italic ${textMuted}`}
                >
                  Not yet recorded
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p
          className={`text-[10px] ${textMuted}`}
        >
          No section data
        </p>
      )}

      {/* Grade Total - multi-section lang ipapakita */}
      {isMultiSection && (
        <div
          className={`mt-3 pt-3 border-t ${
            darkMode
              ? "border-white/10"
              : "border-gray-200"
          }`}
        >
          <div className="flex justify-between mb-1">
            <span
              className={`text-[10px] ${textMuted}`}
            >
              Total Present
            </span>

            <span
              className={`text-[10px] font-black ${textPrimary}`}
            >
              {data.present}
            </span>
          </div>

          <div className="flex justify-between mb-1">
            <span
              className={`text-[10px] ${textMuted}`}
            >
              Total Absent
            </span>

            <span
              className={`text-[10px] font-black ${textPrimary}`}
            >
              {data.absent}
            </span>
          </div>

          <div className="flex justify-between">
            <span
              className={`text-[10px] font-bold ${textMuted}`}
            >
              Attendance
            </span>

            <span
              className="text-[11px] font-black"
              style={{
                color: "var(--color-maroon)",
              }}
            >
              {data.attendance}%
            </span>
          </div>
        </div>
      )}

      {/* Solo section - percentage lang ang ipapakita, walang totals block */}
      {!isMultiSection && data.sections[0]?.hasRecorded && (
        <div
          className={`mt-3 pt-3 border-t flex justify-between ${
            darkMode
              ? "border-white/10"
              : "border-gray-200"
          }`}
        >
          <span
            className={`text-[10px] font-bold ${textMuted}`}
          >
            Attendance
          </span>

          <span
            className="text-[11px] font-black"
            style={{
              color: "var(--color-maroon)",
            }}
          >
            {data.attendance}%
          </span>
        </div>
      )}
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export function TodaysAttendanceSection({
  attendanceByGrade,
  todaysAttendance,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  gridStroke,
  axisColor,
}: TodaysAttendanceSectionProps) {
  const chartData: ChartData[] = attendanceByGrade.map(
    (item) => {
      if (
        item.type === "section" &&
        item.sections
      ) {
        const present = item.sections.reduce(
          (sum, section) =>
            sum + section.present,
          0
        );

        const absent = item.sections.reduce(
          (sum, section) =>
            sum + section.absent,
          0
        );

        const total = item.sections.reduce(
          (sum, section) =>
            sum + section.total,
          0
        );

        const attendance =
          total > 0
            ? Number(
                (
                  (present / total) *
                  100
                ).toFixed(1)
              )
            : 0;

        return {
          gradeLevelId: item.gradeLevelId,
          grade: item.grade,
          present,
          absent,
          total,
          attendance,
          sections: item.sections.map((section) => ({
            ...section,

            hasRecorded: section.hasRecorded ?? true,
          })),
        };
      }

      /*
       * One section or no section.
       *
       * Still display ONE bar for the grade. Kunin yung hasRecorded
       * mula sa backend - kapag wala pa talagang record, dapat
       * "Not yet recorded" ang lumabas dito rin, hindi lang sa
       * mga grade na may multiple section.
       */
      const hasRecorded = item.hasRecorded ?? false;

      return {
        gradeLevelId: item.gradeLevelId,
        grade: item.grade,
        present: item.present ?? 0,
        absent: item.absent ?? 0,
        total: item.total ?? 0,
        attendance: item.attendance,
        sections: [
          {
            sectionId: null,
            section: null,
            present: item.present ?? 0,
            absent: item.absent ?? 0,
            total: item.total ?? 0,
            attendance: item.attendance,
            hasRecorded,
          },
        ],
      };
    }
  );

  return (
    <SectionCard
      title="Today's Attendance"
      icon={Users}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
        {/* =========================
            CHART
        ========================= */}

        <div className="lg:col-span-3">
          <div
            className="flex items-center justify-between mb-6 pb-2 border-b border-dashed"
            style={{
              borderColor: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <p
                className={`text-[11px] font-black uppercase tracking-wider ${textPrimary}`}
              >
                Attendance Rate by Grade Level
              </p>

              <p
                className={`text-[11px] mt-0.5 ${textMuted}`}
              >
                Hover a grade to view section attendance
              </p>
            </div>

            <span
              className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                darkMode
                  ? "bg-white/4 border-white/10 text-white/70"
                  : "bg-gray-100 border-gray-200 text-gray-600"
              }`}
            >
              Target: 95%
            </span>
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={chartData}
              barCategoryGap="28%"
            >
              <CartesianGrid
                strokeDasharray="0"
                vertical={false}
                stroke={gridStroke}
              />

              {/* Grade Level */}
              <XAxis
                dataKey="grade"
                tick={{
                  fill: axisColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}
                axisLine={{
                  stroke: gridStroke,
                }}
                tickLine={false}
              />

              {/* Percentage */}
              <YAxis
                tick={{
                  fill: axisColor,
                  fontSize: 11,
                }}
                domain={[0, 100]}
                axisLine={{
                  stroke: gridStroke,
                }}
                tickLine={false}
                width={32}
              />

              {/* Hover */}
              <Tooltip
                content={
                  <CustomTooltip
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                    darkMode={darkMode}
                  />
                }
                cursor={{
                  fill: darkMode
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(85,0,0,0.04)",
                }}
              />

              {/* One bar per Grade Level */}
              <Bar
                dataKey="attendance"
                fill="var(--color-maroon)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* =========================
            SUMMARY
        ========================= */}

        <div
          className={`flex flex-col justify-between gap-3 p-4 rounded-xl border ${
            darkMode
              ? "bg-white/2 border-white/10"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {/* Present */}
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}
            >
              Present Today
            </p>

            <p
              className={`text-xl font-black tracking-tight tabular-nums mt-0.5 ${textPrimary}`}
            >
              {todaysAttendance.present.toLocaleString()}
            </p>
          </div>

          <div
            className={`h-px w-full ${
              darkMode
                ? "bg-white/10"
                : "bg-gray-200"
            }`}
          />

          {/* Absent */}
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}
            >
              Absent Today
            </p>

            <p
              className={`text-xl font-black tracking-tight tabular-nums mt-0.5 ${textPrimary}`}
            >
              {todaysAttendance.absent.toLocaleString()}
            </p>
          </div>

          <div
            className={`h-px w-full ${
              darkMode
                ? "bg-white/10"
                : "bg-gray-200"
            }`}
          />

          {/* Concerning */}
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}
            >
              Concerning
            </p>

            <p
              className="text-xl font-black tracking-tight tabular-nums mt-0.5"
              style={{
                color: "var(--color-red)",
              }}
            >
              {todaysAttendance.concerning}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
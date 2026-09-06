import { Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { GradeAttendance, TodaysAttendance } from "../data/types";

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
  return (
    <SectionCard title="Today's Attendance" icon={Users} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
        <div className="lg:col-span-3">
          <div
            className="flex items-center justify-between mb-6 pb-2 border-b border-dashed"
            style={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
          >
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider ${textPrimary}`}>Attendance Rate by Grade Level</p>
              <p className={`text-[11px] mt-0.5 ${textMuted}`}>Percentage of active students present per level</p>
            </div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${darkMode ? "bg-white/4 border-white/10 text-white/70" : "bg-gray-100 border-gray-200 text-gray-600"}`}
            >
              Target: 95%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceByGrade} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="grade" tick={{ fill: axisColor, fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} domain={[0, 100]} axisLine={{ stroke: gridStroke }} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: darkMode ? "rgba(255,255,255,0.06)" : "rgba(85,0,0,0.04)" }}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", fontSize: 12 }}
              />
              <Bar dataKey="attendance" fill="var(--color-maroon)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`flex flex-col justify-between gap-3 p-4 rounded-xl border ${darkMode ? "bg-white/2 border-white/10" : "bg-gray-50 border-gray-100"}`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Present Today</p>
            <p className={`text-xl font-black tracking-tight tabular-nums mt-0.5 ${textPrimary}`}>
              {todaysAttendance.present.toLocaleString()}
            </p>
          </div>
          <div className={`h-px w-full ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Absent Today</p>
            <p className={`text-xl font-black tracking-tight tabular-nums mt-0.5 ${textPrimary}`}>
              {todaysAttendance.absent.toLocaleString()}
            </p>
          </div>
          <div className={`h-px w-full ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Concerning</p>
            <p className="text-xl font-black tracking-tight tabular-nums mt-0.5" style={{ color: "var(--color-red)" }}>
              {todaysAttendance.concerning}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

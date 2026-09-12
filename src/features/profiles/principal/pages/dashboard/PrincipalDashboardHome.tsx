import { useOutletContext } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../../../../auth/context/authContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalDashboardData } from "./hooks/usePrincipalDashboardData";
import {
  DashboardSkeleton,
  DashboardError,
} from "./components/DashboardStatus";
import { OverviewCards } from "./components/OverviewCards";
import { TodaysAttendanceSection } from "./components/TodaysAttendanceSection";
import { SubjectPerformanceSection } from "./components/SubjectPerformanceSection";
import { HolisticDevelopmentSection } from "./components/HolisticDevelopmentSection";
import { AcademicPerformanceSection } from "./components/AcademicPerformanceSection";
import { fetchActiveAcademicYear } from "./services/principalDashboardService";
import { useEffect, useState } from "react";
import type { AcademicYear } from "../../../admin/pages/subjects/types/academicyear";

export function PrincipalDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { user } = useAuth();
  const { data, loading, error, rankingTerm, setRankingTerm } =
    usePrincipalDashboardData();

  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const gridStroke = darkMode
    ? "var(--color-grid-line-dark)"
    : "var(--color-grid-line)";
  const axisColor = darkMode ? "var(--color-axis-dark)" : "var(--color-axis)";

  useEffect(() => {
  fetchActiveAcademicYear()
    .then((data) => {
      setAcademicYear(data);
    })
    .catch((err) => console.error(err.message));
}, []);

  if (loading || !data) return <DashboardSkeleton textMuted={textMuted} />;
  if (error) return <DashboardError error={error} textMuted={textMuted} />;

  const ranking = data.subjectRankingByTerm[rankingTerm];

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-white bg-maroon-gradient shadow-panel">
        <GraduationCap
          size={280}
          strokeWidth={1}
          className="absolute -right-10 -bottom-14 opacity-[0.07] pointer-events-none rotate-15"
        />
        <div className="relative">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-bold tracking-widest uppercase mb-4 border border-white/10">
            {dateStr}
          </span>
          <h1 className="text-2xl sm:text-[32px] font-black leading-tight tracking-tight">
            Welcome, {user?.name ?? "Principal"}!
          </h1>
          <p className="text-sm sm:text-[15px] text-white/80 mt-3 max-w-xl leading-relaxed">
            Here's how the school is doing this{" "}
            <span className="font-bold text-white underline underline-offset-4 decoration-white/40">
              {data.currentTerm}
            </span>{" "}
            of School Year {academicYear?.label}
          </p>
        </div>
      </div>

      <OverviewCards
        overview={data.overview}
        currentTermLabel={data.currentTerm}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <TodaysAttendanceSection
        attendanceByGrade={data.attendanceByGrade}
        todaysAttendance={data.todaysAttendance}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />

      <SubjectPerformanceSection
        topSubjectPerGrade={data.topSubjectPerGrade}
        ranking={ranking}
        rankingTerm={rankingTerm}
        onRankingTermChange={setRankingTerm}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <HolisticDevelopmentSection
        domains={data.holisticDomains}
        rubric={data.holisticRubric}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />

      <AcademicPerformanceSection
        performanceByGrade={data.performanceByGrade}
        performanceTrend={data.performanceTrend}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />
    </div>
  );
}

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
import { fetchActiveAcademicYear } from "./services/principalDashboard.service";
import { FullRankingModal } from "./components/FullRankingModal";
import { useEffect, useState } from "react";
import type { AcademicYear } from "../../../admin/pages/subjects/types/academicyear";

export function PrincipalDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { user } = useAuth();
  const { data, loading, error, rankingTerm, setRankingTerm } =
    usePrincipalDashboardData();

  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [showFullRanking, setShowFullRanking] = useState(false);

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

  // Early returns muna bago i-access ang anumang property ng `data` —
  // dito pa lang alam ni TypeScript na hindi na null ang `data` sa ibaba.
  if (loading) return <DashboardSkeleton textMuted={textMuted} darkMode={darkMode} />;
  if (error) return <DashboardError error={error} textMuted={textMuted} />;
  if (!data) return <DashboardError error={new Error("No dashboard data available.")} textMuted={textMuted} />;

  const fullRanking = data.subjectRankingByTerm[rankingTerm] ?? [];
  const top5Ranking = fullRanking.slice(0, 5);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 font-sans sm:gap-5 xl:gap-6">
      {/* Header */}
      <div
        className="relative flex min-h-44 flex-col justify-center overflow-hidden rounded-[12px] p-5 text-white sm:min-h-52 sm:p-6 xl:p-8"
        style={{
          background: "linear-gradient(135deg, #550000 0%, #BB0000 100%)",
          boxShadow: "0 12px 32px rgba(85,0,0,0.2)",
        }}
      >
        <GraduationCap
          size={210}
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-12 -right-6 rotate-15 text-white/[0.07]"
        />
        <div className="relative">
          <span className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 sm:mb-4 sm:text-[11px]">
            {dateStr}
          </span>
          <h1 className="break-words text-xl leading-tight tracking-tight sm:text-2xl xl:text-[30px]">
            Welcome, {user?.name ?? "Principal"}!
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:text-[15px]">
            Here's how the school is doing this{" "}
            <span className="font-bold text-white underline underline-offset-4 decoration-white/40">
              {data.currentTerm}
            </span>{" "}
            of School Year {academicYear?.label ?? "…"}
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
        ranking={top5Ranking}
        rankingTerm={rankingTerm}
        onRankingTermChange={setRankingTerm}
        onExpandRanking={() => setShowFullRanking(true)}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      {showFullRanking && (
        <FullRankingModal
          ranking={fullRanking}
          term={rankingTerm}
          onTermChange={setRankingTerm}
          onClose={() => setShowFullRanking(false)}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
      )}

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

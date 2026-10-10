import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { lastKnownCount,rememberRows,skeletonRows } from "@shared/loading/reservations";
import { DashboardWelcomeBanner } from "@shared/components/DashboardWelcomeBanner";
import TodayDateCard from "../../../parent/pages/dashboard/components/TodayDateCard";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useAuth } from "../../../../auth/context/authContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import type { PrincipalDashboardData } from "./data/types";
import { usePrincipalDashboardData } from "./hooks/usePrincipalDashboardData";

import { useState } from "react";
import type { AcademicYear } from "../../../admin/pages/subjects/types/academicyear";
import { AcademicPerformanceSection } from "./components/AcademicPerformanceSection";
import { FullRankingModal } from "./components/FullRankingModal";
import { HolisticDevelopmentSection } from "./components/HolisticDevelopmentSection";
import { OverviewCards } from "./components/OverviewCards";
import { SubjectPerformanceSection } from "./components/SubjectPerformanceSection";
import { TodaysAttendanceSection } from "./components/TodaysAttendanceSection";
import { fetchActiveAcademicYear } from "./services/principalDashboard.service";

function usePrincipalDashboardHomeState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { user } = useAuth();
  const { data, loading, error, rankingTerm, setRankingTerm, refetch } =
    usePrincipalDashboardData();

  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [yearLoading, setYearLoading] = useState(true);
  const [yearError, setYearError] = useState<Error | null>(null);
  const [yearAttempt, setYearAttempt] = useState(0);
  const [showFullRanking, setShowFullRanking] = useState(false);

  const gridStroke = darkMode
    ? "var(--color-grid-line-dark)"
    : "var(--color-grid-line)";
  const axisColor = darkMode ? "var(--color-axis-dark)" : "var(--color-axis)";
  const renderData = (pending: boolean) => {
    const placeholderCount = Math.min(lastKnownCount("principal-dashboard-grades", 3), skeletonRows("principal-dashboard-grades", undefined, 140));
    const rankingCount = Math.min(lastKnownCount("principal-dashboard-ranking", 3), skeletonRows("principal-dashboard-ranking", undefined, 112));
    const current: PrincipalDashboardData = pending ? {
      overview: {totalStudents:0,totalTeachers:0,attendance:0,academicPerf:0,needsIntervention:0},
      todaysAttendance: {present:0,absent:0,concerning:0},
      attendanceByGrade: Array.from({length:placeholderCount},(_,index)=>({gradeLevelId:index,grade:"",type:"grade",attendance:55+(index%3)*12})),
      performanceByGrade: Array.from({length:placeholderCount},()=>({grade:"",score:65,sections:[]})),
      performanceTrend: ["Term 1","Term 2","Term 3"].map(term=>({term,performance:0,attendance:0,cognitive:0,emotional:0,behavioral:0,social:0,holisticAverage:0,overall:60})) as PrincipalDashboardData["performanceTrend"],
      topSubjectPerGrade: Array.from({length:placeholderCount},()=>({grade:"",subject:"",score:0,trend:"flat"})),
      subjectRankingByTerm: Object.fromEntries(["Term 1","Term 2","Term 3"].map(term=>[term,Array.from({length:rankingCount},(_,index)=>({rank:index+1,subject:"",grade:"",score:0,trend:"flat"}))])) as PrincipalDashboardData["subjectRankingByTerm"],
      holisticDomains: ["Cognitive","Emotional","Behavioral","Social"].map(domain=>({domain,score:3})) as PrincipalDashboardData["holisticDomains"],
      holisticRubric: {Cognitive:[],Emotional:[],Behavioral:[],Social:[]}, attentionItems:[],currentTerm:"Term 1",
    } : data!;
    if (!current) return null;
    const fullRanking = current.subjectRankingByTerm[rankingTerm] ?? [];
    const top5Ranking = fullRanking.slice(0,5);
    return (<div className="flex flex-col gap-4 sm:gap-5 xl:gap-6">
      <OverviewCards loading={pending}
        overview={current.overview}
        currentTermLabel={current.currentTerm}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <TodaysAttendanceSection loading={pending}
        attendanceByGrade={current.attendanceByGrade}
        todaysAttendance={current.todaysAttendance}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />

      <SubjectPerformanceSection loading={pending}
        topSubjectPerGrade={current.topSubjectPerGrade}
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

      <HolisticDevelopmentSection loading={pending}
        domains={current.holisticDomains}
        rubric={current.holisticRubric}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />

      <AcademicPerformanceSection loading={pending}
        performanceByGrade={current.performanceByGrade}
        performanceTrend={current.performanceTrend}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        gridStroke={gridStroke}
        axisColor={axisColor}
      />
</div>);
  };
  return { content: ((
    <div className="flex w-full min-w-0 flex-col gap-4 font-sans sm:gap-5 xl:gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
        <DashboardWelcomeBanner name={user?.name ?? "Principal"} description={<>
            Here's how the school is doing this{" "}
            <span >
              <LoadingRegion as="span" loading={loading && !error} name="principal-current-term" variable skeleton={<SkeletonText width="6ch" className="inline-block align-top" />}>{data?.currentTerm}</LoadingRegion>
            </span>{" "}
            of School Year <LoadingRegion as="span" loading={yearLoading} error={yearError} retry={() => setYearAttempt(value => value + 1)} name="principal-school-year" variable skeleton={<SkeletonText width="9ch" className="inline-block align-top" />}>{academicYear?.label}</LoadingRegion>
        </>} />
        <TodayDateCard panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />
      </div>
      <LoadingRegion loading={loading} error={error} retry={refetch} name="principal-dashboard-data" variable retainPrevious hasContent={Boolean(data)} skeleton={null} frame={renderData} onSettled={() => { if (data) {rememberRows("principal-dashboard-grades", data.topSubjectPerGrade.length); rememberRows("principal-dashboard-ranking", data.subjectRankingByTerm[rankingTerm]?.length ?? 0);} }}>{null}</LoadingRegion>
    </div>
  )), scope: { setYearLoading, setYearError, fetchActiveAcademicYear, setAcademicYear, yearAttempt } };
}


export type PrincipalDashboardHomeEffectScope = ReturnType<typeof usePrincipalDashboardHomeState>["scope"];
export type PrincipalDashboardHomeRouteProps = Record<string, never>;
export function PrincipalDashboardHomeComposition(props: object & { effects?: (scope: PrincipalDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalDashboardHomeState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

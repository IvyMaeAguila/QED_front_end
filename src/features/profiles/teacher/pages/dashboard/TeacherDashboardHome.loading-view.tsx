import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useAuth } from "../../../../auth/context/authContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { MiniCalendar } from "./components/MiniCalendar";
import { QuickDateCard } from "./components/QuickDateCard";
import type { StatItem } from "./components/Statcards";
import { StatCards } from "./components/Statcards";
import { TodayAttendance } from "./components/TodayAttendance";
import type { EventItem } from "./components/UpcomingEvents";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { WeeklySchedule } from "./components/WeeklySchedule";
import { WelcomeBanner } from "./components/WelcomeBanner";
import {
fetchAttendanceSummary,
fetchDashboardSummary,
fetchTeacherStats,
fetchUpcomingEvents,
fetchWeeklySchedule,
type AttendanceSummary,
type DashboardSummary,
type TeacherStats,
type WeeklyScheduleItem
} from "./services/dashboard.service";

function useTeacherDashboardHomeState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsData, setStatsData] = useState<TeacherStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [agenda, setAgenda] = useState<WeeklyScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);

  const stats: StatItem[] = [
    {
      label: "Advisory Students",
      value: statsData?.advisoryClassCount ?? 0,
      variant: "primary",
      onClick: () => navigate("/teacher/advisory"),
    },
    {
      label: "Total Students",
      value: statsData?.totalStudents ?? 0,
      variant: "default",
    },
    {
      label: "Assigned Subject Classes",
      value: statsData?.totalClasses ?? 0,
      variant: "default",
    },
  ];

  return { content: ((
    <div className="flex flex-col gap-4 sm:gap-5 xl:gap-6">
      {errors.length > 0 && <div role="alert" className={`rounded-xl border p-4 ${panelBg} ${panelBorder} ${textPrimary}`}>
        <p>Unable to load: {errors.map(section => section === "agenda" ? "weekly schedule" : section).join(", ")}. Other sections are available.</p>
        <button className="mt-2 font-semibold underline" onClick={() => setRefresh(value => value + 1)}>Retry</button>
      </div>}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:gap-6">
          <WelcomeBanner name={user?.name || summary?.name || "Teacher"} loading={!user?.name && loading}/>
          {!errors.includes("statistics") && <StatCards stats={stats} loading={loading} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted}/>}
          {!errors.includes("attendance") && <TodayAttendance loading={loading}
            hasAdvisoryStudents={attendance?.hasAdvisory ?? (errors.includes("statistics") || (statsData?.advisoryClassCount ?? 0) > 0)}
            recordedCount={attendance?.recordedCount} present={attendance?.present ?? 0} absent={attendance?.absent ?? 0} late={attendance?.late ?? 0}
            panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode} onViewFull={() => navigate("/teacher/attendance/records")}/>}
          {!errors.includes("agenda") && <WeeklySchedule schedule={agenda} loading={loading} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode}/>}
        </div>
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:gap-6">
          <QuickDateCard panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted}/>
          <MiniCalendar panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted}/>
          {!errors.includes("events") && <UpcomingEvents events={events} loading={loading} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode}/>}
        </div>
      </div>
    </div>
  )), scope: { setLoading, setErrors, fetchDashboardSummary, fetchTeacherStats, fetchAttendanceSummary, fetchUpcomingEvents, fetchWeeklySchedule, setSummary, setStatsData, setAttendance, setEvents, setAgenda, refresh } };
}


export type TeacherDashboardHomeEffectScope = ReturnType<typeof useTeacherDashboardHomeState>["scope"];
export type TeacherDashboardHomeRouteProps = Record<string, never>;
export function TeacherDashboardHomeComposition(props: object & { effects?: (scope: TeacherDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = useTeacherDashboardHomeState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

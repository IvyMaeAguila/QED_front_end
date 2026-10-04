import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchDashboardSummary,
  fetchTeacherStats,
  fetchAttendanceSummary,
  fetchUpcomingEvents,
  fetchTodaysAgenda,
  type DashboardSummary,
  type TeacherStats,
  type AttendanceSummary,
  type AgendaItem
} from "./services/dashboard.service";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { QuickDateCard } from "./components/QuickDateCard";
import { StatCards } from "./components/Statcards";
import type { StatItem } from "./components/Statcards";
import { TodayAttendance } from "./components/TodayAttendance";
import { TodayAgenda } from "./components/TodayAgenda";
import { UpcomingEvents } from "./components/UpcomingEvents";
import type { EventItem } from "./components/UpcomingEvents";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";

export function TeacherDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsData, setStatsData] = useState<TeacherStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardSummary(),
      fetchTeacherStats(),
      fetchAttendanceSummary(),
      fetchUpcomingEvents(),
      fetchTodaysAgenda(),
    ])
      .then(([summaryData, stats, attendanceData, eventsData, agendaData]) => {
        setSummary(summaryData);
        setStatsData(stats);
        setAttendance(attendanceData);
        setEvents(eventsData);
        setAgenda(agendaData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  const stats: StatItem[] = [
    {
      label: "Advisory Class",
      value: statsData?.advisoryClassCount ?? 0,
      variant: "primary",
      onClick: () => navigate("/teacher/advisory"),
    },
    {
      label: "Total Student",
      value: statsData?.totalStudents ?? 0,
      variant: "default",
    },
    {
      label: "Total Classes",
      value: statsData?.totalClasses ?? 0,
      variant: "default",
    },
  ];

  const shimmer = `relative overflow-hidden rounded-lg ${darkMode ? "bg-white/[0.06]" : "bg-black/[0.06]"}`;
  const shimmerSweep = (
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
      style={{
        background: darkMode
          ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
      }}
    />
  );

  const Bone = ({ className = "" }: { className?: string }) => (
    <div className={`${shimmer} ${className}`}>{shimmerSweep}</div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5 xl:gap-6">
      {loading && (
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      )}

      {/* Main two-column layout: left = main content, right = date/schedule sidebar */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)] xl:gap-6">
        {/* LEFT: Main content column */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:gap-6">
          {/* Welcome Banner */}
          {loading ? (
            <div
              className={`min-h-44 rounded-[12px] border p-5 sm:min-h-52 sm:p-6 xl:p-8 ${panelBg} ${panelBorder}`}
            >
              <Bone className="h-5 w-28 rounded-full" />
              <Bone className="mt-5 h-8 w-64" />
              <Bone className="mt-4 h-4 w-full max-w-md" />
              <Bone className="mt-2 h-4 w-3/4 max-w-sm" />
            </div>
          ) : (
            <WelcomeBanner
              name={summary?.name || "Teacher"}
              classesToday={summary?.classesToday || 0}
              pendingGrades={summary?.pendingGrades || 0}
            />
          )}

          {/* Key Metrics Row */}
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 xl:gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`rounded-[12px] border p-4 sm:p-5 ${panelBg} ${panelBorder}`}
                >
                  <Bone className="mb-4 h-11 w-11 rounded-xl" />
                  <Bone className="mb-3 h-3 w-24 rounded-full" />
                  <Bone className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <StatCards
              stats={stats}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
            />
          )}

          {/* Today Attendance */}
          {loading ? (
            <div
              className={`overflow-hidden rounded-[12px] border ${panelBg} ${panelBorder}`}
              style={{
                boxShadow:
                  "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className={`flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6 ${panelBorder}`}
              >
                <div className="flex items-center gap-2.5">
                  <Bone className="h-4 w-4 rounded-md" />
                  <Bone className="h-4 w-40" />
                </div>
                <Bone className="h-3 w-20" />
              </div>

              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`rounded-[12px] border p-4 text-center sm:p-5 ${panelBorder}`}
                    style={{
                      background: darkMode
                        ? "rgba(255,255,255,0.02)"
                        : "#F8FAFC",
                    }}
                  >
                    <Bone className="h-2.5 w-16 mx-auto rounded-full" />
                    <Bone className="h-9 w-12 mx-auto mt-3" />
                    <Bone className="h-1 w-full mt-4 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TodayAttendance
              present={attendance?.present ?? 0}
              absent={attendance?.absent ?? 0}
              late={attendance?.late ?? 0}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              darkMode={darkMode}
              onViewFull={() => navigate("/teacher/attendance/records")}
            />
          )}
        </div>

        {/* RIGHT: Date / schedule sidebar */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:gap-6">
          <QuickDateCard
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          <TodayAgenda
            agenda={agenda}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />

          <UpcomingEvents
            events={events}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}

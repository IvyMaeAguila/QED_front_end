import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen } from "lucide-react";
import {
  fetchDashboardSummary,
  fetchTeacherStats,
  fetchAttendanceSummary,
  fetchUpcomingEvents,
  type DashboardSummary,
  type TeacherStats,
  type AttendanceSummary,
} from "./services/dashboard.service";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { QuickDateCard } from "./components/QuickDateCard";
import { StatCards } from "./components/Statcards";
import type { StatItem } from "./components/Statcards";
import { TodayAttendance } from "./components/TodayAttendance";
import { TodayAgenda } from "./components/TodayAgenda";
import { UpcomingEvents } from "./components/UpcomingEvents";
import type { EventItem } from "./components/UpcomingEvents";
import {
  TEACHER_AGENDA,
} from "./data/TeacherDashboardData";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";

export function TeacherDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsData, setStatsData] = useState<TeacherStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardSummary(),
      fetchTeacherStats(),
      fetchAttendanceSummary(),
      fetchUpcomingEvents(),
    ])
      .then(([summaryData, stats, attendanceData, eventsData]) => {
        setSummary(summaryData);
        setStatsData(stats);
        setAttendance(attendanceData);
        setEvents(eventsData);
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
      Icon: Users,
      variant: "primary",
      onClick: () => navigate("/teacher/advisory"),
    },
    {
      label: "Total Student",
      value: statsData?.totalStudents ?? 0,
      Icon: GraduationCap,
      variant: "default",
    },
    {
      label: "Total Classes",
      value: statsData?.totalClasses ?? 0,
      Icon: BookOpen,
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
    <div className="flex flex-col gap-6">
      {loading && (
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      )}

      {/* Main two-column layout: left = main content, right = date/schedule sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* LEFT: Main content column */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          {/* Welcome Banner */}
          {loading ? (
            <div
              className={`rounded-2xl border p-8 sm:p-10 min-h-55 ${panelBg} ${panelBorder}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-7 ${panelBg} ${panelBorder}`}
                >
                  <Bone className="w-14 h-14 rounded-2xl mb-6" />
                  <Bone className="h-3 w-24 rounded-full mb-3" />
                  <Bone className="h-9 w-16" />
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
              className={`rounded-2xl border overflow-hidden ${panelBg} ${panelBorder}`}
              style={{
                boxShadow:
                  "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className={`px-8 py-6 border-b flex items-center justify-between ${panelBorder}`}
              >
                <div className="flex items-center gap-3">
                  <Bone className="h-4.5 w-4.5 rounded-md" />
                  <Bone className="h-4 w-40" />
                </div>
                <Bone className="h-3 w-20" />
              </div>

              <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-6 border text-center ${panelBorder}`}
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
        <div className="xl:col-span-1 flex flex-col gap-6">
          <QuickDateCard
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          <TodayAgenda
            agenda={TEACHER_AGENDA}
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
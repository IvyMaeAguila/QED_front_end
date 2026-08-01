import { useNavigate, useOutletContext } from "react-router-dom";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { QuickDateCard } from "./components/QuickDateCard";
import { StatCards } from "./components/Statcards";
import { TodayAttendance } from "./components/TodayAttendance";
import { GradeTrendAnalytics } from "./components/GradeTrendAnalytics";
import { MiniCalendar } from "./components/MiniCalendar";
import { TodayAgenda } from "./components/TodayAgenda";
import { UpcomingEvents } from "./components/UpcomingEvents";
import {
  TEACHER_STATS,
  TEACHER_ATTENDANCE,
  TEACHER_GRADE_TRENDS,
  TEACHER_EVENTS,
  TEACHER_AGENDA,
} from "./data/TeacherDashboardData";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";

export function TeacherDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const stats = TEACHER_STATS.map((stat) =>
    stat.label === "Advisory Class"
      ? { ...stat, onClick: () => navigate("/teacher/advisory") }
      : stat,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero + Quick Date */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        <div className="xl:col-span-3">
          <WelcomeBanner name="Ms. Santos" classesToday={4} pendingGrades={14} />
        </div>
        <QuickDateCard
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>

      {/* Key Metrics Row */}
      <StatCards
        stats={stats}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main content */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <TodayAttendance
            present={TEACHER_ATTENDANCE.present}
            absent={TEACHER_ATTENDANCE.absent}
            late={TEACHER_ATTENDANCE.late}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            darkMode={darkMode}
          />

          <GradeTrendAnalytics
            subjects={TEACHER_GRADE_TRENDS}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <MiniCalendar
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
          <TodayAgenda agenda={TEACHER_AGENDA} />
          <UpcomingEvents events={TEACHER_EVENTS} />
        </div>
      </div>
    </div>
  );
}
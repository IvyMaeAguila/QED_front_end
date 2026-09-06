import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../shared/components/DashboardUI";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useTeacherSchedule } from "./hooks/useTeacherSchedule";
import { groupScheduleByDay } from "./utils/schedule";
import { TeacherSummaryStats } from "./components/TeacherSummaryStats";
import { ScheduleByDay } from "./components/ScheduleByDay";
import { TeacherNotFound } from "./components/TeacherNotFound";

export function TeacherSchedulePage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();

  const id = teacherId ? decodeURIComponent(teacherId) : "";
  const { teacher, schoolYear, loading, notFound } = useTeacherSchedule(id);

  if (loading) {
    return <p className={`text-sm ${textMuted}`}>Loading schedule…</p>;
  }

  if (notFound || !teacher) {
    return <TeacherNotFound panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />;
  }

  const scheduleByDay = groupScheduleByDay(teacher.schedule);

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/principal/teachers")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div>
          <h1 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${textPrimary}`}>{teacher.fullName}</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>School Year {schoolYear}</p>
        </div>
      </div>

      <TeacherSummaryStats
        teacher={teacher}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <ScheduleByDay
        scheduleByDay={scheduleByDay}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </div>
  );
}

import { useEffect } from "react";
import { TeacherDashboardHomeComposition,type TeacherDashboardHomeEffectScope } from "./TeacherDashboardHome.loading-view";
export * from "./TeacherDashboardHome.loading-view";

function TeacherDashboardHomeDataEffects({ scope }: { scope: TeacherDashboardHomeEffectScope }) {
 const { setLoading, setErrors, fetchDashboardSummary, fetchTeacherStats, fetchAttendanceSummary, fetchUpcomingEvents, fetchWeeklySchedule, setSummary, setStatsData, setAttendance, setEvents, setAgenda, refresh } = scope;
 useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    Promise.allSettled([
      fetchDashboardSummary(),
      fetchTeacherStats(),
      fetchAttendanceSummary(),
      fetchUpcomingEvents(),
      fetchWeeklySchedule(),
    ])
      .then(([summaryData, stats, attendanceData, eventsData, agendaData]) => {
        if (cancelled) return;
        if (summaryData.status === "fulfilled") setSummary(summaryData.value);
        if (stats.status === "fulfilled") setStatsData(stats.value);
        if (attendanceData.status === "fulfilled") setAttendance(attendanceData.value);
        if (eventsData.status === "fulfilled") setEvents(eventsData.value);
        if (agendaData.status === "fulfilled") setAgenda(agendaData.value);
        const results = [summaryData, stats, attendanceData, eventsData, agendaData];
        setErrors(["profile", "statistics", "attendance", "events", "agenda"].filter((_, index) => results[index].status === "rejected"));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refresh]);
 return null;
}

export function TeacherDashboardHome() {
 return <TeacherDashboardHomeComposition effects={scope => <TeacherDashboardHomeDataEffects scope={scope}/>} />;
}

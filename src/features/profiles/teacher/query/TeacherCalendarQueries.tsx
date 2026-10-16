import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { CalendarPageViewComposition, type CalendarPageViewRouteProps } from "@shared/calendar/CalendarPageView.loading-view";
import { fetchAllCalendarActivities, fetchAllCalendarHolidays, fetchCalendarActivities, fetchCalendarHolidays } from "@shared/calendar/services/calendar.service";
import { useTeacherReader } from "./useTeacherReader";

function CalendarQueries(props: CalendarPageViewRouteProps) {
  const reader = useTeacherReader(["calendar", "snapshot", new Date().toLocaleDateString("en-CA")], async options => {
    // Every request checks its own401 before parsing, including after a peer fails.
    const [activities, holidays, allActivities, allHolidays] = await Promise.all([
      fetchCalendarActivities(options), fetchCalendarHolidays(options),
      fetchAllCalendarActivities(options), fetchAllCalendarHolidays(options),
    ]);
    return { activities, holidays, allActivities, allHolidays };
  }, error => error instanceof Error ? error.message : "Failed to load calendar.");
  return <CalendarPageViewComposition {...props} data={{
    activities: reader.data?.activities ?? [], holidays: reader.data?.holidays ?? [],
    allActivities: reader.data?.allActivities ?? [], allHolidays: reader.data?.allHolidays ?? [],
    loading: reader.loading, error: reader.error, offline: reader.offline, retry: reader.retry,
  }}/>;
}
export default function TeacherCalendarQueries(props: CalendarPageViewRouteProps) {
  return <QueryClientProvider client={queryClient}><CalendarQueries {...props}/></QueryClientProvider>;
}

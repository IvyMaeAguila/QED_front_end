import {safeReadOptions} from '@shared/query/safeReadPolicy';
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { useTeacherQueryScope } from "../../query/teacherQueryScope";
import { TeacherDashboardHomeComposition } from "./TeacherDashboardHome.loading-view";
import { fetchAttendanceSummary, fetchDashboardSummary, fetchTeacherStats, fetchUpcomingEvents, fetchWeeklySchedule } from "./services/dashboard.service";
export { TeacherDashboardHomeComposition } from "./TeacherDashboardHome.loading-view";
export type { TeacherDashboardHomeEffectScope, TeacherDashboardHomeRouteProps } from "./TeacherDashboardHome.loading-view";

function TeacherDashboardQueries() {
  const scope = useTeacherQueryScope();
  const options={...scope.options,...safeReadOptions};
  // These endpoints derive the active year/day on the server, with no term parameter.
  const today = new Date().toLocaleDateString("en-CA");
  const key = (resource: string, ...params: (string | number)[]) => [...scope.key, "dashboard", resource, today, ...params];
  const summary = useQuery({ ...options, queryKey: key("summary"), queryFn: ({ signal }) => fetchDashboardSummary(scope.request(signal)) });
  const stats = useQuery({ ...options, queryKey: key("statistics"), queryFn: ({ signal }) => fetchTeacherStats(scope.request(signal)) });
  const attendance = useQuery({ ...options, queryKey: key("attendance"), queryFn: ({ signal }) => fetchAttendanceSummary(scope.request(signal)) });
  const events = useQuery({ ...options, queryKey: key("events", 5), queryFn: ({ signal }) => fetchUpcomingEvents(5, scope.request(signal)) });
  const agenda = useQuery({ ...options, queryKey: key("agenda"), queryFn: ({ signal }) => fetchWeeklySchedule(scope.request(signal)) });
  const queries = [summary, stats, attendance, events, agenda];
  const offline = !scope.online || queries.some(query => query.isPaused);
  const visible = <T,>(data: T | undefined, error: unknown) => scope.enabled && !(error instanceof QueryHttpError && [401, 403].includes(error.status)) ? data : undefined;
  const errors = ["profile", "statistics", "attendance", "events", "agenda"].filter((_, i) => scope.enabled && (queries[i].isError || (offline && queries[i].data === undefined)));
  return <TeacherDashboardHomeComposition data={{
    summary: visible(summary.data, summary.error) ?? null,
    statsData: visible(stats.data, stats.error) ?? null,
    attendance: visible(attendance.data, attendance.error) ?? null,
    events: visible(events.data, events.error) ?? [],
    agenda: visible(agenda.data, agenda.error) ?? [],
    errors, offline,
    cachedSections:queries.flatMap((q,i)=>visible(q.data,q.error)!==undefined?[["profile","statistics","attendance","events","agenda"][i]]:[]),
    loading: !scope.enabled || (!offline && queries.some(query => query.isFetching || (query.isPending && !query.isError))),
    retry: () => {
      if (!scope.enabled || offline || queries.some(query => query.isFetching || query.isPaused)) return;
      const failed=queries.filter(q=>q.isError||q.data===undefined);
      (failed.length?failed:queries).forEach(query => { void query.refetch({ cancelRefetch: false }); });
    },
  }}/>;
}
export function TeacherDashboardHome() {
  return <QueryClientProvider client={queryClient}><TeacherDashboardQueries/></QueryClientProvider>;
}

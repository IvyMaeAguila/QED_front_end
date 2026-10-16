import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { onlineManager, QueryClientProvider, useMutation, useQueries } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { queryClient } from "@shared/query/queryClient";
import { CalendarPageComposition, type CalendarData } from "./CalendarPage.loading-view";
import * as service from "./services/calendar.service";

const calendarKeys = (session: number, role: string, user: string) => ["session", session, role, user, "principal", "calendar"] as const;
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const connected = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof Error && 'status' in error && error.status === 403;

function CalendarQueries() {
  const { user, sessionScope, isLoading, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, connected);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const active = useRef(false);
  useLayoutEffect(() => {
    active.current = true;
    onlineManager.setOnline(navigator.onLine);
    return () => { active.current = false; };
  }, []);
  const prefix = calendarKeys(sessionScope, user?.role ?? '', String(user?.id ?? ''));
  const options = (signal?: AbortSignal) => ({ signal, onUnauthorized: () => {
    if (active.current && !signal?.aborted) expireSession(sessionScope);
  } });
  const queries = useQueries({ queries: [
    { resource: 'activities', read: service.fetchCalendarActivities },
    { resource: 'holidays', read: service.fetchCalendarHolidays },
    { resource: 'all-activities', read: service.fetchAllCalendarActivities },
    { resource: 'all-holidays', read: service.fetchAllCalendarHolidays },
  ].map(({resource, read}) => ({
    queryKey: [...prefix, resource], enabled, staleTime: 30_000, gcTime: 5 * 60_000,
    retry: false, refetchOnWindowFocus: false, refetchOnReconnect: true,
    queryFn: ({signal}: {signal: AbortSignal}) => read(options(signal)),
  })) });
  const write = useMutation({ retry: false, networkMode: 'always',
    mutationFn: async ({run}: {kind: "activities" | "holidays"; run: (options: service.CalendarRequestOptions) => Promise<unknown>}) => {
      if (!enabled || !active.current) throw new Error('Calendar access denied.');
      if (!onlineManager.isOnline()) throw new Error('You are offline. Reconnect and try again.');
      return run(options());
    },
    onSuccess: async (_result, {kind}) => {
      if (!active.current) return;
      await queryClient.invalidateQueries({queryKey: prefix, predicate: query => [kind, "all-" + kind].includes(String(query.queryKey.at(-1)))});
    },
  });
  const denied = queries.some(q => forbidden(q.error));
  const offline = !online || queries.some(q => q.isPaused);
  const error = queries.find(q => q.error)?.error;
  const data: CalendarData = {
    activities: enabled && !denied ? queries[0].data ?? [] : [],
    holidays: enabled && !denied ? queries[1].data ?? [] : [],
    allActivities: enabled && !denied ? queries[2].data ?? [] : [],
    allHolidays: enabled && !denied ? queries[3].data ?? [] : [],
    loading: !enabled || (!offline && queries.some(q => q.data === undefined && (q.isPending || q.isFetching))),
    cachedOffline: offline && !denied && queries.every(q => q.data !== undefined),
    error: offline ? 'You are offline. Reconnect and try again.' : error?.message ?? null,
    retry: () => { if (enabled && online && !queries.some(q => q.isFetching || q.isPaused)) {
      for (const query of queries) void query.refetch({cancelRefetch: false});
    } },
    saveActivities: entries => write.mutateAsync({kind: "activities", run: o => service.createCalendarActivities(entries.map(e => ({title:e.title.trim(),date:e.date})), undefined, o)}),
    saveHolidays: entries => write.mutateAsync({kind: "holidays", run: o => service.createCalendarHolidays(entries.map(e => ({title:e.title.trim(),date:e.date,type:e.holidayType})), undefined, o)}),
    edit: (state,value) => write.mutateAsync({kind: state.kind === 'activity' ? 'activities' : 'holidays', run: o => state.kind === 'activity'
      ? service.updateCalendarActivity(state.entry.id, {title:value.title,date:value.date}, o)
      : service.updateCalendarHoliday(state.entry.id, {title:value.title,date:value.date,type:value.holidayType}, o)}),
    remove: state => write.mutateAsync({kind: state.kind === 'activity' ? 'activities' : 'holidays', run: o => state.kind === 'activity'
      ? service.deleteCalendarActivityApi(state.entry.id, o) : service.deleteCalendarHolidayApi(state.entry.id, o)}),
  };
  return <CalendarPageComposition viewerRole="PRINCIPAL" data={data}/>;
}
function Boundary() {
  const {sessionScope,user} = useAuth();
  return <CalendarQueries key={sessionScope+':'+user?.role+':'+user?.id}/>;
}
export default function PrincipalCalendarQueries() {
  return <QueryClientProvider client={queryClient}><Boundary/></QueryClientProvider>;
}

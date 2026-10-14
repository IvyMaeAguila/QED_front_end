import { lazy, Suspense, useEffect } from "react";
import { CalendarPageComposition,type CalendarPageEffectScope,type CalendarPageRouteProps } from "./CalendarPage.loading-view";
export * from "./CalendarPage.loading-view";

function CalendarPageDataEffects({ scope }: { scope: CalendarPageEffectScope }) {
 const { setLoading, setError, fetchCalendarActivities, fetchCalendarHolidays, fetchAllCalendarActivities, fetchAllCalendarHolidays, setActivities, setHolidays, setAllActivities, setAllHolidays, attempt } = scope;
 useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCalendarActivities(),
      fetchCalendarHolidays(),
      fetchAllCalendarActivities(),
      fetchAllCalendarHolidays(),
    ])
      .then(([activityData, holidayData, allActivityData, allHolidayData]) => {
        if (cancelled) return;
        setActivities(activityData);
        setHolidays(holidayData);
        setAllActivities(allActivityData);
        setAllHolidays(allHolidayData);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load calendar.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
 return null;
}

const PrincipalCalendar = lazy(() => import("./PrincipalCalendarQueries"));
const AdminCalendar = lazy(() => import('../../features/profiles/admin/query/AdminCalendarQueries'));

export function CalendarPage(props: CalendarPageRouteProps) {
 if (props.viewerRole === "PRINCIPAL") return <Suspense fallback={<CalendarPageComposition {...props}/>}><PrincipalCalendar/></Suspense>;
 if(props.viewerRole===undefined||props.viewerRole==='ADMIN')return <Suspense fallback={<CalendarPageComposition {...props}/>}><AdminCalendar/></Suspense>;
 return <CalendarPageComposition {...props} effects={scope => <CalendarPageDataEffects scope={scope}/>} />;
}

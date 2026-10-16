import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@shared/hooks/useAuth";
import { CalendarPageViewComposition,type CalendarPageViewEffectScope,type CalendarPageViewRouteProps } from "./CalendarPageView.loading-view";
export { CalendarPageViewComposition } from "./CalendarPageView.loading-view";
export type { CalendarPageViewEffectScope, CalendarPageViewRouteProps, CalendarViewData } from "./CalendarPageView.loading-view";
const TeacherCalendarQueries = lazy(() => import("../../features/profiles/teacher/query/TeacherCalendarQueries"));
const ParentCalendarQueries = lazy(() => import("../../features/profiles/parent/query/ParentCalendarQueries"));

function CalendarPageViewDataEffects({ scope }: { scope: CalendarPageViewEffectScope }) {
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
  }, [attempt, fetchCalendarActivities, fetchCalendarHolidays, fetchAllCalendarActivities, fetchAllCalendarHolidays, setLoading, setError, setActivities, setHolidays, setAllActivities, setAllHolidays]);
 return null;
}

export function CalendarPageView(props: CalendarPageViewRouteProps) {
 const { user, isLoading } = useAuth();
 if (isLoading) return <CalendarPageViewComposition {...props}/>;
 if (user?.role === "TEACHER") return <Suspense fallback={<CalendarPageViewComposition {...props}/>}><TeacherCalendarQueries {...props}/></Suspense>;
 if (user?.role === "PARENT") return <Suspense fallback={<CalendarPageViewComposition {...props}/>}><ParentCalendarQueries {...props}/></Suspense>;
 return <CalendarPageViewComposition {...props} effects={scope => <CalendarPageViewDataEffects scope={scope}/>} />;
}

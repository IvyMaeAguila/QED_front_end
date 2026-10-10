import { useEffect } from "react";
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

export function CalendarPage(props: CalendarPageRouteProps) {
 return <CalendarPageComposition {...props} effects={scope => <CalendarPageDataEffects scope={scope}/>} />;
}

import { useEffect } from "react";
import { CalendarPageViewComposition,type CalendarPageViewEffectScope,type CalendarPageViewRouteProps } from "./CalendarPageView.loading-view";
export * from "./CalendarPageView.loading-view";

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
  }, [attempt]);
 return null;
}

export function CalendarPageView(props: CalendarPageViewRouteProps) {
 return <CalendarPageViewComposition {...props} effects={scope => <CalendarPageViewDataEffects scope={scope}/>} />;
}

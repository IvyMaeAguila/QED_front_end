import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarRange, CalendarHeart } from "lucide-react";
import { MonthGrid } from "./components/MonthGrid";
import { ActivitiesCard, ActivityGroupList } from "./components/ActivitiesCard";
import { HolidaysCard, HolidayGroupList } from "./components/HolidaysCard";
import { ExpandedListModal } from "./components/ExpandedListModal";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import {
  type CalendarActivity,
  type CalendarHoliday,
  type Role,
} from "./types/Calendar";
import {
  fetchCalendarActivities,
  fetchAllCalendarActivities,
  fetchCalendarHolidays,
  fetchAllCalendarHolidays,
} from "./services/calendar.service";

interface CalendarPageProps {
  viewerRole?: Role;
}

type ExpandTarget = "activity" | "holiday" | null;

export function CalendarPageView({}: CalendarPageProps) {
  const theme = useOutletContext<AdminThemeContext>();
  if (!theme) return null;

  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [holidays, setHolidays] = useState<CalendarHoliday[]>([]);
  const [allActivities, setAllActivities] = useState<CalendarActivity[]>([]);
  const [allHolidays, setAllHolidays] = useState<CalendarHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [expandTarget, setExpandTarget] = useState<ExpandTarget>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
  }, []);

  const eventDatesISO = useMemo(() => {
    const dates = new Set<string>();
    for (const a of activities) dates.add(a.date);
    for (const h of holidays) dates.add(h.date);
    return dates;
  }, [activities, holidays]);

  function shiftMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
          Calendar
        </h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
          View your schedule and upcoming events.
        </p>
      </div>

      {error && <p className="text-sm font-semibold text-[#B91C1C]">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
        <MonthGrid
          viewDate={viewDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          eventDatesISO={eventDatesISO}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />

        <div className="space-y-4">
          <ActivitiesCard
            activities={activities}
            viewDate={viewDate}
            onExpand={() => setExpandTarget("activity")}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          <HolidaysCard
            holidays={holidays}
            viewDate={viewDate}
            onExpand={() => setExpandTarget("holiday")}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        </div>
      </div>

      {loading && (
        <p className={`text-sm font-semibold ${textMuted}`}>
          Loading calendar…
        </p>
      )}

      {expandTarget === "activity" && (
        <ExpandedListModal
          title="All Activities"
          icon={<CalendarRange size={15} />}
          onClose={() => setExpandTarget(null)}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        >
          <ActivityGroupList
            activities={allActivities}
            darkMode={darkMode}
            textMuted={textMuted}
          />
        </ExpandedListModal>
      )}

      {expandTarget === "holiday" && (
        <ExpandedListModal
          title="All Holidays"
          icon={<CalendarHeart size={15} />}
          onClose={() => setExpandTarget(null)}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        >
          <HolidayGroupList
            holidays={allHolidays}
            darkMode={darkMode}
            textMuted={textMuted}
          />
        </ExpandedListModal>
      )}
    </div>
  );
}
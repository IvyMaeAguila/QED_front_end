import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarRange, CalendarHeart } from "lucide-react";
import { MonthGrid } from "../../../../../shared/calendar/components/MonthGrid";
import {
  ActivitiesCard,
  ActivityGroupList,
} from "../../../../../shared/calendar/components/ActivitiesCard";
import {
  HolidaysCard,
  HolidayGroupList,
} from "../../../../../shared/calendar/components/HolidaysCard";
import { ExpandedListModal } from "../../../../../shared/calendar/components/ExpandedListModal";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  type CalendarActivity,
  type CalendarHoliday,
  type Role,
} from "../../../../../shared/calendar/types/Calendar";
import {
  fetchCalendarActivities,
  fetchCalendarHolidays,
} from "../../../../../shared/calendar/services/calendar.service";

interface CalendarPageProps {
  viewerRole?: Role;
}

type ExpandTarget = "activity" | "holiday" | null;

// Read-only calendar view for Teacher / Parent.
// Walang add/edit/delete dito — Admin lang ang may access doon sa CalendarPage (management version).
export function CalendarPageView({ viewerRole = "TEACHER" }: CalendarPageProps) {
  const theme = useOutletContext<AdminThemeContext>();
  if (!theme) return null;

  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [holidays, setHolidays] = useState<CalendarHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [expandTarget, setExpandTarget] = useState<ExpandTarget>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchCalendarActivities(), fetchCalendarHolidays()])
      .then(([activityData, holidayData]) => {
        if (cancelled) return;
        setActivities(activityData);
        setHolidays(holidayData);
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
          {/* Walang ManageCalendarButton dito — Teacher/Parent ay view-only */}

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
          {/* NOTE: kung required ang onEdit/onDelete sa ActivityGroupList component mo,
              gawin mo munang optional (onEdit?: ..., onDelete?: ...) doon, o magdagdag
              ng `readOnly` prop na nagtatago ng edit/delete buttons kapag walang handlers. */}
          <ActivityGroupList
            activities={activities}
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
            holidays={holidays}
            darkMode={darkMode}
            textMuted={textMuted}
          />
        </ExpandedListModal>
      )}
    </div>
  );
}
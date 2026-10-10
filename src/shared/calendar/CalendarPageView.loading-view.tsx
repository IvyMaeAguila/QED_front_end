import { CalendarHeart,CalendarRange } from "lucide-react";
import { useMemo,useState } from "react";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import { ActivitiesCard,ActivityGroupList } from "./components/ActivitiesCard";
import { ExpandedListModal } from "./components/ExpandedListModal";
import { HolidayGroupList,HolidaysCard } from "./components/HolidaysCard";
import { MonthGrid } from "./components/MonthGrid";
import {
fetchAllCalendarActivities,
fetchAllCalendarHolidays,
fetchCalendarActivities,
fetchCalendarHolidays,
} from "./services/calendar.service";
import {
type CalendarActivity,
type CalendarHoliday,
type Role,
} from "./types/Calendar";

interface CalendarPageProps {
  viewerRole?: Role;
}

type ExpandTarget = "activity" | "holiday" | null;

function useCalendarPageViewState({}: CalendarPageProps) {
  const theme = useOutletContext<AdminThemeContext>();
  if (!theme) return { content: null, scope: null };

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

  const [attempt, setAttempt] = useState(0);

  const eventDatesISO = useMemo(() => {
    const dates = new Set<string>();
    for (const a of activities) dates.add(a.date);
    for (const h of holidays) dates.add(h.date);
    return dates;
  }, [activities, holidays]);

  function shiftMonth(delta: number) {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(nextMonth);
    setSelectedDate(nextMonth);
  }

  return { content: ((
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`qed-type-page-title ${textPrimary}`}>
          Calendar
        </h1>
        <p className={`qed-type-page-description mt-1 ${textMuted}`}>
          View your schedule and upcoming events.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(16rem,0.75fr)]">
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
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
            activities={activities}
            viewDate={viewDate}
            selectedDate={selectedDate}
            onExpand={() => setExpandTarget("activity")}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          <HolidaysCard
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
            holidays={holidays}
            viewDate={viewDate}
            selectedDate={selectedDate}
            onExpand={() => setExpandTarget("holiday")}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        </div>
      </div>

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
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
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
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
            holidays={allHolidays}
            darkMode={darkMode}
            textMuted={textMuted}
          />
        </ExpandedListModal>
      )}
    </div>
  )), scope: { setLoading, setError, fetchCalendarActivities, fetchCalendarHolidays, fetchAllCalendarActivities, fetchAllCalendarHolidays, setActivities, setHolidays, setAllActivities, setAllHolidays, attempt } };
}



export type CalendarPageViewEffectScope = NonNullable<ReturnType<typeof useCalendarPageViewState>["scope"]>;
export type CalendarPageViewRouteProps = Parameters<typeof useCalendarPageViewState>[0];
export function CalendarPageViewComposition(props: CalendarPageViewRouteProps & { effects?: (scope: CalendarPageViewEffectScope) => import("react").ReactNode }) {
 const state = useCalendarPageViewState(props);
 return <>{state.scope && props.effects?.(state.scope)}{state.content}</>;
}

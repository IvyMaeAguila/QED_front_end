import type {CalendarReadResource,CalendarReadStates} from './types/Calendar';
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
export interface CalendarViewData {
  reads?:CalendarReadStates;
  activities: CalendarActivity[];
  holidays: CalendarHoliday[];
  allActivities: CalendarActivity[];
  allHolidays: CalendarHoliday[];
  loading: boolean;
  error: string | null;
  offline: boolean;
  retry: () => void;
}

type ExpandTarget = "activity" | "holiday" | null;

function useCalendarPageViewState(data?: CalendarViewData) {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme ?? {} as AdminThemeContext;

  const [localActivities, setActivities] = useState<CalendarActivity[]>([]);
  const [localHolidays, setHolidays] = useState<CalendarHoliday[]>([]);
  const [localAllActivities, setAllActivities] = useState<CalendarActivity[]>([]);
  const [localAllHolidays, setAllHolidays] = useState<CalendarHoliday[]>([]);
  const [localLoading, setLoading] = useState(true);
  const [localError, setError] = useState<string | null>(null);
  const { activities, holidays, allActivities, allHolidays, loading, error } = data ?? {
    activities: localActivities, holidays: localHolidays, allActivities: localAllActivities,
    allHolidays: localAllHolidays, loading: localLoading, error: localError,
  };

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();

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
    setSelectedDate(undefined);
  }

  if (!theme) return { content: null, scope: null };
  const readProps=(name:CalendarReadResource)=>data?.reads?.[name]??{loading,error,retry:data?.retry ?? (() => setAttempt(value => value + 1))};
  return { content: ((
    <div className="space-y-6 pb-12">
      {data?.offline && (!error || !!data.reads) && <div role="alert" className={`rounded-xl border p-4 ${panelBg} ${panelBorder} ${textPrimary}`}>You're offline. Cached calendar records remain available. Reconnect and try again.</div>}
      {data?.reads && error && !data?.offline && <div role="alert" className={`rounded-xl border p-4 ${panelBg} ${panelBorder} ${textPrimary}`}><p>{error}</p><button type="button" className="mt-2 font-semibold underline" onClick={data.retry}>Retry</button></div>}
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
          onToday={() => { setViewDate(new Date()); setSelectedDate(undefined); }}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          eventDatesISO={eventDatesISO}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />

        <div className="min-w-0 space-y-4">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <h2 className={`qed-type-card-title ${textPrimary}`}>{selectedDate ? "Selected date" : "Upcoming events"}</h2>
            {selectedDate && <button type="button" className={`rounded-lg border px-3 py-2 text-sm font-semibold ${panelBg} ${panelBorder} ${textPrimary}`} onClick={() => setSelectedDate(undefined)}>Upcoming events</button>}
          </div>
          <ActivitiesCard
            {...readProps('activities')}
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
            {...readProps('holidays')}
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
            {...readProps('all-activities')}
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
            {...readProps('all-holidays')}
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
export type CalendarPageViewRouteProps = CalendarPageProps;
export function CalendarPageViewComposition(props: CalendarPageViewRouteProps & { data?: CalendarViewData; effects?: (scope: CalendarPageViewEffectScope) => import("react").ReactNode }) {
 const state = useCalendarPageViewState(props.data);
 return <>{state.scope && props.effects?.(state.scope)}{state.content}</>;
}

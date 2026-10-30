import type {CalendarReadResource,CalendarReadStates} from './types/Calendar';
import { useToast } from "@shared/context/ToastContext";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { CalendarHeart,CalendarRange } from "lucide-react";
import { useMemo,useState } from "react";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import { DeleteConfirmModal } from "../components/DeleteConfirmationModal";
import { ActivitiesCard,ActivityGroupList } from "./components/ActivitiesCard";
import {
AddCalendarEntriesModal,
type DraftEntry,
} from "./components/AddCalendarEntriesModal";
import {
EditEntryModal,
type EditEntryValue,
} from "./components/EditEntryModal";
import { ExpandedListModal } from "./components/ExpandedListModal";
import { HolidayGroupList,HolidaysCard } from "./components/HolidaysCard";
import { ManageCalendarButton } from "./components/ManageCalendarButton";
import { MonthGrid } from "./components/MonthGrid";
import { TodayCard } from "./components/TodayCard";
import {
createCalendarActivities,
createCalendarHolidays,
deleteCalendarActivityApi,
deleteCalendarHolidayApi,
fetchAllCalendarActivities,
fetchAllCalendarHolidays,
fetchCalendarActivities,
fetchCalendarHolidays,
updateCalendarActivity,
updateCalendarHoliday,
} from "./services/calendar.service";
import {
CALENDAR_MANAGER_ROLES,
type CalendarActivity,
type CalendarHoliday,
type Role,
} from "./types/Calendar";

export interface CalendarData {
  reads?:CalendarReadStates;
  activities: CalendarActivity[]; holidays: CalendarHoliday[]; allActivities: CalendarActivity[]; allHolidays: CalendarHoliday[];
  loading: boolean; error: string | null; cachedOffline?: boolean; retry: () => void;
  saveActivities: (entries: DraftEntry[]) => Promise<unknown>; saveHolidays: (entries: DraftEntry[]) => Promise<unknown>;
  edit: (state: NonNullable<EditState>, value: EditEntryValue) => Promise<unknown>;
  remove: (state: NonNullable<DeleteState>) => Promise<unknown>;
}

interface CalendarPageProps {
  data?: CalendarData;
  viewerRole?: Role;
}

type ManageTarget = "activity" | "holiday" | null;
type ExpandTarget = "activity" | "holiday" | null;
type EditState =
  | { kind: "activity"; entry: CalendarActivity }
  | { kind: "holiday"; entry: CalendarHoliday }
  | null;
type DeleteState =
  | { kind: "activity"; entry: CalendarActivity }
  | { kind: "holiday"; entry: CalendarHoliday }
  | null;

function useCalendarPageState({ viewerRole = "ADMIN", data }: CalendarPageProps) {
  const { showToast } = useToast();
  const theme = useOutletContext<AdminThemeContext>();

  const [legacyActivities, setActivities] = useState<CalendarActivity[]>([]);
  const [legacyHolidays, setHolidays] = useState<CalendarHoliday[]>([]);
  const [legacyAllActivities, setAllActivities] = useState<CalendarActivity[]>([]);
  const [legacyAllHolidays, setAllHolidays] = useState<CalendarHoliday[]>([]);
  const [legacyLoading, setLoading] = useState(true);
  const [legacyError, setError] = useState<string | null>(null);

  const activities = data?.activities ?? legacyActivities, holidays = data?.holidays ?? legacyHolidays;
  const allActivities = data?.allActivities ?? legacyAllActivities, allHolidays = data?.allHolidays ?? legacyAllHolidays;
  const loading = data?.loading ?? legacyLoading, error = data ? data.cachedOffline ? null : data.error : legacyError;
  const retry = data?.retry ?? (() => setAttempt(value => value + 1));

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();

  const [manageTarget, setManageTarget] = useState<ManageTarget>(null);
  const [expandTarget, setExpandTarget] = useState<ExpandTarget>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  const canManage = CALENDAR_MANAGER_ROLES.includes(viewerRole);

  const [attempt, setAttempt] = useState(0);

  const eventDatesISO = useMemo(() => {
    const dates = new Set<string>();
    for (const a of activities) dates.add(a.date);
    for (const h of holidays) dates.add(h.date);
    return dates;
  }, [activities, holidays]);

  if (!theme) return { content: null, scope: null };
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  function shiftMonth(delta: number) {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(nextMonth);
    setSelectedDate(undefined);
  }

  async function handleSaveActivities(entries: DraftEntry[]) {
    if (data) { await data.saveActivities(entries); showToast("Calendar activities added."); setManageTarget(null); return; }
    const created = await createCalendarActivities(
      entries.map((e) => ({ title: e.title.trim(), date: e.date })),
    );
    setActivities((prev) => [...prev, ...created]);
    setAllActivities((prev) => [...prev, ...created]);
    showToast("Calendar entries added.");
    setManageTarget(null);
  }

  async function handleSaveHolidays(entries: DraftEntry[]) {
    if (data) { await data.saveHolidays(entries); showToast("Calendar holidays added."); setManageTarget(null); return; }
    const created = await createCalendarHolidays(
      entries.map((e) => ({
        title: e.title.trim(),
        date: e.date,
        type: e.holidayType,
      })),
    );
    setHolidays((prev) => [...prev, ...created]);
    setAllHolidays((prev) => [...prev, ...created]);
    setManageTarget(null);
  }

  async function handleEditSave(value: EditEntryValue) {
    if (!editState) return;
    if (data) { await data.edit(editState, value); showToast("Calendar entry updated."); setEditState(null); return; }
    if (editState.kind === "activity") {
      await updateCalendarActivity(editState.entry.id, {
        title: value.title,
        date: value.date,
      });
      const updater = (prev: CalendarActivity[]) =>
        prev.map((a) =>
          a.id === editState.entry.id
            ? { ...a, title: value.title, date: value.date }
            : a,
        );
      setActivities(updater);
      setAllActivities(updater);
    } else {
      await updateCalendarHoliday(editState.entry.id, {
        title: value.title,
        date: value.date,
        type: value.holidayType,
      });
      const updater = (prev: CalendarHoliday[]) =>
        prev.map((h) =>
          h.id === editState.entry.id
            ? {
                ...h,
                title: value.title,
                date: value.date,
                type: value.holidayType,
              }
            : h,
        );
      setHolidays(updater);
      setAllHolidays(updater);
    }
    showToast("Calendar entry updated.");
    setEditState(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteState) return;
    if (data) { await data.remove(deleteState); showToast("Calendar entry deleted."); setDeleteState(null); return; }
    if (deleteState.kind === "activity") {
      await deleteCalendarActivityApi(deleteState.entry.id);
      const filterer = (prev: CalendarActivity[]) =>
        prev.filter((a) => a.id !== deleteState.entry.id);
      setActivities(filterer);
      setAllActivities(filterer);
    } else {
      await deleteCalendarHolidayApi(deleteState.entry.id);
      const filterer = (prev: CalendarHoliday[]) =>
        prev.filter((h) => h.id !== deleteState.entry.id);
      setHolidays(filterer);
      setAllHolidays(filterer);
    }
    showToast("Calendar entry deleted.");
    setDeleteState(null);
  }

  const readProps=(name:CalendarReadResource)=>data?.reads?.[name]??{loading,error,retry:retry};
  return { content: ((
    <div className="w-full space-y-6 pb-12">
      {data?.reads && error && !data?.cachedOffline && <div role="alert" className={`rounded-xl border p-4 ${panelBg} ${panelBorder} ${textPrimary}`}><p>{error}</p><button type="button" className="mt-2 font-semibold underline" onClick={data.retry}>Retry</button></div>}
      <div>
        <h1 className={`qed-type-page-title ${textPrimary}`}>
          Calendar
        </h1>
        <p className={`qed-type-page-description mt-1 ${textMuted}`}>
          Manage your schedule and upcoming events.
        </p>
      </div>

      {data?.cachedOffline && <LoadingRegion loading={false} error={data.error} retry={retry} skeleton={null} className={textPrimary}>{null}</LoadingRegion>}
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
          <TodayCard />
          {selectedDate && (
            <div className="flex justify-end">
              <button type="button" className={`rounded-lg border px-3 py-2 text-sm font-semibold ${panelBg} ${panelBorder} ${textPrimary}`} onClick={() => setSelectedDate(undefined)}>Upcoming events</button>
            </div>
          )}
          {canManage && (
            <ManageCalendarButton
              onSelectActivities={() => setManageTarget("activity")}
              onSelectHolidays={() => setManageTarget("holiday")}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
            />
          )}

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

      {manageTarget && (
        <AddCalendarEntriesModal
          kind={manageTarget}
          onClose={() => setManageTarget(null)}
          onSave={
            manageTarget === "activity"
              ? handleSaveActivities
              : handleSaveHolidays
          }
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
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
            {...readProps('all-activities')}
            activities={allActivities}
            darkMode={darkMode}
            textMuted={textMuted}
            onEdit={(a) => setEditState({ kind: "activity", entry: a })}
            onDelete={(a) => setDeleteState({ kind: "activity", entry: a })}
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
            onEdit={(h) => setEditState({ kind: "holiday", entry: h })}
            onDelete={(h) => setDeleteState({ kind: "holiday", entry: h })}
          />
        </ExpandedListModal>
      )}

      {editState && (
        <EditEntryModal
          kind={editState.kind}
          initialValue={{
            title: editState.entry.title,
            date: editState.entry.date,
            holidayType:
              editState.kind === "holiday"
                ? (editState.entry.type ?? "regular")
                : "regular",
          }}
          onClose={() => setEditState(null)}
          onSave={handleEditSave}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {deleteState && (
        <DeleteConfirmModal
          entryTitle={deleteState.entry.title}
          onClose={() => setDeleteState(null)}
          onConfirm={handleDeleteConfirm}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}
    </div>
  )), scope: { setLoading, setError, fetchCalendarActivities, fetchCalendarHolidays, fetchAllCalendarActivities, fetchAllCalendarHolidays, setActivities, setHolidays, setAllActivities, setAllHolidays, attempt } };
}



export type CalendarPageEffectScope = NonNullable<ReturnType<typeof useCalendarPageState>["scope"]>;
export type CalendarPageRouteProps = Parameters<typeof useCalendarPageState>[0];
export function CalendarPageComposition(props: CalendarPageRouteProps & { effects?: (scope: CalendarPageEffectScope) => import("react").ReactNode }) {
 const state = useCalendarPageState(props);
 return <>{state.scope && props.effects?.(state.scope)}{state.content}</>;
}

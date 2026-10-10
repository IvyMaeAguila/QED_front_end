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

interface CalendarPageProps {
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

function useCalendarPageState({ viewerRole = "ADMIN" }: CalendarPageProps) {
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

  function shiftMonth(delta: number) {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(nextMonth);
    setSelectedDate(nextMonth);
  }

  async function handleSaveActivities(entries: DraftEntry[]) {
    const created = await createCalendarActivities(
      entries.map((e) => ({ title: e.title.trim(), date: e.date })),
    );
    setActivities((prev) => [...prev, ...created]);
    setAllActivities((prev) => [...prev, ...created]);
    setManageTarget(null);
  }

  async function handleSaveHolidays(entries: DraftEntry[]) {
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
    setEditState(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteState) return;
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
    setDeleteState(null);
  }

  return { content: ((
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className={`qed-type-page-title ${textPrimary}`}>
          Calendar
        </h1>
        <p className={`qed-type-page-description mt-1 ${textMuted}`}>
          Manage your schedule and upcoming events.
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
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
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
            loading={loading} error={error} retry={() => setAttempt(value => value + 1)}
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

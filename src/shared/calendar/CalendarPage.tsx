import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarRange, CalendarHeart } from "lucide-react";
import { MonthGrid } from "./components/MonthGrid";
import { ManageCalendarButton } from "./components/ManageCalendarButton";
import { ActivitiesCard, ActivityGroupList } from "./components/ActivitiesCard";
import { HolidaysCard, HolidayGroupList } from "./components/HolidaysCard";
import {
  AddCalendarEntriesModal,
  type DraftEntry,
} from "./components/AddCalendarEntriesModal";
import {
  EditEntryModal,
  type EditEntryValue,
} from "./components/EditEntryModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmationModal";
import { ExpandedListModal } from "./components/ExpandedListModal";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import {
  CALENDAR_MANAGER_ROLES,
  type CalendarActivity,
  type CalendarHoliday,
  type Role,
} from "./types/Calendar";
import {
  fetchCalendarActivities,
  fetchAllCalendarActivities,
  fetchCalendarHolidays,
  fetchAllCalendarHolidays,
  createCalendarActivities,
  createCalendarHolidays,
  updateCalendarActivity,
  updateCalendarHoliday,
  deleteCalendarActivityApi,
  deleteCalendarHolidayApi,
} from "./services/calendar.service";

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

export function CalendarPage({ viewerRole = "ADMIN" }: CalendarPageProps) {
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

  const [manageTarget, setManageTarget] = useState<ManageTarget>(null);
  const [expandTarget, setExpandTarget] = useState<ExpandTarget>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  const canManage = CALENDAR_MANAGER_ROLES.includes(viewerRole);

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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
          Calendar
        </h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
          Manage your schedule and upcoming events.
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
  );
}
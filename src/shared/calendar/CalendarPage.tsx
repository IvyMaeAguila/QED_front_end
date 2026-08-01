import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
<<<<<<< Updated upstream:src/shared/calendar/CalendarPage.tsx
=======
import { useClasses } from "../classes/context/ClassesContext";
import type { AdminThemeContext } from "../AdminLayout";
import type { GradeLevel } from "../studentrecords/types/Students";
import { toISODate } from "./data";
import {
  canEditEvent,
  canViewerSeeEvent,
  POSTABLE_ROLES_BY_POSTER,
  type CalendarEvent,
  type Role,
  type ViewerContext,
} from "./types/Calendar";
import { fetchCalendarEvents, type CalendarEventRecord } from "./services/calendar.service";
>>>>>>> Stashed changes:src/features/profiles/admin/pages/calendar/CalendarPage.tsx
import { MonthGrid } from "./components/MonthGrid";
import { UpcomingEventsPanel } from "./components/UpcomingEventsPanel";
import { CreateAnnouncementModal } from "./components/CreateAnnouncementModal";
import { buildSeedEvents, toISODate } from "./data";
import { useClasses } from "../../features/profiles/admin/pages/classes/context/ClassesContext";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import type { GradeLevel } from "../../features/profiles/admin/pages/studentrecords/types/Students";
import { canViewerSeeEvent, POSTABLE_ROLES_BY_POSTER, type CalendarEvent, type Role, type ViewerContext } from "./types/Calendar";

interface CalendarPageProps {
  viewerRole?: Role;
  viewerName?: string;
  viewerUserId?: number; // ✅ idagdag — kailangan para sa edit-permission check
  teacherGradeLevel?: GradeLevel;
  teacherSection?: string;
}

function mapRecordToEvent(r: CalendarEventRecord): CalendarEvent {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description ?? undefined,
    date: r.calendarDate,
    startTime: r.startTime ?? undefined,
    endTime: r.endTime ?? undefined,
    audience: {
      roles: r.roles,
      gradeLevel: r.gradeLevelId ? (r.gradeLevel as GradeLevel) : undefined,
      section: r.sectionId ? r.section : undefined,
    },
    createdByRole: (r.createdByRole as Role) ?? "admin",
    createdByName: r.createdByName ?? "Unknown",
    createdById: r.createdBy ?? undefined,
  };
}

export function CalendarPage({
  viewerRole = "admin",
  viewerName = "School Admin",
  viewerUserId,
  teacherGradeLevel,
  teacherSection,
}: CalendarPageProps) {
  const theme = useOutletContext<AdminThemeContext>();
  if (!theme) return null;

  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const { classes } = useClasses();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

  function loadEvents() {
    setLoading(true);
    fetchCalendarEvents()
      .then((data) => setEvents(data.map(mapRecordToEvent)))
      .catch((err) => {
        console.error(err);
        setError("Failed to load calendar events.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const canPost = POSTABLE_ROLES_BY_POSTER[viewerRole].length > 0;

  const viewer: ViewerContext = {
    role: viewerRole,
    userId: viewerUserId,
    gradeLevel: teacherGradeLevel,
    section: teacherSection,
  };

  const visibleEvents = useMemo(
    () => events.filter((e) => canViewerSeeEvent(e, viewer)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, viewerRole, viewerUserId, teacherGradeLevel, teacherSection]
  );

   const todayEvents = useMemo(() => {
    const todayISO = toISODate(new Date());
    return visibleEvents.filter((e) => e.date === todayISO);
  }, [visibleEvents]);

  const upcomingEvents = useMemo(() => {
    const todayISO = toISODate(new Date());
    return visibleEvents.filter((e) => e.date > todayISO).sort((a, b) => a.date.localeCompare(b.date));
  }, [visibleEvents]);

  const eventDatesISO = useMemo(() => new Set(visibleEvents.map((e) => e.date)), [visibleEvents]);

  function availableSectionsForGrade(gradeLevel: GradeLevel | undefined): string[] {
    if (!gradeLevel) return [];
    return Array.from(new Set(classes.filter((c) => c.gradeLevel === gradeLevel).map((c) => c.section)));
  }

  function shiftMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function handleEditClick(event: CalendarEvent) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  function handleCreateClick() {
    setEditingEvent(undefined);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Calendar</h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>Manage your schedule and upcoming events.</p>
      </div>

      {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
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

        <UpcomingEventsPanel
          todayEvents={todayEvents}
          upcomingEvents={upcomingEvents}
          canPost={canPost}
          onCreateClick={handleCreateClick}
          canEditEvent={(event) => canEditEvent(event, viewer)}
          onEditClick={handleEditClick}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>

      {modalOpen && (
        <CreateAnnouncementModal
          posterRole={viewerRole}
          posterName={viewerName}
          defaultDate={selectedDate}
          availableSectionsForGrade={availableSectionsForGrade}
          lockedGradeLevel={teacherGradeLevel}
          lockedSection={teacherSection}
          editingEvent={editingEvent}
          onClose={() => {
            setModalOpen(false);
            setEditingEvent(undefined);
          }}
          onCreated={() => {
            loadEvents();
            setModalOpen(false);
            setEditingEvent(undefined);
          }}
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
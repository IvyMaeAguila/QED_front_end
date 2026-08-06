import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MonthGrid } from "./components/MonthGrid";
import { UpcomingEventsPanel } from "./components/UpcomingEventsPanel";
import { CreateAnnouncementModal, type NewAnnouncementInput } from "./components/CreateAnnouncementModal";
import { toISODate } from "./data";
import { useClasses } from "../../features/profiles/admin/pages/classes/context/ClassesContext";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import type { GradeLevel } from "../../features/profiles/admin/pages/studentrecords/types/Students";
import { canViewerSeeEvent, POSTABLE_ROLES_BY_POSTER, type CalendarEvent, type Role, type ViewerContext } from "./types/Calendar";
import { createCalendarEvent, fetchCalendarEvents } from "./services/calendar.service"; // adjust path to your actual location

interface CalendarPageProps {
  viewerRole?: Role;
  viewerName?: string;
  viewerId?: number; // user_id ng naka-login — wire this once real auth is in
  teacherGradeLevel?: GradeLevel;
  teacherSection?: string;
}

export function CalendarPage({
  viewerRole = "ADMIN",
  viewerName = "School Admin",
  viewerId,
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCalendarEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load calendar events.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canPost = POSTABLE_ROLES_BY_POSTER[viewerRole].length > 0;

  const viewer: ViewerContext = {
    role: viewerRole,
    gradeLevel: teacherGradeLevel,
    section: teacherSection,
  };

  const visibleEvents = useMemo(
    () => events.filter((e) => canViewerSeeEvent(e, viewer)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, viewerRole, teacherGradeLevel, teacherSection]
  );

  const upcomingEvents = useMemo(() => {
    const todayISO = toISODate(new Date());
    return visibleEvents.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
  }, [visibleEvents]);

  const eventDatesISO = useMemo(() => new Set(visibleEvents.map((e) => e.date)), [visibleEvents]);

  function availableSectionsForGrade(gradeLevel: GradeLevel | undefined): string[] {
    if (!gradeLevel) return [];
    return Array.from(new Set(classes.filter((c) => c.gradeLevel === gradeLevel).map((c) => c.section)));
  }

  // `classes` (from useClasses()) already carries both the display name
  // (gradeLevel/section) AND the numeric FK (gradeLevelId/sectionId) per
  // class record — match by name to resolve the id the backend expects.
  // undefined/"" (All Grade Levels / All Sections) correctly stays null.
  function resolveGradeLevelId(gradeLevel: GradeLevel | undefined): number | null {
    if (!gradeLevel) return null;
    const match = classes.find((c) => c.gradeLevel === gradeLevel);
    return match ? Number(match.gradeLevelId) : null;
  }
  function resolveSectionId(section: string | undefined, gradeLevel?: GradeLevel): number | null {
    if (!section) return null;
    // Match on gradeLevel too when available — section names aren't
    // guaranteed unique across grade levels.
    const match = classes.find(
      (c) => c.section === section && (!gradeLevel || c.gradeLevel === gradeLevel)
    );
    return match ? Number(match.sectionId) : null;
  }

  function shiftMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  async function handleCreate(input: NewAnnouncementInput) {
    const calendarId = await createCalendarEvent({
      title: input.title,
      description: input.description,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      audience: input.audience,
      gradeLevelId: resolveGradeLevelId(input.audience.gradeLevel),
      sectionId: resolveSectionId(input.audience.section, input.audience.gradeLevel),
      createdBy: viewerId ?? null,
    });

    setEvents((prev) => [
      ...prev,
      {
        id: calendarId,
        title: input.title,
        description: input.description,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        audience: input.audience,
        createdByRole: viewerRole,
        createdByName: viewerName,
      },
    ]);
    setModalOpen(false);
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Calendar</h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>Manage your schedule and upcoming events.</p>
      </div>

      {error && <p className="text-sm font-semibold text-[#B91C1C]">{error}</p>}

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
          events={upcomingEvents}
          canPost={canPost}
          onCreateClick={() => setModalOpen(true)}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>

      {loading && <p className={`text-sm font-semibold ${textMuted}`}>Loading events…</p>}

      {modalOpen && (
        <CreateAnnouncementModal
          posterRole={viewerRole}
          posterName={viewerName}
          defaultDate={selectedDate}
          availableSectionsForGrade={availableSectionsForGrade}
          lockedGradeLevel={teacherGradeLevel}
          lockedSection={teacherSection}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
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
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useClasses } from "../classes/context/ClassesContext";
import type { AdminThemeContext } from "../../AdminLayout";
import type { GradeLevel } from "../studentrecords/types/Students";
import { buildSeedEvents, toISODate } from "./data";
import { canViewerSeeEvent, POSTABLE_ROLES_BY_POSTER, type CalendarEvent, type Role, type ViewerContext } from "./types/Calendar";
import { MonthGrid } from "./components/MonthGrid";
import { UpcomingEventsPanel } from "./components/UpcomingEventsPanel";
import { CreateAnnouncementModal } from "./components/CreateAnnouncementModal";

// Wire this to real auth once available — for now the viewer defaults to
// ADMIN so this page works standalone under /admin/calendar. Pass real
// `viewerRole` / teacher class info as props when reusing this component
// inside Teacher or Parent dashboards.
interface CalendarPageProps {
  viewerRole?: Role;
  viewerName?: string;
  // Only relevant when viewerRole === "TEACHER": the class they're scoped to.
  teacherGradeLevel?: GradeLevel;
  teacherSection?: string;
}

export function CalendarPage({
  viewerRole = "ADMIN",
  viewerName = "School Admin",
  teacherGradeLevel,
  teacherSection,
}: CalendarPageProps) {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const { classes } = useClasses();

  const [events, setEvents] = useState<CalendarEvent[]>(buildSeedEvents);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);

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

  function shiftMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Calendar</h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>Manage your schedule and upcoming events.</p>
      </div>

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

      {modalOpen && (
        <CreateAnnouncementModal
          posterRole={viewerRole}
          posterName={viewerName}
          defaultDate={selectedDate}
          availableSectionsForGrade={availableSectionsForGrade}
          lockedGradeLevel={teacherGradeLevel}
          lockedSection={teacherSection}
          onClose={() => setModalOpen(false)}
          onCreate={(event) => {
            setEvents((prev) => [...prev, event]);
            setModalOpen(false);
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
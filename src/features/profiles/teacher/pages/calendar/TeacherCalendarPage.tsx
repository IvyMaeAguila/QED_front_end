import { CalendarPage } from "../../../admin/pages/calendar/CalendarPage";
import { useAuth } from "@shared/hooks/useAuth";

export function TeacherCalendarPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <CalendarPage
      viewerRole="TEACHER"
      viewerName={user.name}
      teacherGradeLevel={user.gradeLevel}
      teacherSection={user.section}
    />
  );
}

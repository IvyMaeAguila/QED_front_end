import type { AttendanceSummary, DashboardSummary, TeacherStats, WeeklyScheduleItem } from "./services/dashboard.service";
import type { EventItem } from "./components/UpcomingEvents";
export interface TeacherDashboardData {
  summary: DashboardSummary | null;
  statsData: TeacherStats | null;
  attendance: AttendanceSummary | null;
  events: EventItem[];
  agenda: WeeklyScheduleItem[];
  loading: boolean;
  errors: string[];
  cachedSections?: string[];
  offline: boolean;
  retry: () => void;
}

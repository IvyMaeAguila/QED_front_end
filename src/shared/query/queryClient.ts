import { QueryClient } from "@tanstack/react-query";
import { registerSessionQueryCleanup } from "./sessionQueries";

// One client per browser runtime. No persistence of authenticated data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export const directoryKeys = {
  session: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal-teachers-directory"] as const,
};

export const principalGradebookKeys = {
  overview: (session: number, role: string, userId: string, yearId: number | null) =>
    ["session", session, role, userId, "principal", "gradebooks", "overview", yearId] as const,
  periods: (session: number, role: string, userId: string, yearId: number | null, grade: string | number, section?: string | number | null) =>
    ["session", session, role, userId, "principal", "gradebooks", "periods", yearId, String(grade), section == null || section === "" ? null : String(section)] as const,
  sheet: (session: number, role: string, userId: string, yearId: number | null, grade: string | number, section: string | number | null | undefined, period?: string | number) =>
    ["session", session, role, userId, "principal", "gradebooks", "sheet", yearId, String(grade), section == null || section === "" ? null : String(section), period == null ? null : String(period)] as const,
};

export const principalAnalyticsKeys = {
  all: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal", "analytics"] as const,
  resource: (session: number, role: string, userId: string, yearId: number | null, resource: "terms" | "grades" | "views" | "subjects" | "holistic", ...filters: string[]) =>
    [...principalAnalyticsKeys.all(session, role, userId), yearId, resource, ...filters] as const,
};

export const principalDashboardKeys = {
  all: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal", "dashboard"] as const,
  term: (session: number, role: string, userId: string) =>
    [...principalDashboardKeys.all(session, role, userId), "active-term"] as const,
  year: (session: number, role: string, userId: string) =>
    [...principalDashboardKeys.all(session, role, userId), "school-year", "active"] as const,
  snapshot: (session: number, role: string, userId: string, yearId: number | null, termId: number | null, termNumber: number | null, date: string) =>
    [...principalDashboardKeys.all(session, role, userId), "snapshot", yearId, termId, termNumber, date] as const,
};

export const principalTeacherKeys = {
  profile: (session: number, role: string, userId: string, yearId: number | null, teacherId: string | undefined) =>
    ["session", session, role, userId, "principal", "teachers", "profile", yearId, teacherId ?? null] as const,
};

export const principalStudentKeys = {
  overview: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal", "students", "overview"] as const,
  rosterYear: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal", "students", "roster-year", "active"] as const,
  rosters: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal", "students", "roster"] as const,
  roster: (session: number, role: string, userId: string, schoolYearId: number | null, type: "class" | "grade", id: number | null) =>
    ["session", session, role, userId, "principal", "students", "roster", schoolYearId, type, id] as const,
};

export function clearSessionQueries() {
  // Cancellation is initiated synchronously before removing cached results.
  void queryClient.cancelQueries();
  queryClient.clear();
}

registerSessionQueryCleanup(clearSessionQueries);

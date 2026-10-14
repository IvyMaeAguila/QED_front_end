import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { fetchAdvisorySections } from "../pages/attendance/services/attendance.service";
import { useTeacherReader } from "./useTeacherReader";
import { TeacherAdvisoryReaderContext } from "./TeacherAdvisoryReaderContext";

function Reader({ children }: { children: ReactNode }) {
  const reader = useTeacherReader(["advisory", "sections"], fetchAdvisorySections, "Couldn't load your advisory classes. Please try again.");
  return <TeacherAdvisoryReaderContext.Provider value={reader}>{children}</TeacherAdvisoryReaderContext.Provider>;
}
export function TeacherAdvisoryQueries({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}><Reader>{children}</Reader></QueryClientProvider>;
}

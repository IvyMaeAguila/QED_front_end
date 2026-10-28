import { useState } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient, principalAnalyticsKeys } from "@shared/query/queryClient";
import { useAuth } from "@shared/hooks/useAuth";
import { useLoadingOutletContext, useRoutePreview } from "@shared/loading/RoutePreview";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { ExaminationPerformance } from "./components/ExaminationPerformance";
import { getGradeOptions } from "./services/reports.service";

function ExaminationPerformancePageContent() {
  const theme = useLoadingOutletContext<AdminThemeContext>();
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const [grade, setGrade] = useState("All Grades");
  const grades = useQuery({
    queryKey: [...principalAnalyticsKeys.all(sessionScope, user?.role ?? "", String(user?.id ?? "")), "examination-grades"],
    enabled: !preview && !isLoading && user?.role === "PRINCIPAL",
    staleTime: 30_000,
    queryFn: ({ signal }) => getGradeOptions({ signal, onUnauthorized: () => expireSession(sessionScope) }),
  });
  return <div className="flex flex-col gap-5 font-sans">
    <div className={`rounded-xl border px-3 py-2 ${theme.panelBg} ${theme.panelBorder}`}>
      <PrincipalAnalyticsTabs textMuted={theme.textMuted} />
    </div>
    <div>
      <h1 className={`qed-type-page-title ${theme.textPrimary}`}>Examination Performance Analytics</h1>
      <p className={`qed-type-page-description mt-1 ${theme.textMuted}`}>Examination results across subjects, grades, and sections.</p>
    </div>
    {grades.error && <LoadingRegion loading={false} error={grades.error} retry={() => { void grades.refetch(); }} skeleton={null}>{null}</LoadingRegion>}
    <ExaminationPerformance key={sessionScope} term="Term 1" grade={grade} gradeOptions={grades.data ?? ["All Grades"]} onGradeChange={setGrade} {...theme} />
  </div>;
}
export function ExaminationPerformancePageComposition() {
  return <QueryClientProvider client={queryClient}><ExaminationPerformancePageContent /></QueryClientProvider>;
}

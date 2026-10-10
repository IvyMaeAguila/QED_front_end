import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { Dropdown } from "../../../shared/components/DashboardUI";
import { PerGradeRanking } from "./components/PerGradeRanking";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { PriorityFocus } from "./components/PriorityFocus";
import { ReportMetricCards } from "./components/ReportMetricCards";
import { WholeElementaryRanking } from "./components/WholeElementaryRanking";
import type { Term } from "./data/types";
import { useSubjectAnalytics } from "./hooks/useSubjectAnalytics";

function useAnalyticsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const {
    term,
    setTerm,
    termOptions,
    gradeFilter,
    setGradeFilter,
    gradeOptions,
    wholeElementaryRanking,
    filteredRanking,
    lowestPerforming,
    loading,
    error,
    retry,
  } = useSubjectAnalytics();

  const averageScore = wholeElementaryRanking.length
    ? Math.round(wholeElementaryRanking.reduce((sum, item) => sum + item.score, 0) / wholeElementaryRanking.length)
    : null;
  const strongestSubject = wholeElementaryRanking[0];
  const prioritySubject = lowestPerforming[0];
  const reportMetrics = [
    { label: "Subjects included", value: String(wholeElementaryRanking.length), detailKnown: true, detail: term },
    { label: "School average", value: averageScore === null ? "—" : `${averageScore}%`, detailKnown: true, detail: "Mean of subject averages" },
    { label: "Highest average", value: strongestSubject?.subject ?? "—", detail: strongestSubject ? `${strongestSubject.score}%` : "No scores recorded" },
    { label: "Lowest average", value: prioritySubject?.subject ?? "—", detail: prioritySubject ? `${prioritySubject.score}% · review recommended` : "No scores recorded" },
  ];

  return { content: ((
    <div className="flex flex-col gap-5 font-sans">
      <div className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <PrincipalAnalyticsTabs textMuted={textMuted} />
        <Dropdown
          value={term}
          onChange={(v) => setTerm(v as Term)}
          options={termOptions.length ? termOptions : [term]}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          compact
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="analyticspage-subject-performance-analytics" data-sk-static="">Subject Performance Analytics</h1>
          <p className={`qed-type-page-description mt-1 ${textMuted}`} data-sk-region="analyticspage-subject-results-across-the-school-and-by-grad" data-sk-static="">
            Subject results across the school and by grade level.
          </p>
        </div>
      </div>

      {error ? <LoadingRegion loading={false} error={error} retry={retry} skeleton={null}>{null}</LoadingRegion> : (
        <>
          <ReportMetricCards loading={loading} view={`subject-report:${term}`} items={reportMetrics} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />
          <WholeElementaryRanking
            loading={loading}
            view={`subject-report:${term}:whole`}
            term={term}
            ranking={wholeElementaryRanking}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />

          <PerGradeRanking
            loading={loading}
            view={`subject-report:${term}:${gradeFilter}:grade`}
            term={term}
            gradeFilter={gradeFilter}
            gradeOptions={gradeOptions}
            onGradeFilterChange={setGradeFilter}
            ranking={filteredRanking}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />

          <PriorityFocus loading={loading} view={`subject-report:${term}:priority`} term={term} items={lowestPerforming} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
        </>
      )}
    </div>
  )), scope: {  } };
}


export type AnalyticsPageEffectScope = ReturnType<typeof useAnalyticsPageState>["scope"];
export type AnalyticsPageRouteProps = Record<string, never>;
export function AnalyticsPageComposition(props: object & { effects?: (scope: AnalyticsPageEffectScope) => import("react").ReactNode }) {
 const state = useAnalyticsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

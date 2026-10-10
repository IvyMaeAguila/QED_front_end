import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { Dropdown,SectionCard } from "../../../shared/components/DashboardUI";
import { HolisticHeatmap } from "./components/HolisticHeatmap";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { ReportMetricCards } from "./components/ReportMetricCards";
import type { Term,ViewMode } from "./data/types";
import { useHolisticAnalytics } from "./hooks/useHolisticAnalytics";

function useHolisticPerformanceAnalyticsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { term, setTerm, termOptions, view, setView, viewOptions, rows, loading, error, retry } = useHolisticAnalytics();

  const domainKeys = ["cognitive", "emotional", "behavioral", "social"] as const;
  const domainLabels = { cognitive: "Cognitive", emotional: "Emotional", behavioral: "Behavioral", social: "Social" };
  const domainAverages = domainKeys.map((key) => {
    const values = rows.map((row) => row.scores[key]).filter((value): value is number => value !== null);
    return { label: domainLabels[key], average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
  });
  const scoreCount = rows.reduce((total, row) => total + domainKeys.filter((key) => row.scores[key] !== null).length, 0);
  const allScores = rows.flatMap((row) => domainKeys.map((key) => row.scores[key]).filter((value): value is number => value !== null));
  const overallAverage = allScores.length ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length : null;
  const strongestDomain = [...domainAverages].filter((domain) => domain.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
  const reportMetrics = [
    { label: view === "By Grade Level" ? "Grade levels" : "Subjects", value: String(rows.length), detailKnown: true, detail: `${term} reporting period` },
    { label: "Overall average", value: overallAverage === null ? "—" : `${overallAverage.toFixed(1)} / 5`, detailKnown: true, detail: "Across recorded domain scores" },
    { label: "Strongest domain", value: strongestDomain?.label ?? "—", detail: strongestDomain?.average === null || !strongestDomain ? "No scores recorded" : `${strongestDomain.average.toFixed(1)} / 5 average` },
    { label: "Scores recorded", value: String(scoreCount), detail: `Of ${rows.length * domainKeys.length} possible ratings` },
  ];

  return { content: ((
    <div className="flex flex-col gap-5 font-sans">
      <div className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <PrincipalAnalyticsTabs textMuted={textMuted} />
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={view}
            onChange={(v) => setView(v as ViewMode)}
            options={viewOptions.length ? viewOptions : [view]}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            compact
          />
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
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="holisticperformanceanalyticspage-holistic-performance-analytics" data-sk-static="">Holistic Performance Analytics</h1>
          <p className={`qed-type-page-description mt-1 ${textMuted}`} data-sk-region="holisticperformanceanalyticspage-cognitive-emotional-behavioral-and-social-dev" data-sk-static="">Cognitive, emotional, behavioral, and social development.</p>
        </div>
      </div>

      {error ? <LoadingRegion loading={false} error={error} retry={retry} skeleton={null}>{null}</LoadingRegion> : (
      <>
      <ReportMetricCards loading={loading} view={`holistic-report:${term}:${view}`} items={reportMetrics} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />
      <SectionCard title="Development overview" compact panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
        <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
          {view === "By Grade Level" ? "Domain averages per grade level" : "Domain averages per subject"} &middot; {term}
        </p>
        <HolisticHeatmap
            loading={loading}
            view={`holistic-report:${term}:${view}`}
            rows={rows}
            rowHeader={view === "By Grade Level" ? "Grade" : "Subject"}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
      </SectionCard>
      </>
      )}
    </div>
  )), scope: {  } };
}


export type HolisticPerformanceAnalyticsPageEffectScope = ReturnType<typeof useHolisticPerformanceAnalyticsPageState>["scope"];
export type HolisticPerformanceAnalyticsPageRouteProps = Record<string, never>;
export function HolisticPerformanceAnalyticsPageComposition(props: object & { effects?: (scope: HolisticPerformanceAnalyticsPageEffectScope) => import("react").ReactNode }) {
 const state = useHolisticPerformanceAnalyticsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

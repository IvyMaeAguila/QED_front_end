import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { SectionCard, Dropdown } from "../../../shared/components/DashboardUI";
import { useHolisticAnalytics } from "./hooks/useHolisticAnalytics";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { HolisticHeatmap } from "./components/HolisticHeatmap";
import type { Term, ViewMode } from "./data/types";
import { ReportMetricCards } from "./components/ReportMetricCards";

export function HolisticPerformanceAnalyticsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { term, setTerm, termOptions, view, setView, viewOptions, rows, loading, error } = useHolisticAnalytics();

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
    { label: view === "By Grade Level" ? "Grade levels" : "Subjects", value: String(rows.length), detail: `${term} reporting period` },
    { label: "Overall average", value: overallAverage === null ? "—" : `${overallAverage.toFixed(1)} / 5`, detail: "Across recorded domain scores" },
    { label: "Strongest domain", value: strongestDomain?.label ?? "—", detail: strongestDomain?.average === null || !strongestDomain ? "No scores recorded" : `${strongestDomain.average.toFixed(1)} / 5 average` },
    { label: "Scores recorded", value: String(scoreCount), detail: `Of ${rows.length * domainKeys.length} possible ratings` },
  ];

  return (
    <div className="flex flex-col gap-5 font-sans">
      <div className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <PrincipalAnalyticsTabs textMuted={textMuted} />
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={view}
            onChange={(v) => setView(v as ViewMode)}
            options={viewOptions}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            compact
          />
          <Dropdown
            value={term}
            onChange={(v) => setTerm(v as Term)}
            options={termOptions}
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
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Holistic Performance Analytics</h1>
          <p className={`mt-1 text-sm ${textMuted}`}>Cognitive, emotional, behavioral, and social development.</p>
        </div>
      </div>

      {error ? (
        <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${panelBorder} ${textMuted}`}>
          Unable to load holistic performance right now. Please try again later.
        </div>
      ) : loading ? (
        <p className={`text-sm ${textMuted}`}>Loading holistic analytics…</p>
      ) : (
      <>
      <ReportMetricCards items={reportMetrics} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />
      <SectionCard title="Development overview" compact panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
        <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
          {view === "By Grade Level" ? "Domain averages per grade level" : "Domain averages per subject"} &middot; {term}
        </p>
        <HolisticHeatmap
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
  );
}

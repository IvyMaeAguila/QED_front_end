import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { Dropdown } from "../../../shared/components/DashboardUI";
import { useSubjectAnalytics } from "./hooks/useSubjectAnalytics";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { WholeElementaryRanking } from "./components/WholeElementaryRanking";
import { PerGradeRanking } from "./components/PerGradeRanking";
import { PriorityFocus } from "./components/PriorityFocus";
import type { Term } from "./data/types";
import { ReportMetricCards } from "./components/ReportMetricCards";

export function AnalyticsPage() {
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
  } = useSubjectAnalytics();

  const averageScore = wholeElementaryRanking.length
    ? Math.round(wholeElementaryRanking.reduce((sum, item) => sum + item.score, 0) / wholeElementaryRanking.length)
    : null;
  const strongestSubject = wholeElementaryRanking[0];
  const prioritySubject = lowestPerforming[0];
  const reportMetrics = [
    { label: "Subjects included", value: String(wholeElementaryRanking.length), detail: term },
    { label: "School average", value: averageScore === null ? "—" : `${averageScore}%`, detail: "Mean of subject averages" },
    { label: "Highest average", value: strongestSubject?.subject ?? "—", detail: strongestSubject ? `${strongestSubject.score}%` : "No scores recorded" },
    { label: "Lowest average", value: prioritySubject?.subject ?? "—", detail: prioritySubject ? `${prioritySubject.score}% · review recommended` : "No scores recorded" },
  ];

  return (
    <div className="flex flex-col gap-5 font-sans">
      <div className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <PrincipalAnalyticsTabs textMuted={textMuted} />
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`qed-type-page-title ${textPrimary}`}>Subject Performance Analytics</h1>
          <p className={`qed-type-page-description mt-1 ${textMuted}`}>
            Subject results across the school and by grade level.
          </p>
        </div>
      </div>

      {error ? (
        <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${panelBorder} ${textMuted}`}>
          Unable to load subject performance right now. Please try again later.
        </div>
      ) : loading ? (
        <p className={`text-sm ${textMuted}`}>Loading analytics…</p>
      ) : (
        <>
          <ReportMetricCards items={reportMetrics} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />
          <WholeElementaryRanking
            term={term}
            ranking={wholeElementaryRanking}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />

          <PerGradeRanking
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

          <PriorityFocus term={term} items={lowestPerforming} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
        </>
      )}
    </div>
  );
}

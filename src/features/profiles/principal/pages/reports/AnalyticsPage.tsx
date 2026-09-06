import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { Dropdown } from "../../../shared/components/DashboardUI";
import { useSubjectAnalytics } from "./hooks/useSubjectAnalytics";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { WholeElementaryRanking } from "./components/WholeElementaryRanking";
import { PerGradeRanking } from "./components/PerGradeRanking";
import { PriorityFocus } from "./components/PriorityFocus";
import type { Term } from "./data/types";

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
  } = useSubjectAnalytics();

  return (
    <div className="flex flex-col gap-6 font-sans">
      <PrincipalAnalyticsTabs panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>Subject Performance Analytics</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>
            Identify which subjects need attention and which are performing well, school-wide and per grade level.
          </p>
        </div>
        <Dropdown
          value={term}
          onChange={(v) => setTerm(v as Term)}
          options={termOptions}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>

      {loading ? (
        <p className={`text-sm ${textMuted}`}>Loading analytics…</p>
      ) : (
        <>
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

          <PriorityFocus term={term} items={lowestPerforming} panelBg={panelBg} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
        </>
      )}
    </div>
  );
}

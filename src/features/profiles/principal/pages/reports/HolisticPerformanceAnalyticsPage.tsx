import { useOutletContext } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { SectionCard, Dropdown } from "../../../shared/components/DashboardUI";
import { useHolisticAnalytics } from "./hooks/useHolisticAnalytics";
import { PrincipalAnalyticsTabs } from "./components/PrincipalAnalyticsTabs";
import { HolisticHeatmap } from "./components/HolisticHeatmap";
import type { Term, ViewMode } from "./data/types";

export function HolisticPerformanceAnalyticsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { term, setTerm, termOptions, view, setView, viewOptions, rows, loading } = useHolisticAnalytics();

  return (
    <div className="flex flex-col gap-6 font-sans">
      <PrincipalAnalyticsTabs panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>Holistic Performance Analytics</h1>
          <p className={`text-sm mt-2 ${textMuted}`}>Cognitive, emotional, behavioral, and social development, at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown
            value={view}
            onChange={(v) => setView(v as ViewMode)}
            options={viewOptions}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
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
      </div>

      <SectionCard title="Development Heatmap" icon={LayoutGrid} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
        <p className={`text-sm -mt-2 mb-5 ${textMuted}`}>
          {view === "By Grade Level" ? "Domain averages per grade level" : "Domain averages per subject"} &middot; {term}
        </p>
        {loading ? (
          <p className={`text-sm ${textMuted}`}>Loading heatmap…</p>
        ) : (
          <HolisticHeatmap
            rows={rows}
            rowHeader={view === "By Grade Level" ? "Grade" : "Subject"}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        )}
      </SectionCard>

      <p className={`text-xs italic ${textMuted}`}>
        Prototype using mock data — data source, exact color scale, and cell interactions (click-through to a detail view, etc.) still to be refined.
      </p>
    </div>
  );
}

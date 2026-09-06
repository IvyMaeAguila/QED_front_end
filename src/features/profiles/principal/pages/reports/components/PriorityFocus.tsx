import { AlertTriangle } from "lucide-react";
import { TrendChip } from "../../../../shared/components/DashboardUI";
import type { AggregatedSubjectRank, Term } from "../data/types";

interface PriorityFocusProps {
  term: Term;
  items: AggregatedSubjectRank[];
  panelBg: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function PriorityFocus({ term, items, panelBg, textPrimary, textMuted, darkMode }: PriorityFocusProps) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-card"
      style={{ borderColor: "var(--color-red)", backgroundColor: darkMode ? "var(--color-red-soft-dark)" : "var(--color-red-soft)" }}
    >
      <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-red)" }}>
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.75} /> Priority Focus
      </h2>
      <p className={`text-sm mb-5 ${textMuted}`}>
        Lowest-performing subjects school-wide for {term} — consider prioritizing these for intervention and resource allocation.
      </p>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.subject} className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${panelBg}`}>
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--color-red)" }} />
              <span className={`text-sm font-bold ${textPrimary}`}>{item.subject}</span>
              <span className={`text-xs ${textMuted}`}>
                ({item.score}% average, {item.gradeCount} grade levels)
              </span>
            </div>
            <TrendChip trend={item.trend} darkMode={darkMode} />
          </div>
        ))}
      </div>
    </div>
  );
}

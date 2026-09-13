import { useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { TrendChip, ProgressBar, RankBadge } from "../../../../shared/components/DashboardUI";
import type { SubjectRankingItem, Term } from "../data/types";

interface FullRankingModalProps {
  ranking: SubjectRankingItem[];
  term: Term;
  onTermChange: (term: Term) => void;
  onClose: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function FullRankingModal({
  ranking,
  term,
  onTermChange,
  onClose,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: FullRankingModalProps) {
  // Close on Escape, and lock background scroll while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Full subject ranking"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border ${panelBg} ${panelBorder}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` }}
        >
          <div>
            <h2 className={`text-base font-bold ${textPrimary}`}>School-wide Subject Ranking</h2>
            <p className={`text-xs mt-0.5 ${textMuted}`}>{ranking.length} subjects ranked</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={term}
                onChange={(e) => onTermChange(e.target.value as Term)}
                className={`appearance-none text-sm font-bold uppercase tracking-wide pl-5 pr-10 py-2.5 rounded-2xl shadow-card ${panelBg} ${panelBorder} border ${textPrimary} focus:outline-none focus:ring-2 focus:ring-maroon/40 cursor-pointer`}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <ChevronDown className={`h-3.5 w-3.5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>

            <button
              onClick={onClose}
              className={`h-9 w-9 rounded-full flex items-center justify-center border ${panelBorder} ${textMuted} hover:text-white hover:bg-maroon hover:border-maroon transition-colors`}
              aria-label="Close ranking"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable ranking list */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-3">
          {ranking.length === 0 ? (
            <p className={`text-sm text-center py-10 ${textMuted}`}>No ranking data for this term yet.</p>
          ) : (
            ranking.map((item) => (
              <div
                key={`${item.grade}-${item.subject}`}
                className="flex items-center gap-5 rounded-2xl px-5 py-4"
                style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "#F7F7F8" }}
              >
                <RankBadge rank={item.rank} darkMode={darkMode} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${textPrimary}`}>{item.subject}</p>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>{item.grade}</p>
                </div>
                <div className="w-32 hidden sm:block">
                  <ProgressBar value={item.score} darkMode={darkMode} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                  <TrendChip trend={item.trend} darkMode={darkMode} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
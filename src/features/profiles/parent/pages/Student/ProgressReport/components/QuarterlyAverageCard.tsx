import { ClipboardList } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { TERMS, type TermFilter, type TermAverageEntry } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface TermAverageCardProps {
  entries: TermAverageEntry[];
  selectedTerm: TermFilter;
  theme: AdminThemeContext;
  student: DetailStudent;
}

/**
 * Returns the General Weighted Average across T1–T3, or null if any term
 * is missing/not yet released/incomplete. Equal weighting per term —
 * adjust here if the school uses different weights per term.
 */
function computeGwa(entries: TermAverageEntry[]): number | null {
  const averages = TERMS.map((t) => entries.find((e) => e.term === t)?.average);
  const allPresent = averages.every((a) => a !== null && a !== undefined);
  if (!allPresent) return null;
  const nums = averages as number[];
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export function TermAverageCard({ entries, selectedTerm, theme, student }: TermAverageCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const isOverall = selectedTerm === "OVERALL";

  // Average for the currently selected term tab — only meaningful when a
  // specific term (not "OVERALL") is selected.
  const currentTermEntry = !isOverall ? entries.find((e) => e.term === selectedTerm) : undefined;
  const currentTermAverage = currentTermEntry?.average ?? null;

  // GWA is only computed (and only matters) when "OVERALL" is selected —
  // still requires all three terms to be released/complete.
  const gwa = isOverall ? computeGwa(entries) : null;

  const displayAverage = isOverall ? gwa : currentTermAverage;
  const percent = displayAverage ?? 0;
  const label = isOverall
    ? gwa !== null
      ? "General Weighted Average"
      : "Incomplete — not all terms released"
    : currentTermEntry?.ratingLabel ?? "No Data";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={`flex-1 flex flex-col rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <SectionHeader
        icon={ClipboardList}
        title={isOverall ? "General Weighted Average" : "Term Average"}
        about={
          isOverall
            ? `${student.firstName}'s overall average across all three terms this school year.`
            : `Provides a comprehensive overview of ${student.firstName}'s average across all subjects for the selected term.`
        }
        theme={theme}
      />

      <div className="flex flex-col items-center justify-center flex-1">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke={darkMode ? "#1F2937" : "#F1F2F4"} strokeWidth="10" />
          {displayAverage !== null && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#22C55E"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
            />
          )}
          <text
            x="70"
            y="75"
            textAnchor="middle"
            className={darkMode ? "fill-white" : "fill-[#111827]"}
            fontSize="24"
            fontWeight="700"
          >
            {displayAverage !== null ? `${displayAverage}%` : "—"}
          </text>
        </svg>
        <p className={`mt-1 text-sm font-semibold ${textMuted}`}>{label}</p>
      </div>
    </div>
  );
}
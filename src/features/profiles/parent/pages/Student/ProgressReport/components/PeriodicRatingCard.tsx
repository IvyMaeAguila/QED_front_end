import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { ClipboardList } from "lucide-react";
import { QUARTERS, QUARTER_SHORT_LABELS, type PeriodicRatingRow } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface PeriodicRatingCardProps {
  rows: PeriodicRatingRow[];
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function PeriodicRatingCard({ rows, theme, student }: PeriodicRatingCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  return (
    <div className={`flex-[2] rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <SectionHeader
        icon={ClipboardList}
        title="Periodic Rating"
        about={`Provides a comprehensive overview of ${student.firstName}'s performance across all subjects for the selected quarter.`}
        theme={theme}
      />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className={darkMode ? "bg-white/5" : "bg-[#F6F7FB]"}>
              <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase ${textMuted}`}>
                Learning Areas
              </th>
              {QUARTERS.map((q) => (
                <th key={q} className={`px-3 py-2 text-center text-[11px] font-semibold uppercase ${textMuted}`}>
                  {QUARTER_SHORT_LABELS[q].replace(/[a-z]/g, "")}
                </th>
              ))}
              <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase ${textMuted}`}>
                Final Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.learningArea} className={`border-t ${panelBorder}`}>
                <td className={`px-3 py-2.5 text-sm font-semibold ${textPrimary}`}>{row.learningArea}</td>
                {QUARTERS.map((q) => {
                  const score = row.scores[q];
                  const isLow = typeof score === "number" && score < 85;
                  return (
                    <td
                      key={q}
                      className={`px-3 py-2.5 text-center text-sm font-bold ${
                        score === undefined ? textMuted : isLow ? "text-red-500" : textPrimary
                      }`}
                    >
                      {score ?? "—"}
                    </td>
                  );
                })}
                <td className={`px-3 py-2.5 text-sm ${textMuted}`}>{row.finalRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
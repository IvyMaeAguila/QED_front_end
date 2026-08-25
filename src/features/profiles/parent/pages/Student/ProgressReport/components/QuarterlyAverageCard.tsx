import {ClipboardList} from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { type Quarter, type QuarterlyAverageEntry } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface QuarterlyAverageCardProps {
  entries: QuarterlyAverageEntry[];
  selectedQuarter: Quarter;
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function QuarterlyAverageCard({ entries, selectedQuarter, theme, student }: QuarterlyAverageCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const current = entries.find((e) => e.quarter === selectedQuarter);
  const percent = current?.average ?? 0;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={`flex-1 flex flex-col rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <SectionHeader
        icon={ClipboardList}
        title="Quarterly Average"
        about={`Provides a comprehensive overview of ${student.firstName}'s average across all subjects for the selected quarter.`}
        theme={theme}
      />

      <div className="flex flex-col items-center justify-center flex-1">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke={darkMode ? "#1F2937" : "#F1F2F4"} strokeWidth="10" />
          {current?.average !== null && current?.average !== undefined && (
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
            {current?.average !== null && current?.average !== undefined ? `${current.average}%` : "—"}
          </text>
        </svg>
        <p className={`mt-1 text-sm font-semibold ${textMuted}`}>{current?.ratingLabel ?? "No Data"}</p>
      </div>
    </div>
  );
}
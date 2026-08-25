// components/ExtracurricularActivitiesCard.tsx
// NOTE: verify this path — see the same note in PersonalInformationCard.tsx
import { Trophy } from "lucide-react";
import SectionHeader from "../../../ui/SectionHeader";
import { Badge } from "./Badge";
import type { ExtracurricularActivity } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

interface ExtracurricularActivitiesCardProps {
  activities: ExtracurricularActivity[];
  theme: AdminThemeContext;
}

export function ExtracurricularActivitiesCard({
  activities,
  theme,
}: ExtracurricularActivitiesCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  return (
    <div className={`rounded-2xl border shadow-sm ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={Trophy}
        title="Extracurricular Activities"
        about="Clubs, organizations, and leadership roles the student is involved in."
        theme={theme}
      />

      <div className="p-5">
        {activities.length === 0 ? (
          <p className={`text-sm ${textMuted}`}>No extracurricular activities recorded.</p>
        ) : (
          <ul className="space-y-2.5">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${panelBorder} ${
                  darkMode ? "bg-white/5" : "bg-[#F9FAFB]"
                }`}
              >
                <span className={`text-sm font-bold uppercase tracking-wide ${textPrimary}`}>
                  {activity.activityName}
                </span>
                <Badge variant="maroon" darkMode={darkMode}>
                  {activity.role}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
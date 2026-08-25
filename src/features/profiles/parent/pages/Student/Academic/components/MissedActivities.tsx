import { CheckCircle2 } from "lucide-react";
import type { MissedActivity } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface MissedActivitiesProps {
  activities: MissedActivity[];
  theme: AdminThemeContext;
  student: DetailStudent;
}

export default function MissedActivities({ activities, theme, student }: MissedActivitiesProps) {
  const { darkMode, panelBg, panelBorder, textPrimary } = theme;

  const emptyIconBg = darkMode ? "bg-white/5" : "bg-gray-100";
  const emptyIcon = darkMode ? "text-gray-500" : "text-gray-400";
  const emptyText = darkMode ? "text-gray-500" : "text-gray-400";

  const countBadgeBg = darkMode ? "bg-white/10" : "bg-gray-100";
  const countBadgeText = darkMode ? "text-gray-300" : "text-gray-700";

  const itemBorder = darkMode ? "border-white/10" : "border-gray-100";
  const itemTitle = darkMode ? "text-gray-100" : "text-gray-900";
  const itemSub = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`rounded-2xl border${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={CheckCircle2}
        title="Missed Activities"
        about={`Tracks and reports on assignments and activities that ${student.firstName} has missed across all subjects.`}
        theme={theme}
      />


      <div className="flex justify-end mt-4 mr-5">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${countBadgeBg} ${countBadgeText}`}
        >
          {activities.length}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${emptyIconBg}`}
          >
            <CheckCircle2 size={18} className={emptyIcon} />
          </div>
          <p className={`text-xs ${emptyText}`}>
            No missed activities or assignments recorded across subjects.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {activities.map((a) => (
            <li
              key={a.id}
              className={`rounded-lg border px-3 py-2 text-sm ${itemBorder}`}
            >
              <p className={`font-semibold ${itemTitle}`}>{a.title}</p>
              <p className={`text-xs ${itemSub}`}>
                {a.subject} • Due {a.dueDate}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
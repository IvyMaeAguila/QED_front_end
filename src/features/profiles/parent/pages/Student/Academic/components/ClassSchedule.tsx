import { Clock } from "lucide-react";
import type { ScheduleItem } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface ClassScheduleProps {
  items: ScheduleItem[];
  theme: AdminThemeContext;
  student: DetailStudent;
}

export default function ClassSchedule({ items, theme, student }: ClassScheduleProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const accentColor = darkMode ? "border-red-400" : "border-red-800";

  return (
    <div className={`rounded-2xl border px-5 pb-5 ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={Clock}
        title="Class Schedule"
        about={`Displays the daily schedule for ${student.firstName}'s classes.`}
        theme={theme}
      />

      {/* <div className="flex items-center gap-1.5">
        <Clock size={14} className={textMuted} />
        <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
          Class Schedule
        </p>
      </div> */}

      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center justify-between gap-2 border-l-2 pl-3 ${accentColor}`}
          >
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>
                {item.subject}
              </p>
              <p className={`text-[11px] ${textMuted}`}>{item.teacher}</p>
            </div>
            <p className={`whitespace-nowrap text-xs font-semibold ${textPrimary}`}>
              {item.startTime} - {item.endTime}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
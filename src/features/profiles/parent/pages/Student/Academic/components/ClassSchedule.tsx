import { useState } from "react";
import { Clock } from "lucide-react";
import type { ScheduleDay } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";
import { ClassScheduleProvider, useClassSchedule } from "../context/classSchedule.context";

interface ClassScheduleProps {
  theme: AdminThemeContext;
  student: DetailStudent;
}

type DayFilter = "All" | ScheduleDay;

const DAYS: DayFilter[] = ["All", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default function ClassSchedule({ theme, student }: ClassScheduleProps) {
  return (
    <ClassScheduleProvider studentId={student.id}>
      <ClassScheduleContent theme={theme} student={student} />
    </ClassScheduleProvider>
  );
}

function ClassScheduleContent({ theme, student }: ClassScheduleProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const cardBg = darkMode
    ? "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]"
    : "bg-white hover:bg-gray-50 border-gray-100";

  const { items, loading, error } = useClassSchedule();

  const [selectedDay, setSelectedDay] = useState<DayFilter>("All");

  const filteredItems =
    selectedDay === "All" ? items : items.filter((item) => item.days.includes(selectedDay));

  const activeChip = darkMode
    ? "bg-red-400 text-black"
    : "bg-red-800 text-white";
  const inactiveChip = darkMode
    ? "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <div className={`rounded-2xl border px-5 pb-5 ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={Clock}
        title="Class Schedule"
        about={`Displays the daily schedule for ${student.firstName}'s classes.`}
        theme={theme}
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              selectedDay === day ? activeChip : inactiveChip
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={`mt-4 text-center text-xs ${textMuted}`}>Loading schedule...</p>
      ) : error ? (
        <p className={`mt-4 text-center text-xs text-red-500`}>{error}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {filteredItems.length === 0 ? (
            <li className={`rounded-lg py-4 text-center text-xs ${textMuted}`}>
              Walang schedule para sa {selectedDay}.
            </li>
          ) : (
            filteredItems.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl border py-2.5 px-3.5 transition-colors ${cardBg}`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${textPrimary}`}>
                    {item.subject}
                  </p>
                  <p className={`truncate text-[11px] ${textMuted}`}>{item.teacher}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`whitespace-nowrap text-xs font-semibold ${textPrimary}`}>
                    {item.startTime} - {item.endTime}
                  </p>
                  {selectedDay === "All" && (
                    <p className={`mt-0.5 truncate text-[10px] ${textMuted}`}>
                      {item.days.join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
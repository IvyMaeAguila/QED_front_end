import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows, rememberRows } from "@shared/loading/reservations";
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

  const { items, loading, error, retry } = useClassSchedule();

  const [selectedDay, setSelectedDay] = useState<DayFilter>("All");

  const filteredItems =
    selectedDay === "All" ? items : items.filter((item) => item.days.includes(selectedDay));

  const view = `parent-schedule:${student.id}:${selectedDay}`;
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

      <LoadingRegion name="parent-class-schedule" loading={loading} error={error} retry={retry} variable retainPrevious hasContent={filteredItems.length > 0} skeleton={null} onSettled={() => rememberRows(view, filteredItems.length)} frame={(pending) => (
        <ul className="mt-3 flex flex-col gap-2">
          {!pending && filteredItems.length === 0 ? (
            <li className={`rounded-lg py-4 text-center text-xs ${textMuted}`}>
              Walang schedule para sa {selectedDay}.
            </li>
          ) : (
            (pending ? Array.from({length:skeletonRows(view)},(_,i)=>({id:String(i),subject:"",teacher:"",startTime:"",endTime:"",days:[]})) : filteredItems).map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-lg border py-2.5 px-3.5 transition-colors ${cardBg}`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${textPrimary}`}>
                    {pending ? <SkeletonParagraph field={view+":subject:"+item.id} typical={1} width="14ch" /> : <span data-sk-field={view+":subject:"+item.id}>{item.subject}</span>}
                  </p>
                  <p className={`truncate text-xs ${textMuted}`}>{pending ? <SkeletonParagraph field={view+":teacher:"+item.id} typical={1} width="12ch" /> : <span data-sk-field={view+":teacher:"+item.id}>{item.teacher}</span>}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`whitespace-nowrap text-xs font-semibold ${textPrimary}`}>
                    {pending ? <SkeletonParagraph field={view+":time:"+item.id} typical={1} width="10ch" /> : <span data-sk-field={view+":time:"+item.id}>{item.startTime} - {item.endTime}</span>}
                  </p>
                  {selectedDay === "All" && (
                    <p className={`mt-0.5 truncate text-xs ${textMuted}`}>
                      {pending ? <SkeletonParagraph field={view+":days:"+item.id} typical={1} width="10ch" /> : <span data-sk-field={view+":days:"+item.id}>{item.days.join(" · ")}</span>}
                    </p>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}>{null}</LoadingRegion>
    </div>
  );
}
